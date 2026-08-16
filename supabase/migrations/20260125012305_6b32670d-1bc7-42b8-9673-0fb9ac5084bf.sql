-- rate_limits: add an explicit blocking policy so RLS is enabled with policies (and still denies all direct access)
DROP POLICY IF EXISTS "No direct access" ON public.rate_limits;
CREATE POLICY "No direct access"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- (anon role also denied implicitly; add explicit policy for completeness)
DROP POLICY IF EXISTS "No direct access (anon)" ON public.rate_limits;
CREATE POLICY "No direct access (anon)"
ON public.rate_limits
FOR ALL
TO anon
USING (false)
WITH CHECK (false);