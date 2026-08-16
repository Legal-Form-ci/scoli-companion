// Resend webhook receiver
// URL à enregistrer dans Resend → Webhooks :
//   https://duxbzpsezdhvhprwjwmk.supabase.co/functions/v1/resend-webhook
// Secret de signature : RESEND_WEBHOOK_SECRET (déjà configuré)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, svix-id, svix-timestamp, svix-signature, resend-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";

function verifySvix(payload: string, headers: Headers): boolean {
  if (!WEBHOOK_SECRET) {
    console.error("[Security] RESEND_WEBHOOK_SECRET not configured — rejecting webhook");
    return false;
  }
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sig = headers.get("svix-signature");
  if (!id || !ts || !sig) return false;

  // Resend uses Svix : secret format "whsec_xxxx" base64
  const secret = WEBHOOK_SECRET.startsWith("whsec_")
    ? WEBHOOK_SECRET.slice(6)
    : WEBHOOK_SECRET;
  let key: Buffer;
  try {
    key = Buffer.from(secret, "base64");
  } catch {
    key = Buffer.from(secret);
  }

  const signed = `${id}.${ts}.${payload}`;
  const expected = createHmac("sha256", key).update(signed).digest("base64");

  // sig format: "v1,xxxx v1,yyyy"
  const sigs = sig.split(" ").map((s) => s.split(",")[1]).filter(Boolean);
  for (const s of sigs) {
    try {
      if (s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
        return true;
      }
    } catch { /* ignore */ }
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const raw = await req.text();
  const ok = verifySvix(raw, req.headers);
  if (!ok) {
    console.warn("Resend webhook: invalid signature");
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400, headers: corsHeaders }); }

  const type = String(payload?.type || "");
  const data = payload?.data || {};
  const messageId = data.email_id || data.id || null;
  const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
  console.log(`[resend-webhook] event=${type} id=${messageId} to=${recipient}`);

  // Map event → status
  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delayed",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.failed": "failed",
  };
  const status = map[type] || type;

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    if (messageId) {
      await admin
        .from("email_logs")
        .update({
          status,
          delivered_at: status === "delivered" ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
          metadata: { resend_event: type, resend_payload: data },
        })
        .eq("provider_message_id", messageId);

      // Met à jour les compteurs par campagne (delivered/opened/clicked/bounced/complained)
      const eventForCampaign = ["delivered", "opened", "clicked", "bounced", "complained"].includes(status) ? status : null;
      if (eventForCampaign) {
        await admin.rpc("update_campaign_event_counts", {
          _provider_message_id: messageId,
          _event: eventForCampaign,
        });
      } else {
        await admin
          .from("email_campaign_logs")
          .update({ status, metadata: { resend_event: type } })
          .eq("provider_message_id", messageId);
      }
    }
  } catch (e) {
    console.error("resend-webhook DB error:", e);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
