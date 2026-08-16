import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth check
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ─── Generate Smart Kit ───
    if (action === "generate_kit") {
      const { level, series } = body;
      
      // Get existing products to match
      const { data: products } = await supabase
        .from("products")
        .select("id, name_fr, price, category_id, subject, education_level")
        .eq("is_active", true)
        .limit(200);

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Tu es un expert en éducation en Côte d'Ivoire. Tu connais parfaitement les programmes scolaires du CP1 à la Terminale. Génère des kits scolaires complets et adaptés." },
            { role: "user", content: `Génère un kit scolaire complet pour le niveau "${level}"${series ? ` série "${series}"` : ""}. 
Produits disponibles dans le catalogue : ${JSON.stringify(products?.map(p => ({ id: p.id, name: p.name_fr, price: p.price })).slice(0, 50))}
Fournis : un nom de kit, une description, la liste des articles nécessaires (avec product_id si trouvé dans le catalogue, sinon item_name), et le prix total estimé.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_kit",
              description: "Create a school supply kit",
              parameters: {
                type: "object",
                properties: {
                  kit_name: { type: "string" },
                  description: { type: "string" },
                  estimated_price: { type: "number" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string" },
                        quantity: { type: "number" },
                        product_id: { type: "string", description: "Product ID from catalog if matching" },
                        estimated_price: { type: "number" },
                        is_required: { type: "boolean" },
                      },
                      required: ["item_name", "quantity", "is_required"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["kit_name", "description", "estimated_price", "items"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_kit" } },
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits insufficient" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error: " + status);
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call response");
      const kit = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(kit), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Generate Educational Resource ───
    if (action === "generate_resource") {
      const { subject, grade_level, resource_type } = body;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Tu es un enseignant expérimenté en Côte d'Ivoire. Tu crées des ressources pédagogiques de qualité adaptées au programme ivoirien." },
            { role: "user", content: `Crée une ressource éducative de type "${resource_type}" pour la matière "${subject}" au niveau "${grade_level}". Fournis un titre, une description, le contenu complet, et des métadonnées.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_resource",
              description: "Create an educational resource",
              parameters: {
                type: "object",
                properties: {
                  title_fr: { type: "string" },
                  title_en: { type: "string" },
                  description_fr: { type: "string" },
                  description_en: { type: "string" },
                  content: { type: "string", description: "Full content of the resource (exercises, exam subjects, etc.)" },
                  subject: { type: "string" },
                  grade_level: { type: "string" },
                  category: { type: "string", enum: ["exercises", "exams", "lesson_plans", "videos", "programs"] },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  estimated_duration: { type: "string" },
                },
                required: ["title_fr", "title_en", "description_fr", "description_en", "content", "subject", "grade_level", "category"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_resource" } },
        }),
      });

      if (!aiRes.ok) {
        const status = aiRes.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits insufficient" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error: " + status);
      }

      const aiData = await aiRes.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call response");
      const resource = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify(resource), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Save Resource to DB ───
    if (action === "save_resource") {
      const { resource } = body;
      const { error } = await supabase.from("resources").insert({
        title_fr: resource.title_fr,
        title_en: resource.title_en || resource.title_fr,
        title_de: resource.title_fr,
        title_es: resource.title_fr,
        description_fr: resource.description_fr,
        description_en: resource.description_en,
        category: resource.category || "exercises",
        subject: resource.subject,
        grade_level: resource.grade_level,
        is_free: true,
        price: 0,
        author_id: user.id,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── Generate School Description ───
    if (action === "generate_school_description") {
      const { school_name, school_type, city } = body;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Tu es un rédacteur pour des fiches d'établissements scolaires en Côte d'Ivoire. Crée des descriptions professionnelles." },
            { role: "user", content: `Crée une description complète pour l'établissement "${school_name}" de type "${school_type}" situé à ${city}. Inclus les points forts, les programmes, et l'environnement éducatif.` },
          ],
        }),
      });

      if (!aiRes.ok) throw new Error("AI error");
      const data = await aiRes.json();
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ description: content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-education-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
