import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrevoEmail } from "../_shared/brevo.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication to prevent the function from being used as a spam relay
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentification requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(
      authHeader.replace('Bearer ', '')
    );
    if (authErr || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Session invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: 3 messages per hour per user, 5 per hour per IP
    const adminClient = createClient(supabaseUrl, serviceKey);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const [{ data: userRl }, { data: ipRl }] = await Promise.all([
      adminClient.rpc('check_rate_limit', {
        _identifier: `contact_user_${claims.claims.sub}`,
        _action_type: 'send_contact_email',
        _max_attempts: 3, _window_seconds: 3600, _block_seconds: 3600,
      }),
      adminClient.rpc('check_rate_limit', {
        _identifier: `contact_ip_${ip}`,
        _action_type: 'send_contact_email',
        _max_attempts: 5, _window_seconds: 3600, _block_seconds: 3600,
      }),
    ]);
    if ((userRl?.[0] && !userRl[0].allowed) || (ipRl?.[0] && !ipRl[0].allowed)) {
      return new Response(
        JSON.stringify({ error: 'Trop de messages envoyés. Réessayez plus tard.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, subject, message } = await req.json();

    // Server-side validation
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Données invalides : dépassement de longueur' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Adresse email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs — strip HTML
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, '').trim();
    const safeName = sanitize(name);
    const safeSubject = sanitize(subject);
    const safeMessage = sanitize(message);

    const FROM = { name: 'Scoly', email: 'contact@scoly.ci' };

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nouveau message de contact — Scoly</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Scoly</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Nouveau message de contact</p>
    </div>
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;width:120px;">De :</td>
          <td style="padding:10px 0;color:#111827;font-weight:600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;">Email :</td>
          <td style="padding:10px 0;"><a href="mailto:${email}" style="color:#3b82f6;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:13px;">Sujet :</td>
          <td style="padding:10px 0;color:#111827;font-weight:600;">${safeSubject}</td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <h3 style="margin:0 0 12px;color:#374151;">Message :</h3>
      <div style="background:#f8fafc;border-radius:8px;padding:20px;color:#374151;line-height:1.7;white-space:pre-wrap;">${safeMessage}</div>
    </div>
    <div style="background:#0f172a;padding:20px;border-radius:0 0 16px 16px;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">© ${new Date().getFullYear()} Scoly — Abidjan, Côte d'Ivoire</p>
    </div>
  </div>
</body>
</html>`;

    // Confirmation to user
    const confirmHtml = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Message reçu — Scoly</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px;border-radius:16px 16px 0 0;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Scoly</h1>
    </div>
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;text-align:center;">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h2 style="color:#111827;margin:0 0 12px;">Message bien reçu !</h2>
      <p style="color:#6b7280;line-height:1.7;">Bonjour <strong>${safeName}</strong>, merci pour votre message.<br>Notre équipe vous répondra dans les plus brefs délais (48h max).</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;text-align:left;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Votre sujet</p>
        <p style="margin:4px 0 0;color:#374151;font-weight:600;">${safeSubject}</p>
      </div>
    </div>
    <div style="background:#0f172a;padding:20px;border-radius:0 0 16px 16px;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">© ${new Date().getFullYear()} Scoly — <a href="mailto:contact@scoly.ci" style="color:#60a5fa;">contact@scoly.ci</a></p>
    </div>
  </div>
</body>
</html>`;

    // Try to send with Resend, fallback to logging only
    const [adminEmail, userEmail] = await Promise.all([
      sendBrevoEmail({
        from: FROM,
        to: 'contact@scoly.ci',
        replyTo: email,
        subject: `[Contact Scoly] ${safeSubject}`,
        html,
      }),
      sendBrevoEmail({
        from: FROM,
        to: email,
        subject: '✅ Nous avons bien reçu votre message — Scoly',
        html: confirmHtml,
      }),
    ]);

    if (!adminEmail.ok || !userEmail.ok) {
      console.error('Email send failed:', adminEmail, userEmail);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Message envoyé avec succès' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-contact-email:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de l\'envoi du message' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
