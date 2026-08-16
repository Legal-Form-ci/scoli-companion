// 🛡️ Test de non-régression — branding email Scoly
// ──────────────────────────────────────────────────
// Vérifie que le module centralisé `_shared/email-branding.ts` continue
// d'embarquer le NOUVEAU logo Scoly (URL stable + base64 fallback) et la
// palette de couleurs officielle. Si quelqu'un modifie ces tokens sans le
// vouloir, ce test casse immédiatement.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const brandingPath = path.join(root, "supabase/functions/_shared/email-branding.ts");
const logoBase64Path = path.join(root, "supabase/functions/_shared/logo-base64.ts");
const brevoPath = path.join(root, "supabase/functions/_shared/brevo.ts");

const NEW_LOGO_URL = "https://scoly-ci-play.lovable.app/logo-scoly-email.png";
const BRAND_COLORS = {
  primaryDark: "#0f172a",
  primary: "#1e3a8a",
  accent: "#f59e0b",
  accentDark: "#d97706",
};

describe("Email branding — non-regression", () => {
  it("le module centralisé existe", () => {
    expect(existsSync(brandingPath)).toBe(true);
    expect(existsSync(logoBase64Path)).toBe(true);
  });

  it("utilise la nouvelle URL de logo Scoly", () => {
    const src = readFileSync(brandingPath, "utf8");
    expect(src).toContain(NEW_LOGO_URL);
    // On ne doit jamais réintroduire l'ancienne URL .ci/logo-scoly.png
    expect(src).not.toContain("scoly.ci/logo-scoly.png");
  });

  it("expose un fallback Base64 (Outlook / Gmail / proxy d'entreprise)", () => {
    const src = readFileSync(brandingPath, "utf8");
    expect(src).toMatch(/SCOLY_LOGO_BASE64/);
    expect(src).toMatch(/onerror=/);
    const b64 = readFileSync(logoBase64Path, "utf8");
    expect(b64).toMatch(/data:image\/(png|jpe?g);base64,/i);
  });

  it("conserve la palette de couleurs officielle (navy + orange du logo)", () => {
    const src = readFileSync(brandingPath, "utf8");
    for (const c of Object.values(BRAND_COLORS)) {
      expect(src.toLowerCase()).toContain(c);
    }
  });

  it("brevo.ts ré-exporte uniquement depuis le module centralisé", () => {
    const src = readFileSync(brevoPath, "utf8");
    expect(src).toMatch(/from\s+["']\.\/email-branding\.ts["']/);
    // brevo.ts ne doit PAS redéfinir une fonction brandedEmail locale
    const localDecl = /export\s+function\s+brandedEmail\s*\(/.test(src);
    expect(localDecl).toBe(false);
  });

  it("documente les cas de fallback Base64", () => {
    const src = readFileSync(brandingPath, "utf8");
    expect(src).toMatch(/FALLBACK_BASE64_CASES/);
    expect(src).toMatch(/outlook_desktop_image_block/);
    expect(src).toMatch(/gmail_first_render_unknown_sender/);
  });
});
