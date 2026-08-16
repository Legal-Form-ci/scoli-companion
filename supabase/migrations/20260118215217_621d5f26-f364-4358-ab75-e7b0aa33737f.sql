-- Fix failed migration: remove invalid cross-db reference and tighten email_logs insert policy

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive insert policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Create restricted insert policy for service_role only
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
TO service_role
WITH CHECK (true);