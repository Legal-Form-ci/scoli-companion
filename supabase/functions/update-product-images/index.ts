import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Require admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaAuth = createClient(supabaseUrl, anonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supaAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use trusted base URL from env (never trust Origin header for persisted data)
    const trustedBase = Deno.env.get("PUBLIC_SITE_URL") || "https://scoly.ci";
    const origin = trustedBase.replace(/\/$/, "");
    
    // Define image mapping by subject and level
    const imageMapping: Record<string, string> = {};
    
    // Fetch all products with placeholder images
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name_fr, subject, education_level, product_type, image_url")
      .like("image_url", "%placehold%");

    if (fetchError) throw fetchError;

    const updates = [];
    for (const p of products || []) {
      let img = "/products/textbook-francais.jpg";
      
      const subj = p.subject || "";
      const level = p.education_level || "";
      const ptype = p.product_type || "";

      if (subj === "Français" && level.includes("Primaire")) img = "/products/textbook-primaire-francais.jpg";
      else if (subj === "Français") img = "/products/textbook-francais.jpg";
      else if (subj === "Mathématiques" && level.includes("Primaire")) img = "/products/textbook-primaire-maths.jpg";
      else if (subj === "Mathématiques") img = "/products/textbook-maths.jpg";
      else if (subj === "Anglais") img = "/products/textbook-anglais.jpg";
      else if (subj === "Physique-Chimie" || subj === "Physique" || subj === "Chimie") img = "/products/textbook-physique-chimie.jpg";
      else if (subj === "SVT") img = "/products/textbook-svt.jpg";
      else if (subj.includes("Histoire")) img = "/products/textbook-histoire-geo.jpg";
      else if (subj === "EDHC") img = "/products/textbook-edhc.jpg";
      else if (subj === "Philosophie") img = "/products/textbook-philosophie.jpg";
      else if (subj === "Espagnol") img = "/products/textbook-espagnol.jpg";
      else if (subj === "EPS") img = "/products/textbook-eps.jpg";
      else if (subj === "Education Musicale") img = "/products/textbook-musique.jpg";
      else if (subj === "Lecture" && level.includes("Préscolaire")) img = "/products/book-prescolaire.jpg";
      else if (subj === "Lecture" && level.includes("Primaire")) img = "/products/book-conte-enfant.jpg";
      else if (subj === "Lecture") img = "/products/book-oeuvre-integrale.jpg";
      else if (subj === "Pluridisciplines" && level.includes("Préscolaire")) img = "/products/book-prescolaire.jpg";
      else if (level.includes("Préscolaire")) img = "/products/book-prescolaire.jpg";
      else if (ptype === "Œuvre intégrale") img = "/products/book-oeuvre-integrale.jpg";

      // Use the origin to build full URL
      const fullUrl = origin ? `${origin}${img}` : img;

      updates.push(
        supabase.from("products").update({ image_url: fullUrl }).eq("id", p.id)
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updates.length, 
        errors: errors.length,
        message: `${updates.length} produits mis à jour avec des images HD.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
