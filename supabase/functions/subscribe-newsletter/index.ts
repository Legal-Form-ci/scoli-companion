import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendBrevoEmail, brandedEmail } from '../_shared/brevo.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = 'https://scoly.ci';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const email = String(body.email || '').toLowerCase().trim();
    const first_name = body.first_name ? String(body.first_name).slice(0, 80) : null;
    const source = body.source ? String(body.source).slice(0, 40) : 'website';
    const honeypot = body.website;

    if (honeypot) return ok({ success: true });
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || email.length > 255) {
      return bad('Email invalide');
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Rate-limit léger
    const { data: ipRl } = await admin.rpc('check_rate_limit', {
      _identifier: `nl_ip_${ip}`, _action_type: 'newsletter_subscribe',
      _max_attempts: 5, _window_seconds: 3600, _block_seconds: 1800,
    });
    if (ipRl && ipRl[0] && !ipRl[0].allowed) return bad('Trop de tentatives. Réessayez plus tard.', 429);

    // Generate confirmation + unsubscribe tokens (raw → returned in email link, hashed in DB)
    const confirmToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const unsubToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const sha256Hex = async (s: string) => {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    };
    const confirmHash = await sha256Hex(confirmToken);
    const unsubHash = await sha256Hex(unsubToken);

    const { data: existing } = await admin.from('newsletter_subscribers')
      .select('id, confirmed, is_active, unsubscribe_token_hash').eq('email', email).maybeSingle();

    let subscriberId: string;
    let already = false;
    let activeUnsubToken = unsubToken;
    if (existing) {
      subscriberId = existing.id;
      if (existing.confirmed && existing.is_active) already = true;
      // If already confirmed & active, do NOT silently re-confirm — just acknowledge and stop.
      if (already) {
        return ok({
          success: true,
          already: true,
          message: 'Vous êtes déjà abonné à notre newsletter.',
        });
      }
      // Re-issue confirmation token; keep existing unsub token if present
      await admin.from('newsletter_subscribers').update({
        first_name: first_name ?? undefined,
        source,
        confirmed: false,
        is_active: false,
        confirmation_token_hash: confirmHash,
        confirmation_sent_at: new Date().toISOString(),
        unsubscribe_token_hash: existing.unsubscribe_token_hash ?? unsubHash,
        unsubscribed_at: null,
      }).eq('id', existing.id);
    } else {
      const { data: inserted, error } = await admin.from('newsletter_subscribers').insert({
        email, first_name, source,
        is_active: false, confirmed: false,
        confirmation_token_hash: confirmHash,
        unsubscribe_token_hash: unsubHash,
        confirmation_sent_at: new Date().toISOString(),
      }).select('id').single();
      if (error) throw error;
      subscriberId = inserted.id;
    }

    // Double opt-in confirmation email
    const dedupeKey = `confirm:${email}:${new Date().toISOString().slice(0, 10)}`;
    const confirmUrl = `${SITE_URL}/unsubscribe?confirm=${confirmToken}`;
    const unsubUrl = `${SITE_URL}/unsubscribe?token=${activeUnsubToken}`;
    const html = brandedEmail({
      title: `Confirmez votre inscription${first_name ? `, ${first_name}` : ''} ✉️`,
      bodyHtml: `
        <p>Merci de votre intérêt pour <strong>Scoly</strong> !</p>
        <p>Pour finaliser votre inscription à notre newsletter et commencer à recevoir nos offres exclusives, cliquez sur le bouton ci-dessous.</p>
        <p style="color:#64748b;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — aucun abonnement ne sera activé.</p>
      `,
      ctaText: 'Confirmer mon inscription',
      ctaUrl: confirmUrl,
      footerExtra: `<a href="${unsubUrl}" style="color:#94a3b8;text-decoration:none;">Se désinscrire</a>`,
    });

    await sendBrevoEmail({
      from: { name: 'Scoly', email: 'newsletter@scoly.ci' },
      to: email,
      subject: '✉️ Confirmez votre inscription à la newsletter Scoly',
      html,
      category: 'doi',
      emailType: 'newsletter_confirmation',
      dedupeKey,
      metadata: { subscriber_id: subscriberId, source },
    }).catch((e) => console.error('confirmation email error:', e));

    return ok({
      success: true,
      already: false,
      message: 'Vérifiez votre boîte mail et cliquez sur le lien pour confirmer votre abonnement.',
    });
  } catch (e) {
    console.error('subscribe-newsletter error:', e);
    return bad(String((e as Error).message || e), 400);
  }
});

function ok(d: unknown) {
  return new Response(JSON.stringify(d), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
