#!/usr/bin/env -S deno run -A
// 🔍 Audit branding email — vérifie que chaque fonction edge qui envoie un
// email utilise le module centralisé `_shared/email-branding.ts` (logo URL
// stable + tokens couleurs). Sortie : 0 si tout est conforme, 1 sinon.
//
// Usage : deno run -A scripts/audit-email-branding.ts
//         (ou)  bun scripts/audit-email-branding.ts

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

const ROOT = new URL("../supabase/functions/", import.meta.url).pathname;
const REQUIRED_IMPORT = /from\s+["'][^"']*_shared\/(email-branding|brevo)\.ts["']/;
const SENDS_EMAIL = /(sendBrevoEmail|sendResendEmail|trySend|smtp\/email|resend\.com\/emails)/;
const HARD_CODED_LOGO = /(scoly\.ci\/logo|<img[^>]+logo[^>]+src=["']https?:\/\/(?!scoly-ci-play\.lovable\.app))/i;
const RAW_HTML_DOCTYPE = /<!DOCTYPE html>/i;
const USES_BRANDED = /(brandedEmail\(|EMAIL_BRAND)/;

type Finding = { file: string; issues: string[] };
const findings: Finding[] = [];

for await (const e of walk(ROOT, { exts: [".ts"], includeDirs: false })) {
  const src = await Deno.readTextFile(e.path);
  if (!SENDS_EMAIL.test(src) && !RAW_HTML_DOCTYPE.test(src)) continue;
  if (e.path.includes("/_shared/")) continue;

  const issues: string[] = [];
  if (!REQUIRED_IMPORT.test(src)) issues.push("❌ n'importe pas _shared/email-branding|brevo");
  if (RAW_HTML_DOCTYPE.test(src) && !USES_BRANDED.test(src))
    issues.push("⚠️  construit du HTML brut sans brandedEmail()/EMAIL_BRAND");
  if (HARD_CODED_LOGO.test(src)) issues.push("❌ contient une URL de logo hard-codée non Scoly");

  if (issues.length) findings.push({ file: e.path.replace(ROOT, ""), issues });
}

if (findings.length === 0) {
  console.log("✅ Branding email conforme : toutes les fonctions utilisent le module centralisé.");
  Deno.exit(0);
}

console.log(`\n🚨 ${findings.length} fichier(s) non conforme(s) au module centralisé :\n`);
for (const f of findings) {
  console.log(`  • ${f.file}`);
  for (const i of f.issues) console.log(`      ${i}`);
}
console.log("\n👉 Corrige en important `brandedEmail` / `EMAIL_BRAND` depuis _shared/email-branding.ts.\n");
Deno.exit(1);
