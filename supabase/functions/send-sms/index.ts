import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER'); // ex: +2250xxxxxxxx
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function render(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ''));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return new Response(JSON.stringify({
        error: 'Twilio non configuré',
        hint: 'Connectez Twilio via Lovable et définissez TWILIO_FROM_NUMBER.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Require authentication + admin/moderator role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authed = createClient(SUPABASE_URL, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;
    const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await sbAdmin.from('user_roles').select('role').eq('user_id', userId);
    const roleList = (roles || []).map((r: any) => r.role);
    if (!roleList.includes('admin') && !roleList.includes('moderator')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { to, template_key, variables = {}, body: rawBody } = await req.json();
    if (!to) return new Response(JSON.stringify({ error: 'to requis' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    let body = rawBody as string | undefined;
    if (!body && template_key) {
      const { data: tpl } = await sbAdmin.from('sms_templates')
        .select('body,is_active').eq('key', template_key).maybeSingle();
      if (!tpl || !tpl.is_active) {
        return new Response(JSON.stringify({ error: `Modèle inactif ou introuvable: ${template_key}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      body = render(tpl.body, variables);
    }
    if (!body) return new Response(JSON.stringify({ error: 'body ou template_key requis' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    body = body.slice(0, 320); // Twilio segments; keep short

    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[send-sms] twilio failed', res.status, err);
      return new Response(JSON.stringify({ error: 'Twilio a rejeté l\'envoi', status: res.status, details: err }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const json = await res.json();
    return new Response(JSON.stringify({ ok: true, sid: json.sid, to, body }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[send-sms]', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
