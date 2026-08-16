
-- 1) Étendre l'énumération app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'commercial';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comptable';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'referent';
