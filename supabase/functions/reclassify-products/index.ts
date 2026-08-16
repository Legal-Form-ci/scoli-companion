// Reclassement automatique des produits via Lovable AI Gateway.
// Renvoie une liste de propositions (product_id -> suggested_category_id + reason + confidence).
// L'admin valide/rejette côté UI, aucune écriture directe en base.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

interface CategoryRow {
  id: string;
  name_fr: string;
  slug: string | null;
}

interface ProductRow {
  id: string;
  name_fr: string | null;
  description_fr: string | null;
  brand: string | null;
  category_id: string | null;
  metadata: any;
}

interface Proposal {
  product_id: string;
  current_category_id: string | null;
  suggested_category_id: string;
  suggested_category_name: string;
  confidence: number;
  reason: string;
  product_name: string;
}

const SYSTEM_PROMPT = `Tu es un classificateur de produits scolaires ivoiriens. Réponds UNIQUEMENT en JSON valide.
Reçois une liste de produits et une liste de catégories. Pour chaque produit, choisis la catégorie la plus adaptée.
Retourne un tableau JSON: [{"product_id": "...", "category_id": "...", "confidence": 0..1, "reason": "..."}]
- confidence: 0.0 (incertain) à 1.0 (certain)
- reason: max 15 mots en français
- N'invente aucun id: utilise uniquement ceux fournis.`;

async function classifyBatch(
  products: ProductRow[],
  categories: CategoryRow[],
  apiKey: string,
): Promise<Array<{ product_id: string; category_id: string; confidence: number; reason: string }>> {
  const userPayload = {
    categories: categories.map((c) => ({ id: c.id, name: c.name_fr, slug: c.slug })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name_fr,
      description: (p.description_fr || "").slice(0, 300),
      brand: p.brand,
      current_category_id: p.category_id,
      metadata_hints: {
        category: p.metadata?.category,
        cycle: p.metadata?.cycle,
        publisher: p.metadata?.publisher,
      },
    })),
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI Gateway ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : parsed.results || parsed.classifications || [];
    return arr as any;
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Vérifier admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
    const onlyMisclassified: boolean = body.only_misclassified !== false;

    const { data: categories, error: catErr } = await admin
      .from("categories")
      .select("id,name_fr,slug");
    if (catErr) throw catErr;
    if (!categories || categories.length === 0) {
      return new Response(JSON.stringify({ proposals: [], total_scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id,name_fr,description_fr,brand,category_id,metadata")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (prodErr) throw prodErr;

    const proposals: Proposal[] = [];
    const chunkSize = 15;
    for (let i = 0; i < (products || []).length; i += chunkSize) {
      const chunk = (products as ProductRow[]).slice(i, i + chunkSize);
      const results = await classifyBatch(chunk, categories as CategoryRow[], apiKey);
      for (const r of results) {
        const cat = categories.find((c: any) => c.id === r.category_id);
        if (!cat) continue;
        const src = chunk.find((p) => p.id === r.product_id);
        if (!src) continue;
        if (onlyMisclassified && src.category_id === r.category_id) continue;
        if ((r.confidence ?? 0) < 0.55) continue;
        proposals.push({
          product_id: r.product_id,
          current_category_id: src.category_id,
          suggested_category_id: r.category_id,
          suggested_category_name: (cat as any).name_fr,
          confidence: Number(r.confidence) || 0,
          reason: String(r.reason || "").slice(0, 200),
          product_name: src.name_fr || "",
        });
      }
    }

    return new Response(
      JSON.stringify({
        proposals,
        total_scanned: (products || []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("reclassify-products error", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
