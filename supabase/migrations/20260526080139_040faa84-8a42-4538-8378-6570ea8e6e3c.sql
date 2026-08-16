
DROP VIEW IF EXISTS public.schools_public;

CREATE VIEW public.schools_public
WITH (security_invoker = on) AS
SELECT
  id, name, code, type, city, region, address, website, logo_url,
  is_verified, is_active, student_count, created_at, updated_at
FROM public.schools
WHERE is_active = true;

GRANT SELECT ON public.schools_public TO anon, authenticated;
