// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_FILES = 100;
const BATCH_SIZE = 3; // smaller AI chunks are more reliable for 100-file imports
const AI_RETRIES = 3;

const EXTRACT_TOOL = {
  type: "function",
  function: {
    name: "extract_products",
    description:
      "Extrait des fournitures scolaires/bureautiques à partir d'images (photos d'articles, listes scolaires manuscrites ou imprimées, catalogues). Chaque article visible OU listé devient un produit.",
    parameters: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "object",
            properties: {
              source_file_index: { type: "number", description: "Index du fichier source (0-based) pour associer l'image" },
              name_fr: { type: "string", description: "Nom commercial clair en français" },
              name_en: { type: "string" },
              name_es: { type: "string" },
              name_de: { type: "string" },
              description_fr: { type: "string", description: "Description vendeuse 1-2 phrases" },
              description_en: { type: "string" },
              description_es: { type: "string" },
              description_de: { type: "string" },
              category_hint: {
                type: "string",
                enum: ["primaire", "secondaire", "universitaire", "bureautique", "librairie"],
              },
              education_level: { type: "string", description: "Ex: CP1, CE2, 6ème, Terminale, Universitaire" },
              subject: { type: "string", description: "Matière si pertinent (Maths, Français...)" },
              series: { type: "string", description: "Série bac si applicable (A, C, D)" },
              product_type: { type: "string", description: "Type: cahier, livre, stylo, sac, calculatrice..." },
              publisher: { type: "string", description: "Éditeur ivoirien si le produit est un manuel/livre" },
              characteristics: { type: "array", items: { type: "string" } },
              estimated_price_fcfa: { type: "number", description: "Prix marché Côte d'Ivoire en FCFA" },
            },
            required: ["source_file_index", "name_fr", "description_fr", "category_hint", "estimated_price_fcfa"],
            additionalProperties: false,
          },
        },
      },
      required: ["products"],
      additionalProperties: false,
    },
  },
};

const SLUG_TO_CAT: Record<string, string> = {
  primaire: "scoly-primaire",
  secondaire: "scoly-secondaire",
  universitaire: "scoly-universite",
  bureautique: "scoly-bureautique",
  librairie: "scoly-librairie",
};

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

