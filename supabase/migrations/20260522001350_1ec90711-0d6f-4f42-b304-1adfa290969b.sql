-- ============================
-- 1) kit-uploads : auth only + folder ownership
-- ============================
DROP POLICY IF EXISTS "Anyone can upload kit files" ON storage.objects;

CREATE POLICY "Authenticated users upload to their own kit folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kit-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read their own kit uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kit-uploads'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users delete their own kit uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'kit-uploads'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ============================
-- 2) newsletter_subscribers : restrict SELECT to admins only
-- ============================
DROP POLICY IF EXISTS "Public can read newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can read subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Only admins can read newsletter subscribers"
ON public.newsletter_subscribers
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================
-- 3) schools : explicit SELECT policy (public read intentional, declare it explicitly)
-- ============================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='schools') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can view schools" ON public.schools';
    EXECUTE 'CREATE POLICY "Public can view schools" ON public.schools FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

-- ============================
-- 4) article_likes / article_reactions : restrict raw record reads
-- ============================
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.article_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.article_likes;

CREATE POLICY "Users see their own likes"
ON public.article_likes
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can view reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.article_reactions;

CREATE POLICY "Users see their own reactions"
ON public.article_reactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- ============================
-- 5) reviews : require authentication to read records
-- ============================
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;

CREATE POLICY "Authenticated can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- ============================
-- 6) Public storage buckets : explicit INSERT policies
-- ============================
DROP POLICY IF EXISTS "Admins manage advertisement-media" ON storage.objects;
CREATE POLICY "Admins manage advertisement-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'advertisement-media'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Authenticated upload product-images" ON storage.objects;
CREATE POLICY "Authenticated upload product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated upload article-images" ON storage.objects;
CREATE POLICY "Authenticated upload article-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-images');

DROP POLICY IF EXISTS "Authenticated upload article-media" ON storage.objects;
CREATE POLICY "Authenticated upload article-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'article-media');