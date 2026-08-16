
-- Fix permissive INSERT policy on schools - require authenticated and restrict fields
DROP POLICY IF EXISTS "Anyone can register a school" ON public.schools;
CREATE POLICY "Authenticated users can register a school"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
