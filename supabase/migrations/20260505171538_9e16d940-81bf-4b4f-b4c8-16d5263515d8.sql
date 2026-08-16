
DROP VIEW IF EXISTS public.schools_public;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view verified schools" ON public.schools;

CREATE VIEW public.schools_public AS
SELECT id, name, code, type, city, region, address, website, logo_url, is_verified, student_count, created_at
FROM public.schools
WHERE is_verified = true AND COALESCE(is_active, true) = true;

GRANT SELECT ON public.schools_public TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;

CREATE POLICY "Users read own private or public realtime topics"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('private:' || auth.uid()::text)
    OR realtime.topic() LIKE 'public:%'
  );

CREATE POLICY "Users send own private or public realtime topics"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = ('private:' || auth.uid()::text)
    OR realtime.topic() LIKE 'public:%'
  );
