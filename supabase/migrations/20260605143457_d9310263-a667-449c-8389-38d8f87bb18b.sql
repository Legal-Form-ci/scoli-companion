CREATE OR REPLACE FUNCTION public.get_public_runtime_settings()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ps.key, ps.value
  FROM public.platform_settings ps
  WHERE ps.key IN ('maintenance_mode','maintenance_message','maintenance_image_url');
$$;

GRANT EXECUTE ON FUNCTION public.get_public_runtime_settings() TO anon, authenticated, service_role;