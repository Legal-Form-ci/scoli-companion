import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SMSING_API_URL = Deno.env.get('SMSING_API_URL') ?? 'https://panel.smsing.app/smsAPI';
const SMSING_API_KEY = Deno.env.get('SMSING_API_KEY');
const SMSING_API_TOKEN = Deno.env.get('SMSING_API_TOKEN');
const SMSING_SENDER = Deno.env.get('SMSING_SENDER_ID') ?? 'SCOLY';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function render(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
}

function normalizePhone(raw: string) {
  const cleaned = String(raw).replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('225')) return digits;
  return `225${digits.replace(/^0+/, '')}`;
}

async function sendOne(to: string, body: string) {
  // API TP Cloud / smsing.app : requête GET avec l'action `sendsms` en premier paramètre
  const qs = new URLSearchParams({
    apikey: SMSING_API_KEY!,
    apitoken: SMSING_API_TOKEN!,
    type: 'sms',
    from: SMSING_SENDER,
    to,
    text: body,
    route: '0',
  });

  const url = `${SMSING_API_URL}?sendsms&${qs.toString()}`;
  const res = await fetch(url, { method: 'GET' });

  const raw = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(raw); } catch { /* réponse texte */ }
  const status = String(parsed?.status ?? '').toLowerCase();
  const ok = res.ok && (status === 'queued' || status === 'success' || status === 'sent');
  return {
    ok,
    raw: (parsed?.message ? String(parsed.message) : raw).slice(0, 500),
    parsed,
    status: res.status,
  };
}

async function getBalance() {
  const qs = new URLSearchParams({ apikey: SMSING_API_KEY!, apitoken: SMSING_API_TOKEN! });
  const res = await fetch(`${SMSING_API_URL}?balance&${qs.toString()}`, { method: 'GET' });
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return { raw }; }
}

async function getGroupStatus(groupId: string) {
  const qs = new URLSearchParams({ apikey: SMSING_API_KEY!, apitoken: SMSING_API_TOKEN!, groupid: groupId });
  const res = await fetch(`${SMSING_API_URL}?groupstatus&${qs.toString()}`, { method: 'GET' });
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return { raw }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!SMSING_API_KEY || !SMSING_API_TOKEN) {
      return json({ error: 'SMS non configuré', hint: 'Définissez SMSING_API_KEY et SMSING_API_TOKEN.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);

    const userId = claimsData.claims.sub as string;
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRows } = await sbAdmin.from('user_roles').select('role').eq('user_id', userId);
    const roleList = (roleRows || []).map((r: any) => r.role);
    const allowed = ['admin', 'super_admin', 'moderator'].some((r) => roleList.includes(r));
    if (!allowed) return json({ error: 'Forbidden' }, 403);

    const payload = await req.json();
    const { template_key, variables = {}, body: rawBody } = payload;
    const recipients: string[] = Array.isArray(payload.to) ? payload.to : payload.to ? [payload.to] : [];
    if (recipients.length === 0) return json({ error: 'Destinataire requis' }, 400);
    if (recipients.length > 500) return json({ error: 'Maximum 500 destinataires par envoi' }, 400);

    let body: string | undefined = typeof rawBody === 'string' ? rawBody : undefined;
    if (!body && template_key) {
      const { data: tpl } = await sbAdmin
        .from('sms_templates')
        .select('body,is_active')
        .eq('key', template_key)
        .maybeSingle();
      if (!tpl || !tpl.is_active) return json({ error: `Modèle inactif ou introuvable: ${template_key}` }, 404);
      body = render(tpl.body, variables);
    }
    if (!body?.trim()) return json({ error: 'body ou template_key requis' }, 400);
    body = body.slice(0, 160);

    const results: Array<{ to: string; ok: boolean; error?: string }> = [];

    for (const rawTo of recipients) {
      const to = normalizePhone(rawTo);
      let outcome;
      try {
        outcome = await sendOne(to, body);
      } catch (e) {
        outcome = { ok: false, raw: (e as Error).message, parsed: null, status: 0 };
      }

      await sbAdmin.from('sms_logs').insert({
        recipient: to,
        body,
        template_key: template_key ?? null,
        status: outcome.ok ? 'sent' : 'failed',
        provider: 'smsing',
        provider_message_id: outcome.parsed?.id ?? outcome.parsed?.message_id ?? null,
        error_message: outcome.ok ? null : outcome.raw,
        sent_by: userId,
        metadata: { http_status: outcome.status },
      });

      results.push({ to, ok: outcome.ok, error: outcome.ok ? undefined : outcome.raw });
    }

    const sent = results.filter((r) => r.ok).length;
    return json({ ok: sent > 0, sent, failed: results.length - sent, results });
  } catch (e) {
    console.error('[send-sms]', e);
    return json({ error: (e as Error).message }, 500);
  }
});
