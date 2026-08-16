
REVOKE SELECT ON public.reviews FROM anon, authenticated;
GRANT SELECT (id, product_id, rating, comment, created_at) ON public.reviews TO anon, authenticated;

REVOKE SELECT ON public.schools FROM anon, authenticated;
GRANT SELECT (id, name, code, type, city, region, address, website, logo_url, admin_user_id, is_verified, is_active, student_count, created_at, updated_at) ON public.schools TO anon, authenticated;

REVOKE SELECT ON public.coupons FROM anon, authenticated;
GRANT SELECT (id, code, discount_percent, discount_amount, min_order_amount, valid_from, valid_until, is_active) ON public.coupons TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own product images') THEN
    CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id='product-images' AND owner = auth.uid())
      WITH CHECK (bucket_id='product-images' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own product images') THEN
    CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id='product-images' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own article images') THEN
    CREATE POLICY "Users can update own article images" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id='article-images' AND owner = auth.uid())
      WITH CHECK (bucket_id='article-images' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own article images') THEN
    CREATE POLICY "Users can delete own article images" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id='article-images' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update own article media') THEN
    CREATE POLICY "Users can update own article media" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id='article-media' AND owner = auth.uid())
      WITH CHECK (bucket_id='article-media' AND owner = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete own article media') THEN
    CREATE POLICY "Users can delete own article media" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id='article-media' AND owner = auth.uid());
  END IF;
END$$;
