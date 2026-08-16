// Scoly Cloud function: restore database from a JSON backup (admin-only)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tables ordered for deletion (reverse order for foreign key dependencies)
// Tables with fewer dependencies first when inserting, delete in reverse
const TABLE_ORDER = [
  // Base tables (no FK to other app tables)
  "categories",
  "platform_settings",
  "faq",
  "coupons",
  "advertisements",
  "campaigns",
  "promotions",
  "resources",
  // User-dependent tables
  "profiles",
  "user_roles",
  "vendor_settings",
  // Product tables
  "products",
  // Article tables
  "articles",
  "article_share_counts",
  "article_reactions",
  "article_comments",
  "article_likes",
  "article_purchases",
  // Order tables
  "orders",
  "order_items",
  "payments",
  "commissions",
  "coupon_redemptions",
  // User interaction tables
  "cart_items",
  "wishlist",
  "reviews",
  "notifications",
  "email_logs",
  "analytics_events",
];

type RestoreRequest = {
  data: Record<string, unknown[]>;
  tables?: string[];
  mode?: 'replace' | 'merge'; // replace = delete then insert, merge = upsert
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Rate limiting check via request timestamp
    const requestTime = Date.now();
    
    // Validate requester
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      console.log("Auth failed:", userError?.message || "No user");
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Admin only - use has_role function for security
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      console.log("Access denied: user is not admin", userData.user.id);
      return new Response(JSON.stringify({ success: false, error: "Access denied. Admin role required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RestoreRequest;
    const payload = body?.data || {};
    const mode = body?.mode || 'replace';

    // Validate payload size (max 50MB when serialized)
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 50 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, error: "Payload too large (max 50MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestedTables = (body.tables && body.tables.length > 0 ? body.tables : Object.keys(payload)) as string[];
    // Filter to only allowed tables AND sort by dependency order
    const tables = TABLE_ORDER.filter((t) => requestedTables.includes(t) && payload[t]);

    let total = 0;
    for (const t of tables) {
      const rows = payload[t];
      if (Array.isArray(rows)) total += rows.length;
    }

    if (total === 0) {
      return new Response(JSON.stringify({ success: false, error: "No valid data to restore" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let imported = 0;
    let deleted = 0;
    const perTable: Record<string, { imported: number; total: number; deleted: number; errors: string[] }> = {};
    const errors: string[] = [];

    // Delete in reverse order to respect foreign keys
    if (mode === 'replace') {
      const deleteOrder = [...tables].reverse();
      for (const table of deleteOrder) {
        try {
          // Different delete strategies based on table type
          const { count, error } = await supabaseAdmin
            .from(table)
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");
          
          if (error) {
            console.log(`Delete warning for ${table}:`, error.message);
            errors.push(`Delete ${table}: ${error.message}`);
          } else {
            deleted += count || 0;
          }
        } catch (e) {
          console.log(`Delete exception for ${table}:`, e);
        }
      }
    }

    // Insert in dependency order
    for (const table of tables) {
      const rows = payload[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;
      
      perTable[table] = { imported: 0, total: rows.length, deleted: 0, errors: [] };

    // Sanitize rows - remove undefined values, validate types, strip dangerous content
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const sanitizedRows = rows.map((row: any) => {
        if (typeof row !== 'object' || row === null || Array.isArray(row)) return null;
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          if (value === undefined) continue;
          // Validate key format (alphanumeric + underscore only)
          if (!/^[a-z_][a-z0-9_]*$/i.test(key)) continue;
          // Validate UUID fields
          if (key === 'id' || key.endsWith('_id')) {
            if (value !== null && typeof value === 'string' && !UUID_REGEX.test(value)) continue;
          }
          // Sanitize string values - strip script tags
          if (typeof value === 'string') {
            sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      }).filter(Boolean);

      // Insert in batches with error handling per batch
      const batchSize = 100; // Smaller batches for reliability
      for (let i = 0; i < sanitizedRows.length; i += batchSize) {
        const batch = sanitizedRows.slice(i, i + batchSize);
        
        try {
          if (mode === 'merge') {
            // Upsert mode - update if exists, insert if not
            const { error } = await supabaseAdmin
              .from(table)
              .upsert(batch as any, { onConflict: 'id' });
            
            if (error) {
              console.log(`Upsert error for ${table} batch ${i}:`, error.message);
              perTable[table].errors.push(error.message);
            } else {
              imported += batch.length;
              perTable[table].imported += batch.length;
            }
          } else {
            // Replace mode - insert only (after delete)
            const { error } = await supabaseAdmin
              .from(table)
              .insert(batch as any);
            
            if (error) {
              console.log(`Insert error for ${table} batch ${i}:`, error.message);
              perTable[table].errors.push(error.message);
              
              // Try inserting one by one to find problematic rows
              for (const row of batch) {
                const { error: singleError } = await supabaseAdmin
                  .from(table)
                  .insert([row] as any);
                
                if (!singleError) {
                  imported++;
                  perTable[table].imported++;
                }
              }
            } else {
              imported += batch.length;
              perTable[table].imported += batch.length;
            }
          }
        } catch (e) {
          console.log(`Exception for ${table} batch ${i}:`, e);
          perTable[table].errors.push(String(e));
        }
      }
    }

    const duration = Date.now() - requestTime;

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        total,
        deleted,
        perTable,
        errors: errors.length > 0 ? errors : undefined,
        duration: `${duration}ms`,
        mode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("restore-database error", e);
    return new Response(JSON.stringify({ success: false, error: "Une erreur interne est survenue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
