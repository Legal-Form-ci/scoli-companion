import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user and require admin role
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

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const userId = claimsData.claims.sub;
    const adminCheck = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await adminCheck
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action } = await req.json();

    // Action: analyze - Analyze platform and generate recommendations
    if (action === "analyze") {
      // Fetch current data
      const [productsRes, ordersRes, promotionsRes] = await Promise.all([
        supabase.from("products").select("id, name_fr, price, stock, discount_percent, is_featured, is_active, category_id").eq("is_active", true),
        supabase.from("orders").select("id, total_amount, status, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("promotions").select("*").eq("is_active", true),
      ]);

      const products = productsRes.data || [];
      const orders = ordersRes.data || [];
      const activePromos = promotionsRes.data || [];

      // Ask AI to analyze
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `Tu es un expert e-commerce pour Scoly, plateforme de fournitures scolaires et bureautiques en Côte d'Ivoire. Analyse les données et propose des actions concrètes.` },
            { role: "user", content: `Analyse ces données:
- ${products.length} produits actifs
- ${orders.length} commandes récentes (revenus: ${orders.reduce((s, o) => s + o.total_amount, 0)} FCFA)
- ${activePromos.length} promotions actives
- Produits en rupture: ${products.filter(p => (p.stock || 0) <= 0).length}
- Produits sans remise: ${products.filter(p => !p.discount_percent).length}

Propose: 1) Produits à mettre en avant, 2) Suggestions de promotions flash, 3) Alertes stock, 4) Idées de posts réseaux sociaux. Format JSON avec clés: featured_suggestions, flash_deals, stock_alerts, social_posts.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "platform_analysis",
              description: "Platform analysis results",
              parameters: {
                type: "object",
                properties: {
                  featured_suggestions: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, reason: { type: "string" } }, required: ["product_id", "reason"] } },
                  flash_deals: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, suggested_discount: { type: "number" }, duration_hours: { type: "number" }, reason: { type: "string" } }, required: ["product_id", "suggested_discount", "reason"] } },
                  stock_alerts: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, current_stock: { type: "number" }, action: { type: "string" } }, required: ["product_id", "action"] } },
                  social_posts: { type: "array", items: { type: "object", properties: { platform: { type: "string" }, content: { type: "string" }, hashtags: { type: "string" } }, required: ["platform", "content"] } },
                  summary: { type: "string" },
                },
                required: ["featured_suggestions", "flash_deals", "stock_alerts", "social_posts", "summary"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "platform_analysis" } },
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits insufficient" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI error");
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call");

      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(analysis), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: apply_flash_deals - Apply AI-suggested flash deals
    if (action === "apply_flash_deals") {
      const { deals } = await req.json();
      
      for (const deal of deals || []) {
        await supabase.from("products").update({ 
          discount_percent: deal.suggested_discount,
          is_featured: true,
        }).eq("id", deal.product_id);
      }

      return new Response(JSON.stringify({ success: true, applied: deals?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Action: generate_social_post
    if (action === "generate_social_post") {
      const { product_ids, platform } = await req.json();
      
      const { data: products } = await supabase.from("products").select("name_fr, price, discount_percent, image_url").in("id", product_ids || []);
      
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Tu es un community manager expert pour Scoly, plateforme de fournitures scolaires en Côte d'Ivoire. Crée des posts engageants pour les réseaux sociaux." },
            { role: "user", content: `Crée un post ${platform || "Facebook"} pour promouvoir ces produits: ${JSON.stringify(products)}. Inclus des emojis, hashtags, et un appel à l'action vers scoly.ci` },
          ],
        }),
      });

      if (!aiRes.ok) throw new Error("AI error");
      const postData = await aiRes.json();
      const content = postData.choices?.[0]?.message?.content || "";

      return new Response(JSON.stringify({ post: content, products }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-platform-manager error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
