
-- educational_content
REVOKE SELECT (file_url) ON public.educational_content FROM anon;
REVOKE SELECT (file_url) ON public.educational_content FROM authenticated;

DROP POLICY IF EXISTS "Anyone can view approved content" ON public.educational_content;
CREATE POLICY "Public can view approved free content"
  ON public.educational_content FOR SELECT
  TO anon
  USING (is_approved = true AND is_free = true);
CREATE POLICY "Authenticated can view approved content"
  ON public.educational_content FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- schools
DROP POLICY IF EXISTS "Public can view validated schools" ON public.schools;

DROP VIEW IF EXISTS public.schools_public;
CREATE VIEW public.schools_public
WITH (security_invoker = on) AS
SELECT id, name, code, type, city, region, address, website, logo_url,
       is_verified, is_active, student_count, created_at, updated_at
FROM public.schools
WHERE is_active = true AND is_verified = true;

GRANT SELECT ON public.schools_public TO anon, authenticated;

CREATE POLICY "Authenticated can view validated schools"
  ON public.schools FOR SELECT
  TO authenticated
  USING (is_active = true AND is_verified = true);
