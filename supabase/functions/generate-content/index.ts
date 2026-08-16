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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow } = await adminClient
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "moderator"]).maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, input } = await req.json();
    // Cap input size to prevent runaway AI cost
    if (typeof input !== 'string' || input.length === 0 || input.length > 2000) {
      return new Response(JSON.stringify({ error: 'Invalid input (max 2000 chars)' }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let toolDef: any = {};

    if (type === "promotion") {
      systemPrompt = `Tu es un expert senior en marketing digital et promotions pour Scoly, la référence des fournitures scolaires et bureautiques en Côte d'Ivoire.

CONTEXTE MARCHÉ :
- Monnaie : FCFA (Franc CFA)
- Cible : Parents d'élèves, établissements scolaires, étudiants, professionnels
- Produits : Manuels scolaires, cahiers, stylos, sacs, calculatrices, fournitures de bureau
- Concurrents : Librairies locales, marchés informels
- Saisons clés : Rentrée scolaire (sept-oct), examens (mai-juin), fêtes (déc)

STRATÉGIE AVANCÉE :
- Analyse le mot-clé et détermine le contexte saisonnier
- Propose des remises réalistes (5-50% selon le contexte)
- Calcule un montant minimum d'achat adapté au panier moyen ivoirien (5000-50000 FCFA)
- Crée un nom accrocheur avec des emojis pertinents
- La description doit inclure un call-to-action et un sentiment d'urgence
- Adapte applies_to au segment le plus pertinent

À partir du texte brut fourni (même un simple mot), génère une promotion complète, stratégique et professionnelle.`;

      toolDef = {
        type: "function",
        function: {
          name: "generate_promotion",
          description: "Generate a strategic promotion with marketing intelligence",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nom accrocheur avec emoji (ex: 🎒 Rentrée Malin -30%)" },
              description: { type: "string", description: "Description marketing avec urgence et CTA (max 200 chars)" },
              discount_type: { type: "string", enum: ["percent", "fixed"], description: "percent pour % de remise, fixed pour montant fixe en FCFA" },
              discount_value: { type: "number", description: "Valeur de la remise (réaliste selon le contexte)" },
              min_amount: { type: "number", description: "Montant minimum d'achat en FCFA" },
              max_uses: { type: "number", description: "Nombre maximum d'utilisations (50-500)" },
              applies_to: { type: "string", enum: ["all", "primaire", "secondaire", "bureautique", "manuels", "fournitures"] },
              duration_days: { type: "number", description: "Durée en jours (3-30)" },
            },
            required: ["name", "description", "discount_type", "discount_value", "min_amount", "applies_to", "duration_days"],
            additionalProperties: false,
          },
        },
      };
    } else if (type === "advertisement") {
      systemPrompt = `Tu es un expert senior en publicité digitale et copywriting pour Scoly, la référence des fournitures scolaires et bureautiques en Côte d'Ivoire.

CONTEXTE CRÉATIF :
- Plateforme : Site web e-commerce éducatif
- Audience : Parents, enseignants, directeurs d'école, étudiants en CI
- Ton : Professionnel, chaleureux, engageant, africain
- Pages cibles : /shop, /kits-ecole, /actualites, /parrainage, /livraison-retours

RÈGLES DE COPYWRITING :
- Titre : Court, impactant, avec verbe d'action (max 60 chars)
- Description : Bénéfice client clair avec chiffres si possible (max 160 chars)
- CTA : Verbe d'action + bénéfice (ex: "Découvrir les offres", "Équiper mon enfant")
- Le lien doit pointer vers la page la plus pertinente du site
- Le prompt d'image doit être ultra-spécifique au contexte ivoirien/africain

À partir du texte brut fourni, génère une publicité complète et professionnelle.`;

      toolDef = {
        type: "function",
        function: {
          name: "generate_advertisement",
          description: "Generate a compelling advertisement",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titre impactant (max 60 chars)" },
              description: { type: "string", description: "Description engageante avec bénéfice (max 160 chars)" },
              link_url: { type: "string", description: "URL relative du site (/shop, /kits-ecole, /actualites, etc.)" },
              link_text: { type: "string", description: "Texte du bouton CTA (verbe + bénéfice)" },
              priority: { type: "number", description: "Priorité d'affichage (0-10)" },
              image_prompt: { type: "string", description: "Prompt détaillé pour image. Contexte africain/ivoirien, personnes noires, pas de watermark." },
            },
            required: ["title", "description", "link_url", "link_text", "priority", "image_prompt"],
            additionalProperties: false,
          },
        },
      };
    } else if (type === "flash_deal") {
      systemPrompt = `Tu es un expert en ventes flash et stratégie de pricing pour Scoly, plateforme de fournitures scolaires en Côte d'Ivoire.

CONTEXTE VENTES FLASH :
- Durée : 24h (renouvellement quotidien)
- Objectif : Créer de l'urgence et écouler du stock
- Remise : Entre 10% et 50% selon le produit
- Les prix sont en FCFA

STRATÉGIE :
- Analyse le produit/contexte fourni
- Propose une remise agressive mais réaliste
- Génère un titre flash accrocheur
- Suggère un stock limité pour créer l'urgence
- Calcule le prix après remise

À partir du texte fourni, génère une vente flash optimisée.`;

      toolDef = {
        type: "function",
        function: {
          name: "generate_flash_deal",
          description: "Generate an optimized flash deal",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titre flash accrocheur avec emoji" },
              discount_percent: { type: "number", description: "Pourcentage de remise (10-50)" },
              suggested_original_price: { type: "number", description: "Prix original suggéré en FCFA" },
              max_stock: { type: "number", description: "Stock limité suggéré (5-50)" },
              urgency_message: { type: "string", description: "Message d'urgence court" },
              target_category: { type: "string", description: "Catégorie ciblée" },
            },
            required: ["title", "discount_percent", "suggested_original_price", "max_stock", "urgency_message", "target_category"],
            additionalProperties: false,
          },
        },
      };
    } else if (type === "resource") {
      systemPrompt = `Tu es un expert en pédagogie et création de contenu éducatif pour Scoly, plateforme éducative en Côte d'Ivoire.

CONTEXTE PÉDAGOGIQUE :
- Système : Programme ivoirien (CP1-CM2, 6ème-3ème, 2nde-Tle)
- Matières : Maths, Français, Sciences, Histoire-Géo, Anglais, Philosophie, etc.
- Format : Exercices, examens blancs, fiches de cours, guides d'orientation
- Séries lycée : A (littéraire), C (scientifique), D (sciences naturelles)

QUALITÉ REQUISE :
- Contenu aligné sur le programme officiel ivoirien
- Progression pédagogique claire
- Exercices avec corrigés quand applicable
- Vocabulaire adapté au niveau

À partir du texte fourni, génère une ressource éducative complète.`;

      toolDef = {
        type: "function",
        function: {
          name: "generate_resource",
          description: "Generate educational resource metadata",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Titre descriptif de la ressource" },
              description: { type: "string", description: "Description pédagogique détaillée" },
              subject: { type: "string", description: "Matière (maths, francais, sciences, histoire-geo, anglais, philosophie, svt, physique-chimie)" },
              grade_level: { type: "string", description: "Niveau (cp1, cp2, ce1, ce2, cm1, cm2, 6eme, 5eme, 4eme, 3eme, 2nde, 1ere, tle)" },
              content_type: { type: "string", description: "Type (exercice, examen, fiche_cours, guide, corrige)" },
              is_free: { type: "boolean", description: "Gratuit ou payant" },
              suggested_price: { type: "number", description: "Prix suggéré en FCFA si payant" },
              objectives: { type: "string", description: "Objectifs pédagogiques (3-5 points séparés par |)" },
            },
            required: ["title", "description", "subject", "grade_level", "content_type", "is_free"],
            additionalProperties: false,
          },
        },
      };
    } else {
      throw new Error("Type invalide. Utilisez 'promotion', 'advertisement', 'flash_deal' ou 'resource'.");
    }

    const toolName = toolDef.function.name;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Génère un contenu complet à partir de: "${input}"` },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques minutes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    // Generate image for advertisements
    if (type === "advertisement" && result.image_prompt) {
      try {
        const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              { role: "user", content: result.image_prompt + ". Professional photography, African/Ivorian context, Black African people only. High quality, natural lighting, no text overlay, no watermark, vibrant colors." },
            ],
            modalities: ["image", "text"],
          }),
        });
        if (imgResp.ok) {
          const imgData = await imgResp.json();
          result.generated_image = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
        }
      } catch (e) {
        console.error("Image gen error:", e);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
