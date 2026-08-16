import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrevoEmail } from "../_shared/brevo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  emailType: "confirmation" | "shipped" | "delivered";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Require authentication and admin/moderator role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supaAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supaAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);
    const isStaff = roles?.some((r: any) => r.role === "admin" || r.role === "moderator");
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, emailType }: OrderEmailRequest = await req.json();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`*, order_items (product_name, quantity, unit_price, total_price)`)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", order.user_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id);
    const recipientEmail = profile?.email || authUser?.user?.email;

    if (!recipientEmail) {
      throw new Error("No email found for user");
    }

    const customerName = profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ""}`.trim()
      : "Client";

    const orderNumber = order.id.slice(0, 8).toUpperCase();
    const totalFormatted = new Intl.NumberFormat("fr-FR").format(order.total_amount) + " FCFA";

    const itemsList = order.order_items
      .map((item: any) => `<tr>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151;">${item.product_name}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 14px; color: #6b7280;">${item.quantity}</td>
        <td style="padding: 14px 16px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 14px; font-weight: 600; color: #374151;">${new Intl.NumberFormat("fr-FR").format(item.total_price)} FCFA</td>
      </tr>`)
      .join("");

    let subject = "";
    let heading = "";
    let message = "";
    let ctaText = "";
    let statusIcon = "";
    let statusColor = "";
    const ctaUrl = "https://scoly.ci/account";

    switch (emailType) {
      case "confirmation":
        subject = `✅ Confirmation de commande #${orderNumber} — Scoly`;
        heading = "Merci pour votre commande !";
        message = `Nous avons bien reçu votre commande et nous la préparons avec soin. Vous recevrez un email lorsqu'elle sera expédiée.`;
        ctaText = "Suivre ma commande";
        statusIcon = "📦";
        statusColor = "#10b981";
        break;
      case "shipped":
        subject = `🚚 Votre commande #${orderNumber} est en route — Scoly`;
        heading = "Votre commande est en route !";
        message = `Bonne nouvelle ! Votre commande a été expédiée et est en cours de livraison. Notre livreur vous contactera bientôt.`;
        ctaText = "Suivre ma livraison";
        statusIcon = "🚚";
        statusColor = "#3b82f6";
        break;
      case "delivered":
        subject = `🎉 Votre commande #${orderNumber} a été livrée — Scoly`;
        heading = "Commande livrée !";
        message = `Votre commande a été livrée avec succès. Nous espérons que vous êtes satisfait de vos achats. N'hésitez pas à confirmer la réception dans votre espace client.`;
        ctaText = "Confirmer la réception";
        statusIcon = "✅";
        statusColor = "#059669";
        break;
    }

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 640px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <div style="margin-bottom: 16px;">
        <span style="font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Scoly</span>
      </div>
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Fournitures scolaires & bureautiques</p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px 32px;">
      <!-- Status Badge -->
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="display: inline-block; font-size: 48px; line-height: 1;">${statusIcon}</span>
      </div>

      <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 24px; font-weight: 700; text-align: center; line-height: 1.3;">
        ${heading}
      </h2>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 8px 0;">
        Bonjour <strong style="color: #374151;">${customerName}</strong>,
      </p>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 32px 0;">
        ${message}
      </p>

      <!-- Order Number Card -->
      <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 0 0 28px 0; text-align: center;">
        <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Numéro de commande</p>
        <p style="margin: 0; font-size: 24px; font-weight: 800; color: ${statusColor}; letter-spacing: 1px;">#${orderNumber}</p>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
        <thead>
          <tr>
            <th style="padding: 12px 16px; text-align: left; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f0f0f0;">Produit</th>
            <th style="padding: 12px 16px; text-align: center; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f0f0f0;">Qté</th>
            <th style="padding: 12px 16px; text-align: right; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f0f0f0;">Prix</th>
          </tr>
        </thead>
        <tbody>${itemsList}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px; text-align: right; font-weight: 700; color: #111827; font-size: 15px; border-top: 2px solid #111827;">Total</td>
            <td style="padding: 16px; text-align: right; font-weight: 800; color: ${statusColor}; font-size: 20px; border-top: 2px solid #111827;">${totalFormatted}</td>
          </tr>
        </tfoot>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(15,23,42,0.3);">${ctaText}</a>
      </div>

      ${order.shipping_address ? `
      <!-- Shipping Address -->
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0 0 0;">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #92400e; font-size: 14px;">📍 Adresse de livraison</p>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">${order.shipping_address}</p>
      </div>` : ""}
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; padding: 32px; border-radius: 0 0 16px 16px; text-align: center;">
      <p style="color: rgba(255,255,255,0.6); margin: 0 0 8px 0; font-size: 13px;">
        Besoin d'aide ? Contactez-nous à <a href="mailto:contact@scoly.ci" style="color: #60a5fa; text-decoration: none;">contact@scoly.ci</a>
      </p>
      <p style="color: rgba(255,255,255,0.4); margin: 0; font-size: 11px;">
        © ${new Date().getFullYear()} Scoly. Tous droits réservés. — Abidjan, Côte d'Ivoire
      </p>
    </div>
  </div>
</body>
</html>`;

    // Génération PDF (uniquement pour confirmation)
    const attachments: Array<{ name: string; content: string; type?: string }> = [];
    if (emailType === "confirmation") {
      try {
        const pdfResp = await fetch(`${supabaseUrl}/functions/v1/generate-receipt-pdf`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ order_id: orderId }),
        });
        if (pdfResp.ok) {
          const pdfJson = await pdfResp.json();
          if (pdfJson?.pdf_base64) {
            attachments.push({
              name: `scoly-recu-${orderNumber}.pdf`,
              content: pdfJson.pdf_base64,
              type: "application/pdf",
            });
          }
        }
      } catch (e) {
        console.error("[send-order-email] PDF generation failed:", e);
      }
    }

    const result = await sendBrevoEmail({
      from: { name: "Scoly", email: "noreply@scoly.ci" },
      to: recipientEmail,
      subject,
      html,
      attachments: attachments.length ? attachments : undefined,
    });


    console.log("Email sent:", result);

    await supabase.from("email_logs").insert({
      order_id: orderId,
      email_type: emailType,
      recipient_email: recipientEmail,
      status: result.ok ? "sent" : "failed",
      error_message: result.ok ? null : JSON.stringify(result),
    });

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
