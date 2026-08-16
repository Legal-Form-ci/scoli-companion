-- Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-sources', 'product-sources', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('kit-uploads', 'kit-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policies product-sources (admins only)
DROP POLICY IF EXISTS "Admins manage product-sources" ON storage.objects;
CREATE POLICY "Admins manage product-sources"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'product-sources' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Policies kit-uploads
DROP POLICY IF EXISTS "Anyone can upload kit files" ON storage.objects;
CREATE POLICY "Anyone can upload kit files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'kit-uploads');

DROP POLICY IF EXISTS "Admins read kit-uploads" ON storage.objects;
CREATE POLICY "Admins read kit-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kit-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete kit-uploads" ON storage.objects;
CREATE POLICY "Admins delete kit-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'kit-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));