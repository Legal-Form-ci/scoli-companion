// Génère le contenu d'un email Scoly (sujet + preheader + HTML brandé) avec optionnellement
// un visuel généré par IA (bannière, promo, produits, …).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const LOGO_URL = 'https://scoly-ci-play.lovable.app/logo-scoly-email.png';
import { SCOLY_LOGO_BASE64 } from '../_shared/logo-base64.ts';

const VISUAL_PROMPTS: Record<string, string> = {
  newsletter: "Une bannière éditoriale moderne pour la newsletter Scoly (fournitures scolaires Côte d'Ivoire). Composition épurée, palette bleu marine #1e3a8a et orange vif #f97316, accent or. Pas de texte. Format paysage 16:9.",
  promotion: "Une bannière promotionnelle ecommerce style 'mega vente' pour Scoly. Fournitures scolaires (cahiers, sacs, stylos) disposées en composition dynamique sur fond bleu marine et orange. Étiquettes prix discrètes. Style commerce premium, photo réaliste. Format paysage 16:9.",
  welcome: "Une illustration accueillante : élèves africains heureux avec sacs Scoly et fournitures, ambiance lumineuse, palette bleu marine et orange. Pas de texte. Format paysage 16:9.",
  back_to_school: "Une bannière 'rentrée scolaire' joyeuse en Côte d'Ivoire : enfants en uniforme, cahiers, sacs à dos colorés, palette bleu marine #1e3a8a et orange #f97316. Style photo éditoriale moderne. Format paysage 16:9.",
  announcement: "Une bannière d'annonce officielle Scoly : composition minimaliste sur fond bleu marine, accent orange, sensation premium et institutionnelle. Pas de texte. Format paysage 16:9.",
};

async function generateImageDataUrl(prompt: string): Promise<string | null> {
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });
    if (!r.ok) { console.error('image gen failed', r.status, await r.text()); return null; }
    const d = await r.json();
    const url = d.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return typeof url === 'string' ? url : null;
  } catch (e) { console.error('image gen exception', e); return null; }
}

function brandWrap(title: string, preheader: string, inner: string, imageUrl: string | null) {
  const banner = imageUrl
    ? `<tr><td style="padding:0;"><img src="${imageUrl}" alt="${title}" style="display:block;width:100%;height:auto;" /></td></tr>`
    : '';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;">
  <span style="display:none;font-size:1px;color:#f3f4f6;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px -12px rgba(15,23,42,0.18);">
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#2563eb 100%);padding:30px 24px;text-align:center;">
          <img src="${LOGO_URL}" alt="Scoly" width="180" style="display:inline-block;background:#ffffff;padding:10px 18px;border-radius:12px;max-width:180px;height:auto;" onerror="this.onerror=null;this.src='${SCOLY_LOGO_BASE64}';" />
          <p style="margin:14px 0 0;color:rgba(255,255,255,0.78);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Fournitures scolaires &amp; bureautiques</p>
        </td></tr>
        ${banner}
        <tr><td style="padding:32px 28px;">${inner}</td></tr>
        <tr><td style="background:#0f172a;padding:22px;text-align:center;color:rgba(255,255,255,0.65);font-size:11px;">
          © ${new Date().getFullYear()} Scoly — Abidjan, Côte d'Ivoire — <a href="mailto:contact@scoly.ci" style="color:#fb923c;text-decoration:none;">contact@scoly.ci</a><br/>
          <a href="{{unsubscribe_url}}" style="color:#94a3b8;">Se désinscrire</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = auth.replace('Bearer ', '');
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: roleRow } = await adminClient
      .from('user_roles').select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'moderator']).maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { prompt, type = 'newsletter', with_visual = false, visual_prompt } = await req.json();
    if (!prompt) throw new Error('prompt required');

    const systemPrompt = `Tu es expert en email marketing pour Scoly (scoly.ci, fournitures scolaires & bureautiques en Côte d'Ivoire). Charte : Bleu marine #1e3a8a + Orange #f97316. Réponds en JSON STRICT : { "subject": "...", "preheader": "...", "inner_html": "<...>" }.
- "subject" max 60 caractères, accrocheur, en français.
- "preheader" max 100 caractères.
- "inner_html" : UNIQUEMENT le contenu intérieur (h1, paragraphes, listes, CTA). Inline styles uniquement. NE PAS répéter logo/header/footer (le wrapper Scoly s'en charge). Boutons CTA : background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block.
- Inclure variable {{first_name}} dans la salutation.
Type demandé : ${type}.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) throw new Error(`AI gateway: ${resp.status} ${await resp.text()}`);
    const data = await resp.json();
    const content = JSON.parse(data.choices[0].message.content);

    let imageUrl: string | null = null;
    if (with_visual) {
      const vp = visual_prompt || VISUAL_PROMPTS[type] || VISUAL_PROMPTS.newsletter;
      imageUrl = await generateImageDataUrl(`${vp} Sujet: "${content.subject}". Pas de logo, pas de texte sur l'image.`);
    }

    const html_content = brandWrap(content.subject, content.preheader || '', content.inner_html || '', imageUrl);
    return new Response(JSON.stringify({
      subject: content.subject,
      preheader: content.preheader || '',
      html_content,
      image_url: imageUrl,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('generate-email-content error:', e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
