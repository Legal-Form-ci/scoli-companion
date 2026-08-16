// Build-time SEO generator. It only reads public catalog/editorial data and writes
// public/sitemap.xml, public/robots.txt and public/llms.txt. No private/admin route
// is exposed here.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://scoly.ci";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://duxbzpsezdhvhprwjwmk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eGJ6cHNlemRodmhwcndqd21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDQ3NzksImV4cCI6MjA4NTg4MDc3OX0.2PnaHtqm4j_PKc7yQaiQ3OJoAD4lHsYkfEfV8bJa5-w";

interface Entry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  hreflang?: { lang: string; href: string }[];
}

interface ProductRow { id: string; updated_at: string | null; created_at?: string | null; name_fr?: string | null; }
interface ArticleRow { id: string; updated_at: string | null; published_at?: string | null; title_fr?: string | null; }
interface CategoryRow { slug: string; updated_at?: string | null; created_at?: string | null; name_fr: string; }

const today = new Date().toISOString().slice(0, 10);
const staticRoutes: Entry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.95" },
  { path: "/kits-scolaires", changefreq: "weekly", priority: "0.85" },
  { path: "/actualites", changefreq: "daily", priority: "0.85" },
  { path: "/parrainage", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.5" },
  { path: "/livraison-retours", changefreq: "monthly", priority: "0.5" },
  { path: "/mentions-legales", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

async function rest<T>(path: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) {
    console.warn(`[seo] ${path} → ${res.status}`);
    return [];
  }
  return (await res.json()) as T[];
}

async function fetchProducts(): Promise<{ entries: Entry[]; rows: ProductRow[] }> {
  const rows = await rest<ProductRow>(
    "products?select=id,updated_at,created_at,name_fr&is_active=eq.true&order=updated_at.desc.nullslast&limit=5000"
  );
  return {
    rows,
    entries: rows.map((r) => ({
      path: `/shop/product/${r.id}`,
      lastmod: isoDate(r.updated_at || r.created_at),
      changefreq: "weekly" as const,
      priority: "0.7",
    })),
  };
}

async function fetchArticles(): Promise<{ entries: Entry[]; rows: ArticleRow[] }> {
  const rows = await rest<ArticleRow>(
    "articles?select=id,updated_at,published_at,title_fr&status=eq.published&order=published_at.desc.nullslast&limit=3000"
  );
  return {
    rows,
    entries: rows.map((r) => ({
      path: `/actualites/${r.id}`,
      lastmod: isoDate(r.updated_at || r.published_at),
      changefreq: "weekly" as const,
      priority: "0.6",
    })),
  };
}

async function fetchCategories(): Promise<{ entries: Entry[]; rows: CategoryRow[] }> {
  const rows = await rest<CategoryRow>("categories?select=slug,name_fr,created_at&order=name_fr.asc&limit=500");
  return {
    rows,
    entries: rows
      .filter((r) => !!r.slug)
      .map((r) => ({
        path: `/shop?category=${encodeURIComponent(r.slug)}`,
        lastmod: isoDate(r.created_at),
        changefreq: "weekly" as const,
        priority: "0.75",
      })),
  };
}

function isoDate(value?: string | null) {
  return (value || new Date().toISOString()).slice(0, 10);
}

function xmlEscape(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;"
  );
}

function renderEntry(e: Entry) {
  const loc = `${BASE_URL}${e.path}`;
  const hreflangs = (e.hreflang ?? [
    { lang: "fr-CI", href: loc },
    { lang: "fr", href: loc },
    { lang: "en", href: loc },
    { lang: "x-default", href: loc },
  ])
    .map((h) => `    <xhtml:link rel="alternate" hreflang="${h.lang}" href="${xmlEscape(h.href)}" />`)
    .join("\n");
  return [
    `  <url>`,
    `    <loc>${xmlEscape(loc)}</loc>`,
    e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    hreflangs,
    `  </url>`,
  ].filter(Boolean).join("\n");
}

function writeRobots() {
  const privateRoutes = [
    "/admin", "/account", "/compte", "/checkout", "/cart", "/panier", "/vendor", "/moderator",
    "/delivery", "/author", "/team", "/me", "/bootstrap-admin", "/auth", "/unsubscribe",
  ];
  const lines = [
    "# Robots.txt - Scoly (https://scoly.ci)",
    "User-agent: *",
    "Allow: /",
    ...privateRoutes.map((r) => `Disallow: ${r}`),
    "",
    "User-agent: Googlebot-Image",
    "Allow: /",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "User-agent: PerplexityBot",
    "Allow: /",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    `Host: ${BASE_URL}`,
    "",
  ];
  writeFileSync(resolve("public/robots.txt"), lines.join("\n"));
}

function writeLlms(categories: CategoryRow[], products: ProductRow[], articles: ArticleRow[]) {
  const categoryLines = categories.slice(0, 30).map((c) => `- [${c.name_fr}](/shop?category=${encodeURIComponent(c.slug)})`);
  const productLines = products.slice(0, 25).map((p) => `- [${p.name_fr || "Produit Scoly"}](/shop/product/${p.id})`);
  const articleLines = articles.slice(0, 20).map((a) => `- [${a.title_fr || "Article Scoly"}](/actualites/${a.id})`);
  const content = `# Scoly — Fournitures scolaires & bureautiques en Côte d'Ivoire\n\n` +
    `> Scoly (scoly.ci) est la plateforme ivoirienne pour fournitures scolaires, manuels, articles de bureautique et kits scolaires. Livraison gratuite en Côte d'Ivoire et paiement Mobile Money sécurisé.\n\n` +
    `## Pages principales\n- [Accueil](/)\n- [Boutique](/shop)\n- [Kit Scolaire](/kits-scolaires)\n- [Actualités](/actualites)\n- [Livraison & retours](/livraison-retours)\n\n` +
    `## Catégories publiques\n${categoryLines.join("\n")}\n\n` +
    `## Produits récents\n${productLines.join("\n")}\n\n` +
    `## Articles récents\n${articleLines.join("\n")}\n\n` +
    `## Fichiers SEO\n- [Sitemap XML](/sitemap.xml)\n- [Robots](/robots.txt)\n`;
  writeFileSync(resolve("public/llms.txt"), content);
}

async function main() {
  let dynamicEntries: Entry[] = [];
  let products: ProductRow[] = [];
  let articles: ArticleRow[] = [];
  let categories: CategoryRow[] = [];
  try {
    const [productResult, articleResult, categoryResult] = await Promise.all([fetchProducts(), fetchArticles(), fetchCategories()]);
    products = productResult.rows;
    articles = articleResult.rows;
    categories = categoryResult.rows;
    dynamicEntries = [...categoryResult.entries, ...productResult.entries, ...articleResult.entries];
  } catch (err) {
    console.warn("[seo] dynamic fetch failed, falling back to static:", err);
  }

  const byLoc = new Map<string, Entry>();
  [...staticRoutes.map((r) => ({ ...r, lastmod: r.lastmod ?? today })), ...dynamicEntries].forEach((entry) => {
    if (!byLoc.has(entry.path)) byLoc.set(entry.path, entry);
  });
  const allEntries = [...byLoc.values()];

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...allEntries.map(renderEntry),
    `</urlset>`,
  ].join("\n");

  writeFileSync(resolve("public/sitemap.xml"), xml);
  writeRobots();
  writeLlms(categories, products, articles);
  console.log(`[seo] wrote sitemap=${allEntries.length}, products=${products.length}, articles=${articles.length}, categories=${categories.length}`);
}

main().catch((err) => {
  console.error("[seo] fatal:", err);
  process.exit(0);
});
