-- Fix: Drop the security definer view and recreate with proper security
DROP VIEW IF EXISTS public.vendor_public_info;

-- Create a non-security definer view with RLS passthrough
CREATE VIEW public.vendor_public_info 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  store_name,
  store_description,
  logo_url,
  banner_url,
  city,
  is_verified
FROM public.vendor_settings
WHERE is_verified = true;

-- Grant access to authenticated and anon users
GRANT SELECT ON public.vendor_public_info TO authenticated;
GRANT SELECT ON public.vendor_public_info TO anon;

-- Fix login_sessions INSERT policy to be more restrictive
DROP POLICY IF EXISTS "Service role can insert login sessions" ON public.login_sessions;

CREATE POLICY "Authenticated users can insert login sessions"
ON public.login_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Drop the overly broad vendor public policy
DROP POLICY IF EXISTS "Public can view vendor store info only" ON public.vendor_settings;