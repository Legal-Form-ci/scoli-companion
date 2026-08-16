
-- Restrict super_admin role writes to super_admin callers only
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins insert roles (super_admin gated)"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins update roles (super_admin gated)"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );

CREATE POLICY "Admins delete roles (super_admin gated)"
  ON public.user_roles FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (role <> 'super_admin'::app_role OR public.has_role(auth.uid(), 'super_admin'::app_role))
  );
