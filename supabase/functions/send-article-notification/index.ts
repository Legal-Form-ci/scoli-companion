import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendBrevoEmail } from "../_shared/brevo.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  articleId?: string;
  status?: "approved" | "rejected";
  reason?: string;
  type?: string;
  userId?: string;
  data?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require admin/moderator authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supaAuth.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id);
    const isStaff = roles?.some((r: any) => r.role === "admin" || r.role === "moderator");
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: NotificationRequest = await req.json();

    // ========== GENERIC NOTIFICATION MODE ==========
    if (body.type && body.userId) {
      const { type, userId, data } = body;
      console.log('Generic notification:', { type, userId });

      let userName = '';
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';

      const prefix = 'Message généré automatiquement, ne pas répondre. ';
      const greeting = userName ? `Bonjour ${userName}, ` : 'Bonjour, ';

      let title = '';
      let message = '';

      switch (type) {
        case 'welcome':
          title = 'Bienvenue sur Scoly !';
          message = `${prefix}${greeting}bienvenue sur Scoly ! Découvrez notre catalogue de fournitures scolaires et bureautiques avec livraison gratuite partout en Côte d'Ivoire.`;
          break;
        case 'security_alert':
          title = 'Alerte de sécurité';
          message = `${prefix}${greeting}une connexion a été détectée sur votre compte depuis ${data?.device || 'un appareil inconnu'}. Si ce n'était pas vous, sécurisez votre compte immédiatement.`;
          break;
        case 'promotion':
          title = data?.title || 'Offre spéciale Scoly';
          message = `${prefix}${greeting}${data?.message || 'une nouvelle promotion est disponible !'}`;
          break;
        case 'admin_announcement':
          title = data?.title || 'Annonce Scoly';
          message = `${prefix}${data?.message || ''}`;
          break;
        default:
          title = 'Notification Scoly';
          message = `${prefix}${greeting}vous avez une nouvelle notification.`;
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: type || 'system',
        title,
        message,
        data: data || {},
      });

      if (type === 'broadcast') {
        const { data: users } = await supabase.from('profiles').select('id').limit(1000);
        if (users && users.length > 0) {
          const notifications = users.map(u => ({
            user_id: u.id,
            type: 'promotion',
            title: data?.title || 'Annonce Scoly',
            message: `${prefix}${data?.message || 'Nouvelle annonce disponible.'}`,
            data: data || {},
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      return new Response(
        JSON.stringify({ success: true, title, message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== ARTICLE NOTIFICATION MODE ==========
    const { articleId, status, reason } = body;
    console.log(`Sending notification for article ${articleId}, status: ${status}`);

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("title_fr, author_id")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      throw new Error("Article not found");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", article.author_id)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(article.author_id);
    const authorEmail = userData?.user?.email;

    if (!authorEmail) {
      throw new Error("Author email not found");
    }

    const authorName = profile?.first_name 
      ? `${profile.first_name} ${profile.last_name || ""}`.trim() 
      : "Auteur";

    await supabase.from('notifications').insert({
      user_id: article.author_id,
      type: 'article',
      title: status === 'approved' ? 'Article publié !' : 'Article à réviser',
      message: `Message généré automatiquement, ne pas répondre. ${
        status === 'approved' 
          ? `Votre article "${article.title_fr}" a été approuvé et publié sur Scoly.`
          : `Votre article "${article.title_fr}" nécessite des modifications.${reason ? ' Raison : ' + reason : ''}`
      }`,
      data: { article_id: articleId, status, reason },
    });

    let emailSubject: string;
    let htmlContent: string;

    if (status === "approved") {
      emailSubject = `🎉 Votre article "${article.title_fr}" a été approuvé !`;
      htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a2744; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0 0 8px; font-size: 22px; font-weight: 700; }
            .header .brand { font-size: 28px; font-weight: 800; color: white; margin-bottom: 12px; }
            .header p { color: rgba(255,255,255,0.6); margin: 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
            .content { background: white; padding: 40px 32px; }
            .button { display: inline-block; background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(15,23,42,0.3); }
            .footer { background-color: #0f172a; padding: 32px; border-radius: 0 0 16px 16px; text-align: center; }
            .footer p { color: rgba(255,255,255,0.4); margin: 0; font-size: 11px; }
            .auto-msg { font-size: 11px; color: #999; text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">Scoly</div>
              <h1>🎉 Article Approuvé !</h1>
              <p>Fournitures scolaires & bureautiques</p>
            </div>
            <div class="content">
              <p class="auto-msg">Message généré automatiquement, ne pas répondre.</p>
              <p>Bonjour <strong>${authorName}</strong>,</p>
              <p>Votre article <strong>"${article.title_fr}"</strong> a été approuvé et publié sur Scoly.</p>
              <p>Merci pour votre contribution !</p>
              <center>
                <a href="https://scoly.ci/actualites" class="button">Voir mon article</a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Scoly — Tous droits réservés — Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      emailSubject = `📝 Votre article "${article.title_fr}" nécessite des modifications`;
      htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a2744; margin: 0; padding: 0; background: #f3f4f6; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0 0 8px; font-size: 22px; font-weight: 700; }
            .header .brand { font-size: 28px; font-weight: 800; color: white; margin-bottom: 12px; }
            .header p { color: rgba(255,255,255,0.7); margin: 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
            .content { background: white; padding: 40px 32px; }
            .reason-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 0 12px 12px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #d97706, #b45309); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(217,119,6,0.3); }
            .footer { background-color: #0f172a; padding: 32px; border-radius: 0 0 16px 16px; text-align: center; }
            .footer p { color: rgba(255,255,255,0.4); margin: 0; font-size: 11px; }
            .auto-msg { font-size: 11px; color: #999; text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">Scoly</div>
              <h1>📝 Article à réviser</h1>
              <p>Fournitures scolaires & bureautiques</p>
            </div>
            <div class="content">
              <p class="auto-msg">Message généré automatiquement, ne pas répondre.</p>
              <p>Bonjour <strong>${authorName}</strong>,</p>
              <p>Votre article <strong>"${article.title_fr}"</strong> nécessite des modifications.</p>
              ${reason ? `<div class="reason-box"><strong>Commentaire :</strong><p style="white-space:pre-wrap;">${String(reason).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}</p></div>` : ""}
              <p>Modifiez votre article depuis votre espace auteur et soumettez-le à nouveau.</p>
              <center>
                <a href="https://scoly.ci/author" class="button">Modifier mon article</a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Scoly — Tous droits réservés — Abidjan, Côte d'Ivoire</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    await sendBrevoEmail({
      from: { name: "Scoly", email: "noreply@scoly.ci" },
      to: authorEmail,
      subject: emailSubject,
      html: htmlContent,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
