-- Tighten RLS: remove overly permissive policies flagged by the linter

-- rate_limits: do not allow direct table access from client; use the SECURITY DEFINER function instead
DROP POLICY IF EXISTS "System can manage rate limits via function" ON public.rate_limits;

-- audit_logs: inserts should be done by backend (service role bypasses RLS); keep only admin read policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;