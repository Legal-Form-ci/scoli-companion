// Multi-provider email helper (Brevo principal, Resend secondaire)
// - bascule automatique quand Brevo dépasse sa limite quotidienne
// - retries avec backoff exponentiel
// - journalisation complète via reserve_email_log / finalize_email_log
// - déduplication via dedupe_key

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

export const DEFAULT_FROM = {
  name: Deno.env.get("EMAIL_FROM_NAME") || "Scoly",
  email: Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@scoly.ci",
};
// Sender de secours quand le domaine principal n'est pas vérifié sur Resend.
export const RESEND_FALLBACK_FROM = { name: "Scoly", email: "onboarding@resend.dev" };
export const BREVO_DAILY_LIMIT = 300;
export const RESEND_DAILY_LIMIT = 100;

export type EmailProvider = "brevo" | "resend";
export type EmailStatus = "sent" | "failed" | "skipped" | "queued";

export interface BrevoEmail {
  to: string | string[];
  subject: string;
  html: string;
  from?: { name: string; email: string };
  replyTo?: string;
  text?: string;
  /** Catégorie business (welcome, order_confirmation, contact, ...) */
  category?: string;
  /** Type technique d'email (newsletter, transactional, ...) */
  emailType?: string;
  /** Clé d'idempotence : si déjà envoyée, l'envoi est ignoré */
  dedupeKey?: string;
  /** Métadonnées libres journalisées */
  metadata?: Record<string, unknown>;
  /** Référence à une commande optionnelle */
  orderId?: string | null;
  /** Force un fournisseur (sinon : auto). */
  preferredProvider?: EmailProvider;
  /** Pièces jointes optionnelles (base64) */
  attachments?: Array<{ name: string; content: string; type?: string }>;
}

export interface SendResult {
  ok: boolean;
  provider?: EmailProvider;
  messageId?: string | null;
  status: EmailStatus;
  error?: string;
  retryable?: boolean;
  skipped?: boolean;
  logId?: string;
}

let cachedAdmin: SupabaseClient | null = null;
function admin(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  if (!cachedAdmin) cachedAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
  return cachedAdmin;
}

async function getDailyCount(provider: EmailProvider): Promise<number> {
  const a = admin();
  if (!a) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await a
    .from("email_provider_daily_stats")
    .select("sent_count")
    .eq("stat_date", today)
    .eq("provider", provider)
    .maybeSingle();
  return (data?.sent_count as number | undefined) ?? 0;
}

async function pickProvider(preferred?: EmailProvider): Promise<EmailProvider | null> {
  const brevoOk = !!BREVO_API_KEY;
  const resendOk = !!RESEND_API_KEY;
  if (preferred === "resend" && resendOk) return "resend";
  if (preferred === "brevo" && brevoOk) return "brevo";

  if (brevoOk) {
    const used = await getDailyCount("brevo");
    if (used < BREVO_DAILY_LIMIT) return "brevo";
  }
  if (resendOk) {
    const used = await getDailyCount("resend");
    if (used < RESEND_DAILY_LIMIT) return "resend";
  }
  // Tout est saturé : on retombe sur Brevo si dispo (échec géré ensuite), sinon null
  if (brevoOk) return "brevo";
  if (resendOk) return "resend";
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(status: number) {
  return status === 429 || status >= 500;
}

async function callBrevo(opts: BrevoEmail) {
  const toArr = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((email) => ({ email }));
  const body: Record<string, unknown> = {
    sender: opts.from || DEFAULT_FROM,
    to: toArr,
    subject: opts.subject,
    htmlContent: opts.html,
  };
  if (opts.text) body.textContent = opts.text;
  if (opts.replyTo) body.replyTo = { email: opts.replyTo };
  if (opts.category) body.tags = [opts.category];
  if (opts.attachments?.length) {
    body.attachment = opts.attachments.map((a) => ({ name: a.name, content: a.content }));
  }

  const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return {
      ok: false as const,
      status: resp.status,
      error: typeof data === "object" ? JSON.stringify(data) : String(data),
      retryable: isRetryable(resp.status),
      messageId: null,
    };
  }
  return { ok: true as const, status: resp.status, messageId: (data as any).messageId ?? null };
}

async function callResend(opts: BrevoEmail, useFallbackFrom = false) {
  const toArr = Array.isArray(opts.to) ? opts.to : [opts.to];
  const sender = useFallbackFrom ? RESEND_FALLBACK_FROM : (opts.from || DEFAULT_FROM);
  const body: Record<string, unknown> = {
    from: `${sender.name} <${sender.email}>`,
    to: toArr,
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.text) body.text = opts.text;
  if (opts.replyTo) body.reply_to = opts.replyTo;
  if (opts.category) body.tags = [{ name: "category", value: opts.category }];
  if (opts.attachments?.length) {
    body.attachments = opts.attachments.map((a) => ({
      filename: a.name,
      content: a.content,
      content_type: a.type || "application/pdf",
    }));
  }


  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return {
      ok: false as const,
      status: resp.status,
      error: typeof data === "object" ? JSON.stringify(data) : String(data),
      retryable: isRetryable(resp.status),
      messageId: null,
    };
  }
  return { ok: true as const, status: resp.status, messageId: (data as any).id ?? null };
}

