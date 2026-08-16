
-- 1) Promouvoir admin@scoly.ci en super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE email = 'admin@scoly.ci'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Migrer les anciens rôles vendor/delivery vers commercial
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'commercial'::public.app_role
FROM public.user_roles
WHERE role IN ('vendor','delivery')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles WHERE role IN ('vendor','delivery');

-- 3) Table centralisée des permissions par rôle
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module, action)
);

GRANT SELECT ON public.role_permissions TO anon, authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read role permissions" ON public.role_permissions;
CREATE POLICY "Anyone can read role permissions"
  ON public.role_permissions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only super admins manage permissions" ON public.role_permissions;
CREATE POLICY "Only super admins manage permissions"
  ON public.role_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

-- 4) Fonction has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _module TEXT, _action TEXT DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
      AND rp.module = _module
      AND rp.action = _action
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_permission(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 5) Seed permissions par défaut
DELETE FROM public.role_permissions;

-- Super Admin : accès total
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('super_admin','users','manage'),('super_admin','roles','manage'),('super_admin','permissions','manage'),
  ('super_admin','settings','manage'),('super_admin','products','manage'),('super_admin','categories','manage'),
  ('super_admin','kits','manage'),('super_admin','orders','manage'),('super_admin','referents','manage'),
  ('super_admin','commissions','manage'),('super_admin','withdrawals','validate'),('super_admin','stats','view'),
  ('super_admin','audit','view'),('super_admin','payments','view'),('super_admin','schools','manage'),
  ('super_admin','articles','manage'),('super_admin','emails','manage'),('super_admin','delivery','manage');

-- Admin : accès complet sauf critiques
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('admin','users','manage'),('admin','products','manage'),('admin','categories','manage'),
  ('admin','kits','manage'),('admin','orders','manage'),('admin','referents','manage'),
  ('admin','commissions','manage'),('admin','withdrawals','validate'),('admin','stats','view'),
  ('admin','audit','view'),('admin','payments','view'),('admin','schools','manage'),
  ('admin','articles','manage'),('admin','emails','manage'),('admin','delivery','manage');

-- Modérateur
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('moderator','products','manage'),('moderator','categories','manage'),('moderator','kits','manage'),
  ('moderator','orders','manage'),('moderator','customers','manage'),('moderator','referents','validate'),
  ('moderator','articles','moderate');

-- Commercial / Livreur
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('commercial','schools','create'),('commercial','schools','edit_own_pending'),
  ('commercial','organizations','create'),('commercial','referents','create_pending'),
  ('commercial','delivery','view_own'),('commercial','delivery','update_status'),
  ('commercial','delivery','declare_handoff'),('commercial','delivery','request_confirmation'),
  ('commercial','planning','view');

-- Comptable
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('comptable','payments','view'),('comptable','commissions','manage'),
  ('comptable','withdrawals','process'),('comptable','exports','pdf'),
  ('comptable','exports','excel'),('comptable','finance_history','view');

-- Référent
INSERT INTO public.role_permissions (role, module, action) VALUES
  ('referent','referral','view_own'),('referent','referral','copy_code'),
  ('referent','withdrawals','request'),('referent','withdrawals','view_own_history'),
  ('referent','profile','edit_own'),('referent','password','change_own');

-- 6) Création du compte utilisateur gskablan@gmail.ci
DO $$
DECLARE
  v_user_id UUID;
  v_school_id UUID := 'e21f82c8-865c-4bb5-80d6-86b213766098';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gskablan@gmail.ci' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      'gskablan@gmail.ci', crypt('12345678', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('first_name','Kablan','last_name','Felicien'),
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'gskablan@gmail.ci'),
      'email', v_user_id::text, now(), now(), now()
    );
  END IF;

  -- Profil
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (v_user_id, 'Kablan', 'Felicien', 'gskablan@gmail.ci')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  -- Rôle référent
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'referent'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Association école
  UPDATE public.schools
  SET admin_user_id = v_user_id, updated_at = now()
  WHERE id = v_school_id;
END $$;