async function callAI(filesBatch: any[], startIdx: number) {
  const imageFiles = filesBatch.filter((f) => String(f.mime || "").startsWith("image/"));
  const documentFiles = filesBatch.filter((f) => !String(f.mime || "").startsWith("image/"));
  const content: any[] = [
    {
      type: "text",
      text: `Analyse ces ${filesBatch.length} fichier(s). Pour CHAQUE article visible (photo de produit) OU listé (liste scolaire imprimée/manuscrite, même raturée), crée une fiche produit complète. Indique source_file_index = position globale du fichier, en commençant à ${startIdx}. Génère noms/descriptions multilingues (FR/EN/ES/DE), type, éditeur si manuel/livre, matière/niveau/série, catégorie, et prix réaliste FCFA. Sois exhaustif: liste de 30 articles = 30 produits. Fichiers documentaires à considérer par nom si le contenu n'est pas lisible directement: ${documentFiles.map((f, i) => `${startIdx + i}:${f.name}`).join(", ") || "aucun"}.`,
    },
  ];
  imageFiles.forEach((f) => {
    content.push({
      type: "image_url",
      image_url: { url: `data:${f.mime};base64,${f.dataBase64}` },
    });
  });

  let resp: Response | null = null;
  for (let attempt = 1; attempt <= AI_RETRIES; attempt++) {
    resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un expert e-commerce scolaire ivoirien. Tu lis manuscrits, imprimés et photos produits. Tu crées des fiches produits prêtes à publier avec association image-source exacte." },
          { role: "user", content },
        ],
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "function", function: { name: "extract_products" } },
      }),
    });
    if (resp.ok || ![408, 429, 500, 502, 503, 504].includes(resp.status) || attempt === AI_RETRIES) break;
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
  }

  if (!resp?.ok) {
    const t = resp ? await resp.text() : "No response";
    console.error("AI error", resp?.status, t);
    const err: any = new Error("AI gateway error");
    err.status = resp?.status || 500;
    throw err;
  }
  const ai = await resp.json();
  const toolCall = ai.choices?.[0]?.message?.tool_calls?.[0];
  const args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { products: [] };
  return Array.isArray(args.products) ? args.products : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { files } = await req.json();
    if (!Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const usedFiles = files.slice(0, MAX_FILES);

    // Process in batches
    const allExtracted: any[] = [];
    for (let i = 0; i < usedFiles.length; i += BATCH_SIZE) {
      const batch = usedFiles.slice(i, i + BATCH_SIZE);
      try {
        const partial = await callAI(batch, i);
        allExtracted.push(...partial);
      } catch (e: any) {
        if (e.status === 429) return new Response(JSON.stringify({ error: "Limite IA atteinte, réessayez plus tard." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (e.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw e;
      }
    }

    // Upload source images to storage and map index -> public URL
    const fileUrls: (string | null)[] = await Promise.all(usedFiles.map(async (f: any, idx: number) => {
      if (!f.mime?.startsWith("image/")) return null;
      try {
        const bytes = Uint8Array.from(atob(f.dataBase64), c => c.charCodeAt(0));
        const ext = (f.mime.split("/")[1] || "jpg").replace("jpeg", "jpg");
        const path = `ai-imports/${user.id}/${Date.now()}-${idx}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, bytes, { contentType: f.mime, upsert: true });
        if (upErr) { console.error("upload err", upErr); return null; }
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
        return publicUrl;
      } catch (e) { console.error("upload exception", e); return null; }
    }));

    // Load categories
    const { data: cats } = await supabase.from("categories").select("id, slug");
    const catBySlug = new Map((cats || []).map((c: any) => [c.slug, c.id]));

    // Dedup intra-batch + against DB
    const seen = new Set<string>();
    const uniqueExtracted = allExtracted.filter((p: any) => {
      const k = norm(p.name_fr);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const { data: existing } = await supabase.from("products").select("name_fr").limit(5000);
    const existingKeys = new Set((existing || []).map((p: any) => norm(p.name_fr)));
    const toInsert = uniqueExtracted.filter((p: any) => !existingKeys.has(norm(p.name_fr)));
    const skipped = allExtracted.length - toInsert.length;

    const clean = (v: any, fb = "") => (typeof v === "string" && v.trim()) ? v.trim() : fb;
    const clamp = (v: any, fb: string) => clean(v, fb).slice(0, 255);

    const rows = toInsert.map((p: any) => {
      const baseName = clamp(p.name_fr, "Produit scolaire");
      const baseDesc = clean(p.description_fr);
      const slug = SLUG_TO_CAT[p.category_hint] || "scoly-primaire";
      const categoryId = catBySlug.get(slug) || null;
      const srcIdx = typeof p.source_file_index === "number" ? p.source_file_index : -1;
      const imageUrl = srcIdx >= 0 && srcIdx < fileUrls.length ? fileUrls[srcIdx] : null;

      const row: any = {
        name_fr: baseName,
        name_en: clamp(p.name_en, baseName),
        name_de: clamp(p.name_de, baseName),
        name_es: clamp(p.name_es, baseName),
        description_fr: baseDesc,
        description_en: clean(p.description_en, baseDesc),
        description_de: clean(p.description_de, baseDesc),
        description_es: clean(p.description_es, baseDesc),
        price: Number(p.estimated_price_fcfa) || 0,
        stock: 10,
        is_active: true,
        category_id: categoryId,
        image_url: imageUrl,
        metadata: {
          ai_generated: true,
          characteristics: Array.isArray(p.characteristics) ? p.characteristics : [],
          category_hint: p.category_hint || null,
          product_type: p.product_type || null,
        },
      };

      // Optional fields if columns exist
      if (p.education_level) row.education_level = String(p.education_level).slice(0, 50);
      if (p.subject) row.subject = String(p.subject).slice(0, 100);

      return row;
    });

    let inserted: any[] = [];
    if (rows.length > 0) {
      const { data, error } = await supabase.from("products").insert(rows).select("id, name_fr");
      if (error) {
        console.error("Insert error", error);
        return new Response(JSON.stringify({ error: error.message, extracted: allExtracted }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      inserted = data || [];
    }

    return new Response(
      JSON.stringify({ success: true, count: inserted.length, skipped, products: inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("bulk-create-products error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
