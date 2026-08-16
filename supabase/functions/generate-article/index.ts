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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Require admin or moderator role
    const userId = claimsData.claims.sub;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: roleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"]);
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: staff role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { content, generationMode } = await req.json();
    // generationMode: "text_only" | "single_image" | "multi_image" | "video" | "image_video"
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const wantImages = ["single_image", "multi_image", "image_video"].includes(generationMode);
    const wantMultiImages = ["multi_image", "image_video"].includes(generationMode);
    const wantVideo = ["video", "image_video"].includes(generationMode);

    const systemPrompt = `Tu es un rédacteur professionnel premium pour Scoly, une plateforme de fournitures scolaires et bureautiques en Côte d'Ivoire.

À partir du texte brut fourni par l'utilisateur (même un simple mot), tu dois générer un article complet, professionnel et immédiatement publiable.

RÈGLES DE RÉDACTION CRITIQUES :
- Le contenu doit être FACTUEL, PRÉCIS et VÉRIFIABLE
- Ton professionnel de journaliste rigoureux : pas de complaisance, pas d'attaque, pas de flatterie
- JAMAIS de superlatifs exagérés ni de formulations creuses
- Le contenu ne doit PAS être détectable comme généré par une IA
- Éviter les répétitions, redondances et formulations vides
- Adapter le ton : formel pour communiqués, engageant pour blogs, technique pour guides

STRUCTURE DU CONTENU HTML :
- Utiliser <h2> et <h3> pour les sous-titres (JAMAIS <h1>)
- Paragraphes aérés avec <p>, jamais de blocs compacts
- Listes structurées avec <ul>/<ol> et <li>
- <strong> pour le gras, <em> pour l'italique
- <blockquote> pour les citations

TABLEAUX INTELLIGENTS :
- Générer un <table> UNIQUEMENT s'il apporte une valeur réelle (comparaison, données chiffrées, chronologie)
- En-tête avec <thead> et <th>, corps avec <tbody> et <td>
- Le tableau doit contenir des données pertinentes et factuelles
- Tableau comparatif automatique si le sujet implique plusieurs périodes, acteurs ou indicateurs
- NE JAMAIS générer de tableau juste pour meubler

ÉLÉMENTS STRUCTURANTS :
- Chronologie pour contenus événementiels (utiliser une liste ordonnée avec dates en gras)
- Fiche technique pour sujets nécessitant des données précises (utiliser un tableau)
- Points clés en liste à puces pour faciliter la lecture rapide

LONGUEUR : Minimum 600 mots pour le contenu principal. Introduction engageante + développement structuré + conclusion synthétique.

Tu dois retourner un JSON structuré via l'outil generate_article.`;

    const imageInstructions = wantImages
      ? `\n\nGénère ${wantMultiImages ? "3 à 4 prompts d'images différents" : "1 prompt d'image"} dans le champ image_prompts. Chaque prompt doit décrire une scène ULTRA-RÉALISTE, en contexte africain/ivoirien, avec UNIQUEMENT des personnes noires/africaines. Photographie professionnelle haute résolution. JAMAIS de style cartoon, illustration ou stock photo générique. Sans watermark ni filigrane.`
      : "\nPas besoin de prompts d'images.";

    const videoInstructions = wantVideo
      ? "\n\nGénère aussi un prompt vidéo dans video_prompt : description d'une scène courte, sobre et professionnelle en contexte africain/ivoirien."
      : "";

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
          { role: "user", content: `Génère un article complet à partir de ce texte : "${content}".${imageInstructions}${videoInstructions}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_article",
              description: "Generate a complete structured article with all metadata",
              parameters: {
                type: "object",
                properties: {
                  title_fr: { type: "string", description: "Titre impactant en français" },
                  title_en: { type: "string", description: "English title" },
                  title_de: { type: "string", description: "Deutscher Titel" },
                  title_es: { type: "string", description: "Título en español" },
                  excerpt_fr: { type: "string", description: "Résumé accrocheur 2-3 phrases en français" },
                  excerpt_en: { type: "string", description: "English excerpt" },
                  content_fr: { type: "string", description: "Contenu HTML complet structuré en français (h2, h3, p, ul, ol, li, strong, em, table, thead, tbody, th, td, blockquote). Minimum 600 mots." },
                  content_en: { type: "string", description: "Full HTML content in English" },
                  content_de: { type: "string", description: "Vollständiger HTML-Inhalt auf Deutsch" },
                  content_es: { type: "string", description: "Contenido HTML completo en español" },
                  category: { type: "string", enum: ["general", "education", "bureautique", "resources", "news", "guides"] },
                  hashtags: { type: "array", items: { type: "string" }, description: "5-8 hashtags pertinents sans le symbole #" },
                  meta_description: { type: "string", description: "Meta description SEO optimisée, max 155 caractères" },
                  image_prompts: { type: "array", items: { type: "string" }, description: "Prompts détaillés en anglais pour générer des images réalistes" },
                  video_prompt: { type: "string", description: "Prompt pour génération vidéo si demandé" },
                },
                required: ["title_fr", "title_en", "title_de", "title_es", "excerpt_fr", "excerpt_en", "content_fr", "content_en", "content_de", "content_es", "category", "hashtags", "meta_description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_article" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
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

    const article = JSON.parse(toolCall.function.arguments);

    // Generate images if requested
    const generatedImages: string[] = [];
    const imagePrompts = article.image_prompts || [];

    if (wantImages && imagePrompts.length > 0) {
      const promptsToProcess = wantMultiImages ? imagePrompts.slice(0, 4) : [imagePrompts[0]];

      const imageResults = await Promise.allSettled(
        promptsToProcess.map(async (prompt: string) => {
          const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                { role: "user", content: prompt + ". Ultra-realistic professional photography in African/Ivorian context. Only Black African people. High quality, natural lighting, no text overlay, no watermark, no cartoon, no illustration, no stock photo look." },
              ],
              modalities: ["image", "text"],
            }),
          });
          if (!imgResp.ok) return null;
          const imgData = await imgResp.json();
          return imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
        })
      );

      for (const result of imageResults) {
        if (result.status === "fulfilled" && result.value) {
          generatedImages.push(result.value);
        }
      }
    }

    return new Response(JSON.stringify({
      ...article,
      generated_images: generatedImages,
      video_supported: false, // Video generation not yet available via AI gateway
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-article error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
