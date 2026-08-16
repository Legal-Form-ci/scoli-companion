import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    const BOOTSTRAP_TOKEN = Deno.env.get('BOOTSTRAP_ADMIN_TOKEN');
    if (!BOOTSTRAP_TOKEN || token !== BOOTSTRAP_TOKEN) {
      console.error('Invalid bootstrap token');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Defense-in-depth: bootstrap token is one-time-use. Refuse if already used.
    const { data: bootstrapFlag } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'bootstrap_admin_used')
      .maybeSingle();

    if (bootstrapFlag?.value === 'true') {
      console.error('Bootstrap admin already used, refusing');
      return new Response(JSON.stringify({ error: 'Bootstrap already used' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@scoly.ci';
    const adminPassword = generateSecurePassword();

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;

    if (existingAdmin) {
      console.log('Admin user already exists, updating role...');
      userId = existingAdmin.id;
    } else {
      // Create the admin user with generated password
      console.log('Creating admin user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'Super',
          last_name: 'Admin',
        },
      });

      if (createError) {
        console.error('Error creating admin user:', createError);
        return new Response(JSON.stringify({ error: 'Erreur lors de la création du compte admin' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = newUser.user.id;
      console.log('Admin user created with ID:', userId);
    }

    // Check if admin role already exists
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'admin',
        }, {
          onConflict: 'user_id,role',
        });

      if (roleError) {
        console.error('Error assigning admin role:', roleError);
        return new Response(JSON.stringify({ error: 'Erreur lors de l\'attribution du rôle' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log('Admin role assigned');
    } else {
      console.log('Admin role already exists');
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          first_name: 'Super',
          last_name: 'Admin',
          phone: '+225 07 58 46 59 33',
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('Profile created');
      }
    }

    // Send password reset email so admin can set their own password
    if (!existingAdmin) {
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: adminEmail,
      });
      console.log('Password recovery link generated for admin');
    }

    // Mark bootstrap token as consumed (one-time use defense-in-depth)
    await supabaseAdmin
      .from('platform_settings')
      .upsert({
        key: 'bootstrap_admin_used',
        value: 'true',
        description: 'Bootstrap admin token has been used. Rotate BOOTSTRAP_ADMIN_TOKEN before reuse.',
      }, { onConflict: 'key' });

    return new Response(JSON.stringify({ 
      success: true, 
      message: existingAdmin 
        ? 'Admin role vérifié. Utilisez la réinitialisation de mot de passe si nécessaire.'
        : 'Super admin créé. Un email de réinitialisation de mot de passe a été envoyé à ' + adminEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bootstrap error:', error);
    return new Response(JSON.stringify({ error: 'Une erreur interne est survenue' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
