// One-shot migration: move base64 cover_image blobs from articles table into
// Storage (article-images bucket) and replace the column with a public URL.
// This unblocks PostgREST queries that were timing out due to multi-MB TOAST
// rows being detoasted on every SELECT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Require admin authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authed = createClient(SUPABASE_URL, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roleList = (roles || []).map((r: any) => r.role);
  if (!roleList.includes("admin")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: rows, error } = await supabase
    .from("articles")
    .select("id, cover_image")
    .like("cover_image", "data:image/%");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];
  for (const row of rows ?? []) {
    try {
      const ci: string = row.cover_image;
      const match = ci.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        results.push({ id: row.id, skipped: "not-base64" });
        continue;
      }
      const mime = match[1];
      const ext = mime.split("/")[1].replace("jpeg", "jpg").split("+")[0];
      const bytes = base64ToBytes(match[2]);
      const path = `covers/${row.id}.${ext}`;

      const up = await supabase.storage
        .from("article-images")
        .upload(path, bytes, { contentType: mime, upsert: true });
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from("article-images").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("articles")
        .update({ cover_image: pub.publicUrl })
        .eq("id", row.id);
      if (updErr) throw updErr;

      results.push({ id: row.id, url: pub.publicUrl, bytes: bytes.length });
    } catch (e) {
      results.push({ id: row.id, error: String(e) });
    }
  }

  return new Response(JSON.stringify({ migrated: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
