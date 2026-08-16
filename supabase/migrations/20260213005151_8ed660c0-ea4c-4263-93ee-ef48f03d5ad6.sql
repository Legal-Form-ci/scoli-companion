
-- 1. Fix Security Definer View: Drop and recreate vendor_public_info as a regular view (not security definer)
DROP VIEW IF EXISTS public.vendor_public_info;

CREATE VIEW public.vendor_public_info 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  store_name,
  store_description,
  city,
  logo_url,
  banner_url,
  is_verified
FROM public.vendor_settings
WHERE is_verified = true;

-- Enable RLS-like protection via the underlying table's RLS
-- Add a SELECT policy so anyone can view verified vendor public info
CREATE POLICY "Anyone can view vendor public info"
ON public.vendor_settings
FOR SELECT
USING (is_verified = true);

-- 2. Fix RLS Always True on email_logs INSERT: replace with service-role-only check
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

-- Only authenticated service functions should insert email logs
-- Since edge functions use service_role key which bypasses RLS, 
-- we block direct client INSERT entirely
CREATE POLICY "No direct insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (false);
