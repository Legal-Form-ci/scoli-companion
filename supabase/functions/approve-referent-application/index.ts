import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendBrevoEmail } from "../_shared/brevo.ts";
import { brandedEmail } from "../_shared/email-branding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const tempPassword = () =>
  `Scoly-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}!`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Configuration serveur manquante" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non autorisé" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await admin.auth.getUser(token);
    if (authError || !caller) return json({ error: "Non autorisé" }, 401);

    // Vérification stricte : admin, super_admin ou modérateur uniquement
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["super_admin", "admin", "moderator"]);
    if (!callerRoles || callerRoles.length === 0) {
      return json({ error: "Accès réservé à l'administration et à la modération" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const applicationId = typeof body?.applicationId === "string" ? body.applicationId : null;
    if (!applicationId) return json({ error: "applicationId requis" }, 400);

    const { data: app, error: appError } = await admin
      .from("referent_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (appError) return json({ error: appError.message }, 500);
    if (!app) return json({ error: "Candidature introuvable" }, 404);
    if (app.status === "approved") return json({ error: "Candidature déjà approuvée" }, 400);
    if (app.status !== "submitted") {
      return json({ error: "La candidature doit être transmise par le commercial avant validation" }, 400);
    }

    const email = String(app.email).trim().toLowerCase();
    const password = tempPassword();

    // 1. Compte utilisateur (réutilise la logique de create-user)
    let userId: string | null = null;
    let createdNow = false;

    const { data: existingList } = await admin.auth.admin.listUsers();
    const existing = existingList?.users?.find((u) => u.email?.toLowerCase() === email);

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: app.first_name, last_name: app.last_name },
      });
      if (createError || !created?.user) {
        console.error("[approve-referent] createUser", createError);
        return json({ error: "Impossible de créer le compte référent" }, 500);
      }
      userId = created.user.id;
      createdNow = true;
    }

    // 2. Profil
    await admin.from("profiles").upsert({
      id: userId,
      first_name: app.first_name,
      last_name: app.last_name,
      email,
      phone: app.phone,
    });

    // 3. Rôle référent
    const { error: roleError } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role: "referent" }, { onConflict: "user_id,role" });
    if (roleError) console.error("[approve-referent] role", roleError);

    // 4. Lien de parrainage établissement (référent parrain → filleul)
    if (app.sponsor_referent_id) {
      const { data: code } = await admin.rpc("generate_referral_code");
      await admin.from("referrals").insert({
        referrer_id: app.sponsor_referent_id,
        referred_id: userId,
        referral_code: code || `SCOLY-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }

    // 5. Statut approuvé
    const { error: updError } = await admin
      .from("referent_applications")
      .update({
        status: "approved",
        reviewed_by: caller.id,
        reviewed_at: new Date().toISOString(),
        created_user_id: userId,
        rejection_reason: null,
      })
      .eq("id", applicationId);
    if (updError) return json({ error: updError.message }, 500);

    // 6. Notifications internes
    const notifs: Array<Record<string, unknown>> = [
      {
        user_id: userId,
        type: "account",
        title: "Votre compte référent Scoly est actif",
        message: `Bienvenue ${app.first_name} ! Votre espace référent est disponible sur /me.`,
        data: { application_id: applicationId },
      },
    ];
    if (app.submitted_by) {
      notifs.push({
        user_id: app.submitted_by,
        type: "referent",
        title: "Candidature approuvée",
        message: `Le compte référent de ${app.first_name} ${app.last_name} a été créé.`,
        data: { application_id: applicationId },
      });
    }
    if (app.sponsor_referent_id && app.sponsor_referent_id !== app.submitted_by) {
      notifs.push({
        user_id: app.sponsor_referent_id,
        type: "referent",
        title: "Votre filleul est validé",
        message: `${app.first_name} ${app.last_name} est désormais référent Scoly.`,
        data: { application_id: applicationId },
      });
    }
    await admin.from("notifications").insert(notifs);

    // 7. E-mail de bienvenue
    const siteUrl = Deno.env.get("SITE_URL") || "https://scoly.ci";
    try {
      const html = brandedEmail({
        title: "Votre compte référent Scoly",
        preheader: "Votre candidature a été approuvée",
        bodyHtml: `
          <p>Bonjour ${app.first_name},</p>
          <p>Votre candidature de <strong>référent Scoly</strong> a été approuvée.</p>
          ${createdNow ? `<ul>
            <li>Email : <strong>${email}</strong></li>
            <li>Mot de passe temporaire : <strong>${password}</strong></li>
          </ul>
          <p style="color:#dc2626;"><strong>Changez votre mot de passe dès la première connexion.</strong></p>` : `<p>Connectez-vous avec votre compte existant.</p>`}
        `,
        ctaText: "Accéder à mon espace référent",
        ctaUrl: `${siteUrl}/me`,
      });
      await sendBrevoEmail({
        to: email,
        subject: "🎓 Votre compte référent Scoly est actif",
        html,
        category: "referent_welcome",
        emailType: "transactional",
        dedupeKey: `referent-welcome-${applicationId}`,
        metadata: { applicationId, userId },
      });
    } catch (mailErr) {
      console.error("[approve-referent] email failed (non-blocking):", mailErr);
    }

    // 8. SMS (non bloquant)
    try {
      if (app.phone) {
        await admin.functions.invoke("send-sms", {
          body: {
            action: "send",
            recipients: [app.phone],
            message: `Scoly: votre compte referent est actif. Connectez-vous sur ${siteUrl}/me`,
          },
        });
      }
    } catch (smsErr) {
      console.error("[approve-referent] sms failed (non-blocking):", smsErr);
    }

    return json({ success: true, userId, created: createdNow });
  } catch (error) {
    console.error("[approve-referent] error", error);
    return json({ error: "Une erreur interne est survenue" }, 500);
  }
});
