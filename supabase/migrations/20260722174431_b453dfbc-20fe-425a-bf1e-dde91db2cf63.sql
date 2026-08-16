-- Assurer que admin@scoly.ci est super_admin (accès total) et nettoyer d'éventuels rôles legacy
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'admin@scoly.ci' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    -- Supprimer les rôles obsolètes (vendor/delivery) éventuellement encore attachés
    DELETE FROM public.user_roles WHERE user_id = v_uid AND role IN ('vendor'::public.app_role, 'delivery'::public.app_role);
  END IF;
END $$;

-- Rattacher gskablan@gmail.ci au rôle referent + école « KABLAN FELICIEN ETIEGNE » si présent
DO $$
DECLARE v_uid uuid; v_school uuid := 'e21f82c8-865c-4bb5-80d6-86b213766098';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'gskablan@gmail.ci' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_uid, 'referent'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.schools SET admin_user_id = v_uid, updated_at = now()
    WHERE id = v_school AND (admin_user_id IS NULL OR admin_user_id <> v_uid);
  END IF;
END $$;