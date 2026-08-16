// 🎨 Module centralisé de branding email Scoly
// ─────────────────────────────────────────────
// SOURCE UNIQUE de vérité pour : logo (URL + base64 fallback), couleurs,
// typographie, entête et pied de page de tous les emails (transactionnels +
// marketing). Tout nouvel email DOIT utiliser `brandedEmail()` ou au minimum
// `EMAIL_BRAND` pour garantir la cohérence visuelle automatique lorsque le
// logo ou la charte évoluent.

import { SCOLY_LOGO_BASE64 } from "./logo-base64.ts";

/** URL stable hébergée du logo (Lovable CDN — version optimisée 360px). */
export const SCOLY_LOGO_URL =
  "https://scoly-ci-play.lovable.app/logo-scoly-email.png";

/** Fallback Base64 inline (déclenché par `onerror` si le client mail bloque les images distantes). */
export { SCOLY_LOGO_BASE64 };

/** Tokens de marque réutilisables — une seule source pour toute la suite email. */
export const EMAIL_BRAND = {
  name: "Scoly",
  tagline: "Fournitures scolaires & bureautiques",
  contactEmail: "contact@scoly.ci",
  city: "Abidjan, Côte d'Ivoire",
  logoUrl: SCOLY_LOGO_URL,
  logoBase64: SCOLY_LOGO_BASE64,
  colors: {
    primaryDark: "#0f172a",   // navy 900
    primary: "#1e3a8a",       // navy 800 (logo)
    accent: "#f59e0b",        // orange 500 (logo)
    accentDark: "#d97706",    // orange 600
    link: "#60a5fa",          // blue 400
    bg: "#f3f4f6",
    surface: "#ffffff",
    text: "#111827",
    muted: "#374151",
    border: "#e5e7eb",
  },
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
} as const;

export interface BrandedEmailOptions {
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerExtra?: string;
  /** Optionnel — bannière au-dessus du contenu (ex: image générée IA). */
  bannerImageUrl?: string;
  /** Optionnel — pré-entête (texte gris affiché en aperçu inbox). */
  preheader?: string;
}

/**
 * Wrapper officiel pour TOUS les emails Scoly.
 *
 * Garantit :
 * - logo URL stable + fallback Base64 inline (Outlook desktop, Gmail blocage images)
 * - palette couleurs unique (navy + orange du nouveau logo)
 * - structure responsive testée Gmail / Outlook / Apple Mail / mobile
 * - pré-entête optionnel pour optimiser l'aperçu inbox
 */
export function brandedEmail(opts: BrandedEmailOptions): string {
  const c = EMAIL_BRAND.colors;
  const banner = opts.bannerImageUrl
    ? `<img src="${opts.bannerImageUrl}" alt="" style="display:block;width:100%;max-height:280px;object-fit:cover;border-radius:0;" />`
    : "";
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${opts.preheader}</div>`
    : "";

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${c.bg};font-family:${EMAIL_BRAND.font};color:${c.text};">
  ${preheader}
  <div style="max-width:640px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,${c.primaryDark} 0%,${c.primary} 100%);padding:28px;border-radius:16px 16px 0 0;text-align:center;">
      <img src="${EMAIL_BRAND.logoUrl}" alt="${EMAIL_BRAND.name}" width="180" style="display:inline-block;max-width:180px;height:auto;background:#fff;padding:10px 18px;border-radius:12px;" onerror="this.onerror=null;this.src='${EMAIL_BRAND.logoBase64}';" />
      <p style="margin:14px 0 0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">${EMAIL_BRAND.tagline}</p>
    </div>
    ${banner}
    <div style="background:${c.surface};padding:32px;border-left:1px solid ${c.border};border-right:1px solid ${c.border};">
      <h1 style="margin:0 0 16px;font-size:22px;color:${c.primaryDark};">${opts.title}</h1>
      <div style="font-size:15px;line-height:1.7;color:${c.muted};">${opts.bodyHtml}</div>
      ${opts.ctaText && opts.ctaUrl ? `<div style="text-align:center;margin:28px 0;"><a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${c.accent},${c.accentDark});color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;">${opts.ctaText}</a></div>` : ""}
    </div>
    <div style="background:${c.primaryDark};padding:24px;border-radius:0 0 16px 16px;text-align:center;color:rgba(255,255,255,0.6);font-size:11px;">
      ${opts.footerExtra || ""}
      <p style="margin:8px 0 0;">© ${new Date().getFullYear()} ${EMAIL_BRAND.name} — ${EMAIL_BRAND.city} — <a href="mailto:${EMAIL_BRAND.contactEmail}" style="color:${c.link};text-decoration:none;">${EMAIL_BRAND.contactEmail}</a></p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
}

/**
 * Liste documentée des cas où le fallback Base64 doit s'activer (déclenché
 * automatiquement par `onerror` sur la balise <img>) :
 *
 * 1. Outlook Desktop (2016/2019/365) — bloque par défaut les images distantes
 *    tant que l'utilisateur ne clique pas "Télécharger les images".
 * 2. Gmail web — premier rendu d'un nouvel expéditeur : images masquées tant
 *    que l'utilisateur n'a pas marqué l'expéditeur comme fiable.
 * 3. Apple Mail (Privacy Protection activée) — proxy parfois en échec sur
 *    domaines fraîchement publiés / SSL en cours de propagation.
 * 4. Yahoo Mail / AOL — blocage images promotionnelles si SPF/DKIM partiels.
 * 5. Réseaux d'entreprise filtrés (proxy/firewall) — domaine `lovable.app`
 *    parfois bloqué ; le base64 reste affiché.
 * 6. Mode hors-ligne (cache local mail) — l'URL distante échoue, base64 OK.
 * 7. CDN Lovable temporairement indisponible (5xx) — `onerror` bascule.
 */
export const FALLBACK_BASE64_CASES = [
  "outlook_desktop_image_block",
  "gmail_first_render_unknown_sender",
  "apple_mail_privacy_proxy_failure",
  "yahoo_aol_promotional_block",
  "corporate_proxy_domain_block",
  "offline_mail_cache",
  "cdn_temporary_5xx",
] as const;
