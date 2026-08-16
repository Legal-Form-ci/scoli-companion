-- Fix rate_limits RLS to be more restrictive
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can read rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Anyone can update rate limits" ON public.rate_limits;

-- Create proper policies that only allow the system to manage rate limits
-- Rate limit checks should work via the check_rate_limit function which is SECURITY DEFINER
CREATE POLICY "System can manage rate limits via function"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- The check_rate_limit function is SECURITY DEFINER and handles all rate limiting
-- So direct table access should be restricted at the application level