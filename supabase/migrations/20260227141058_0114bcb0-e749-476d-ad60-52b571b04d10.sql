-- Allow authenticated users to insert schools (registration)
CREATE POLICY "Anyone can register a school"
ON public.schools
FOR INSERT
TO authenticated
WITH CHECK (is_verified = false);

-- Allow admins to update schools (verify, etc.)  
CREATE POLICY "Admins can update schools"
ON public.schools
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete schools
CREATE POLICY "Admins can delete schools"
ON public.schools
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));