async function trySend(provider: EmailProvider, opts: BrevoEmail) {
  const maxAttempts = 3;
  let lastErr: { error: string; retryable: boolean; status?: number } | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const r = provider === "brevo" ? await callBrevo(opts) : await callResend(opts);
    if (r.ok) return { ok: true as const, messageId: r.messageId, attempts: attempt, provider };
    lastErr = { error: r.error, retryable: r.retryable, status: r.status };
    // Erreur 4xx liée au sender → on tente le sender de secours pour Resend
    if (provider === "resend" && r.status && r.status >= 400 && r.status < 500 &&
        /from|domain|sender|verif/i.test(r.error || "")) {
      console.warn("[email] Resend sender refused, retrying with onboarding@resend.dev");
      const r2 = await callResend(opts, true);
      if (r2.ok) return { ok: true as const, messageId: r2.messageId, attempts: attempt + 1, provider };
      lastErr = { error: r2.error, retryable: r2.retryable, status: r2.status };
    }
    if (!r.retryable) break;
    await sleep(300 * Math.pow(2, attempt - 1));
  }
  console.error(`[email] ${provider} failed:`, lastErr);
  return { ok: false as const, error: lastErr?.error || "unknown", retryable: !!lastErr?.retryable, attempts: maxAttempts, provider };
}

/**
 * Envoi multi-fournisseur avec retries, fallback et journalisation.
 * Compatible avec l'ancienne signature `sendBrevoEmail({to, subject, html, ...})`.
 */
export async function sendBrevoEmail(opts: BrevoEmail): Promise<SendResult> {
  if (!BREVO_API_KEY && !RESEND_API_KEY) {
    console.warn("Aucun fournisseur email configuré (BREVO_API_KEY/RESEND_API_KEY).");
    return { ok: false, status: "skipped", skipped: true, error: "no_provider" };
  }

  const a = admin();
  let logId: string | undefined;
  if (a && opts.dedupeKey) {
    try {
      const { data } = await a.rpc("reserve_email_log", {
        _dedupe_key: opts.dedupeKey,
        _recipient_email: Array.isArray(opts.to) ? opts.to[0] : opts.to,
        _email_type: opts.emailType || opts.category || "transactional",
        _email_category: opts.category || null,
        _order_id: opts.orderId || null,
        _metadata: opts.metadata || {},
      });
      const row = (Array.isArray(data) ? data[0] : data) as { id?: string; status?: string } | null;
      if (row?.status === "sent") {
        return { ok: true, provider: undefined, status: "skipped", skipped: true, messageId: null, logId: row.id };
      }
      logId = row?.id;
    } catch (e) {
      console.error("reserve_email_log failed:", e);
    }
  }

  const primary = await pickProvider(opts.preferredProvider);
  if (!primary) {
    return { ok: false, status: "failed", error: "no_provider_available" };
  }

  let provider = primary;
  let result = await trySend(provider, opts);
  // Compteur quotidien (succès ou échec) pour le fournisseur effectivement appelé
  if (a) { try { await a.rpc("increment_email_provider_stat", { _provider: provider, _success: result.ok }); } catch (e) { console.error("increment_email_provider_stat", e); } }

  // Fallback : si Brevo échoue → Resend (ou inverse) si l'autre fournisseur est dispo
  if (!result.ok) {
    const alt: EmailProvider = provider === "brevo" ? "resend" : "brevo";
    const altKey = alt === "brevo" ? BREVO_API_KEY : RESEND_API_KEY;
    if (altKey) {
      const alt2 = await trySend(alt, opts);
      if (a) { try { await a.rpc("increment_email_provider_stat", { _provider: alt, _success: alt2.ok }); } catch (e) { console.error("increment_email_provider_stat", e); } }
      if (alt2.ok) {
        provider = alt;
        result = alt2;
      }
    }
  }

  // Journalisation finale
  if (a && logId) {
    try {
      await a.rpc("finalize_email_log", {
        _log_id: logId,
        _provider: provider,
        _status: result.ok ? "sent" : "failed",
        _provider_message_id: result.ok ? result.messageId ?? null : null,
        _error_message: result.ok ? null : result.error,
        _retryable: result.ok ? false : result.retryable,
        _attempt_increment: result.attempts,
        _metadata_patch: { last_provider: provider, attempts: result.attempts },
      });
    } catch (e) {
      console.error("finalize_email_log failed:", e);
    }
  } else if (a) {
    // Pas de dedupeKey — journalisation simple
    try {
      const { data: log } = await a.rpc("reserve_email_log", {
        _dedupe_key: null,
        _recipient_email: Array.isArray(opts.to) ? opts.to[0] : opts.to,
        _email_type: opts.emailType || opts.category || "transactional",
        _email_category: opts.category || null,
        _order_id: opts.orderId || null,
        _metadata: opts.metadata || {},
      });
      const row = (Array.isArray(log) ? log[0] : log) as { id?: string } | null;
      if (row?.id) {
        await a.rpc("finalize_email_log", {
          _log_id: row.id,
          _provider: provider,
          _status: result.ok ? "sent" : "failed",
          _provider_message_id: result.ok ? result.messageId ?? null : null,
          _error_message: result.ok ? null : result.error,
          _retryable: result.ok ? false : result.retryable,
          _attempt_increment: result.attempts,
          _metadata_patch: { last_provider: provider, attempts: result.attempts },
        });
        logId = row.id;
      }
    } catch (e) {
      console.error("log fallback failed:", e);
    }
  }

  return {
    ok: result.ok,
    provider,
    messageId: result.ok ? result.messageId ?? null : null,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? undefined : result.error,
    retryable: result.ok ? false : result.retryable,
    logId,
  };
}

// 🎨 Branding email centralisé — voir _shared/email-branding.ts (source unique).
export {
  SCOLY_LOGO_URL,
  SCOLY_LOGO_BASE64,
  EMAIL_BRAND,
  brandedEmail,
} from "./email-branding.ts";
