
-- 1) Restrict schools SELECT to admins and school owner; frontend uses schools_public view
DROP POLICY IF EXISTS "Authenticated can view schools" ON public.schools;

CREATE POLICY "Admins and owners can view full schools"
ON public.schools
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR admin_user_id = auth.uid()
);

-- 2) Deny anon access on vendor_settings (RESTRICTIVE)
CREATE POLICY "Block anon access to vendor_settings"
ON public.vendor_settings
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3) Vendor-scoped SELECT on storage 'product-sources' (folder = user_id)
CREATE POLICY "Vendors can read their own product-sources files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-sources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
