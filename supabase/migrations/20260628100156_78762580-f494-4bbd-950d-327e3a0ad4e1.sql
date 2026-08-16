
-- Tighten INSERT policies for public buckets: require first folder = auth.uid()
DROP POLICY IF EXISTS "Authenticated upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload article-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload article-media" ON storage.objects;

CREATE POLICY "Authenticated upload product-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated upload article-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'article-images'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY "Authenticated upload article-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'article-media'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR (storage.foldername(name))[1] = auth.uid()::text
    )
  );
