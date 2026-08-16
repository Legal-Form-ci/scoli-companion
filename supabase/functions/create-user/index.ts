import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendBrevoEmail } from "../_shared/brevo.ts";
import { brandedEmail } from "../_shared/email-branding.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName, phone, roles } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email et mot de passe requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return new Response(JSON.stringify({ error: 'Erreur de configuration serveur' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the caller is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .in('role', ['super_admin', 'admin']);

    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: 'Accès admin requis' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerIsSuperAdmin = callerRoles.some((r: { role: string }) => r.role === 'super_admin');

    // Only a super_admin may assign the super_admin role
    if (Array.isArray(roles) && roles.includes('super_admin') && !callerIsSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Seul un super administrateur peut attribuer le rôle super_admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Cet email est déjà utilisé' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the new user
    console.log('Creating user:', email);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(JSON.stringify({ error: 'Erreur lors de la création de l\'utilisateur. Veuillez réessayer.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = newUser.user.id;
    console.log('User created with ID:', userId);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        email: email,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    // Assign roles
    const VALID_ROLES = ['super_admin','admin','moderator','commercial','comptable','referent','user','vendor','delivery'];
    const rolesToAssign = roles && roles.length > 0 ? roles : ['user'];
    for (const role of rolesToAssign) {
      if (VALID_ROLES.includes(role)) {
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role,
          });

        if (roleError) {
          console.error(`Error assigning role ${role}:`, roleError);
        }
      }
    }

    console.log('User created successfully:', userId);

    // 📧 Email de bienvenue branded (Brevo prioritaire, Resend fallback)
    try {
      const siteUrl = Deno.env.get('SITE_URL') || 'https://scoly.ci';
      const resetUrl = `${siteUrl}/auth/reset-password`;
      const rolesLabel = (rolesToAssign as string[]).join(', ');
      const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
      const html = brandedEmail({
        title: 'Bienvenue dans l\'équipe Scoly',
        preheader: 'Votre compte interne Scoly est prêt',
        bodyHtml: `
          <p>${greeting}</p>
          <p>Un compte <strong>${rolesLabel}</strong> vient d'être créé pour vous sur la plateforme Scoly.</p>
          <p><strong>Identifiants temporaires :</strong></p>
          <ul>
            <li>Email : <strong>${email}</strong></li>
            <li>Mot de passe temporaire : <strong>${password}</strong></li>
          </ul>
          <p style="color:#dc2626;"><strong>⚠️ Important :</strong> changez votre mot de passe dès votre première connexion via le lien ci-dessous.</p>
        `,
        ctaText: 'Définir mon mot de passe',
        ctaUrl: resetUrl,
        footerExtra: 'Si vous n\'attendiez pas ce message, contactez immédiatement notre équipe.',
      });
      await sendBrevoEmail({
        to: email,
        subject: '🎓 Bienvenue dans l\'équipe Scoly — vos accès',
        html,
        category: 'internal_user_welcome',
        emailType: 'transactional',
        dedupeKey: `internal-welcome-${userId}`,
        metadata: { userId, roles: rolesToAssign },
      });
    } catch (mailErr) {
      console.error('[create-user] welcome email failed (non-blocking):', mailErr);
    }


    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Utilisateur créé avec succès',
      userId: userId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({ error: 'Une erreur interne est survenue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
