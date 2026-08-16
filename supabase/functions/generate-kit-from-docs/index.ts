// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const KIT_TOOL = {
  type: "function",
  function: {
    name: "extract_kit",
    description: "Extrait la liste de fournitures scolaires d'un document (liste officielle école, programme, photo).",
    parameters: {
      type: "object",
      properties: {
        kit_name: { type: "string" },
        grade_level: { type: "string", description: "ex: CP1, 6ème, Terminale" },
        series: { type: "string", description: "A, C, D ou vide" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_name: { type: "string" },
              quantity: { type: "number" },
              is_required: { type: "boolean" },
              estimated_price_fcfa: { type: "number" },
              category_hint: { type: "string" },
            },
            required: ["item_name", "quantity"],
            additionalProperties: false,
          },
        },
      },
      required: ["kit_name", "items"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Require authenticated user (prevents anonymous AI credit abuse)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Require staff role (admin/moderator/vendor)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "moderator", "vendor"]);
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: staff role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { files, level, series } = await req.json();
    if (!Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = [{
      type: "text",
      text: `Analyse ce(s) document(s) (liste officielle d'école, photos d'une liste manuscrite, PDF de programme) et extrais TOUTES les fournitures scolaires. Niveau cible : ${level || "à détecter"}. Série : ${series || "n/a"}. Pour chaque article : nom standardisé, quantité, si obligatoire, prix estimé FCFA (marché ivoirien), catégorie suggérée. Utilise extract_kit.`,
    }];
    for (const f of files.slice(0, 8)) {
      content.push({ type: "image_url", image_url: { url: `data:${f.mime};base64,${f.dataBase64}` } });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Tu es un expert e-commerce scolaire ivoirien. Tu composes des kits scolaires précis depuis des listes officielles." },
          { role: "user", content },
        ],
        tools: [KIT_TOOL],
        tool_choice: { type: "function", function: { name: "extract_kit" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Limite IA atteinte" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Crédits IA épuisés" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ai = await aiResp.json();
    const toolCall = ai.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments ? JSON.parse(toolCall.function.arguments) : { items: [] };

    // Match items against existing products by name similarity
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: products } = await supabase.from("products").select("id, name_fr, price, image_url, stock").eq("is_active", true).limit(2000);
    const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").trim();
    const items = (args.items || []).map((it: any) => {
      const target = norm(it.item_name);
      const match = (products || []).find((p: any) => {
        const n = norm(p.name_fr);
        return n && (n === target || n.includes(target) || target.includes(n));
      });
      return {
        item_name: it.item_name,
        quantity: it.quantity || 1,
        is_required: it.is_required ?? true,
        estimated_price: it.estimated_price_fcfa || match?.price || 0,
        product_id: match?.id || null,
        product_image_url: match?.image_url || null,
        category_hint: it.category_hint || null,
      };
    });

    return new Response(JSON.stringify({
      kit_name: args.kit_name || `Kit ${level || ""}`.trim(),
      grade_level: args.grade_level || level || null,
      series: args.series || series || null,
      description: `Kit généré par IA depuis ${files.length} document(s)`,
      estimated_price: items.reduce((s: number, i: any) => s + (i.estimated_price * (i.quantity || 1)), 0),
      items,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-kit-from-docs error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
