
-- 1. Fix get_delivery_orders: add caller identity check
CREATE OR REPLACE FUNCTION public.get_delivery_orders(_delivery_user_id uuid)
RETURNS SETOF public.orders
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _delivery_user_id <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND NOT public.has_role(auth.uid(), 'moderator'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
    SELECT * FROM public.orders
     WHERE delivery_user_id = _delivery_user_id
     ORDER BY created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_delivery_orders(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_delivery_orders(uuid) TO authenticated, service_role;

-- 2. role_permissions: restrict SELECT to authenticated staff
DROP POLICY IF EXISTS "Anyone can read role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Authenticated staff read role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated staff read role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR public.has_role(auth.uid(), 'commercial'::app_role)
    OR public.has_role(auth.uid(), 'comptable'::app_role)
    OR public.has_role(auth.uid(), 'referent'::app_role)
  );
REVOKE SELECT ON public.role_permissions FROM anon;

-- 3. Lock down internal/trigger SECURITY DEFINER functions
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'handle_new_user','notify_new_user','notify_article_published',
        'notify_order_status_change','notify_payment_status_change',
        'auto_confirm_order_on_payment','decrement_stock_on_order',
        'validate_order_item_price','recompute_order_total','guard_order_total',
        'auto_assign_commercial','sync_article_premium_content',
        'sync_educational_content_file','enforce_article_publish_moderation',
        'audit_admin_action','rls_auto_enable','fill_product_localized_required_fields',
        'cleanup_old_login_sessions','cleanup_old_view_tracking','cleanup_expired_data',
        'check_password_strength'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.proname, r.args);
  END LOOP;
END $$;
