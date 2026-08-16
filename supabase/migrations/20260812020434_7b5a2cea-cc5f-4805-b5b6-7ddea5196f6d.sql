-- 1) Audit log for sensitive endpoint access
CREATE TABLE IF NOT EXISTS public.security_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  allowed boolean NOT NULL DEFAULT true,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_access_log TO authenticated;
GRANT ALL ON public.security_access_log TO service_role;

ALTER TABLE public.security_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read security access log" ON public.security_access_log;
CREATE POLICY "Admins can read security access log"
ON public.security_access_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_security_access_log_created_at ON public.security_access_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_access_log_actor ON public.security_access_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_access_log_denied ON public.security_access_log (allowed, created_at DESC);

CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  _action text,
  _entity_type text,
  _entity_id text DEFAULT NULL,
  _allowed boolean DEFAULT true,
  _reason text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_access_log (actor_id, action, entity_type, entity_id, allowed, reason, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, _allowed, _reason, COALESCE(_metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_sensitive_access(text, text, text, boolean, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_sensitive_access(text, text, text, boolean, text, jsonb) TO service_role;

-- 2) Delivery RPCs: enforce + audit every attempt
CREATE OR REPLACE FUNCTION public.get_delivery_orders(_delivery_user_id uuid)
RETURNS SETOF orders
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
    INSERT INTO public.security_access_log (actor_id, action, entity_type, entity_id, allowed, reason)
    VALUES (auth.uid(), 'get_delivery_orders', 'orders', _delivery_user_id::text, false, 'IDOR attempt: caller is not the target delivery user');
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO public.security_access_log (actor_id, action, entity_type, entity_id, allowed, reason)
  VALUES (auth.uid(), 'get_delivery_orders', 'orders', _delivery_user_id::text, true, NULL);

  RETURN QUERY
    SELECT * FROM public.orders
     WHERE delivery_user_id = _delivery_user_id
       AND status NOT IN ('delivered'::order_status, 'cancelled'::order_status)
     ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_delivery_stats(_delivery_user_id uuid)
RETURNS TABLE(total_assigned bigint, pending_pickup bigint, in_transit bigint, delivered bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _delivery_user_id <> auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.security_access_log (actor_id, action, entity_type, entity_id, allowed, reason)
    VALUES (auth.uid(), 'get_delivery_stats', 'orders', _delivery_user_id::text, false, 'IDOR attempt on delivery stats');
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NOT NULL AND customer_confirmed_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE customer_confirmed_at IS NOT NULL)::BIGINT
  FROM public.orders
  WHERE delivery_user_id = _delivery_user_id;
END;
$$;

-- 3) Payments: hard 365-day window for owners, admins keep full access
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own recent payments"
ON public.payments FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  AND created_at > (now() - interval '365 days')
);

-- Reject writes on payments outside the window (owner cannot mutate archived records)
CREATE OR REPLACE FUNCTION public.enforce_payment_retention_window()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.created_at < (now() - interval '365 days')
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.security_access_log (actor_id, action, entity_type, entity_id, allowed, reason)
    VALUES (auth.uid(), 'payment_update', 'payments', OLD.id::text, false, 'Payment older than the 365-day window');
    RAISE EXCEPTION 'Payment record is outside the allowed 365-day window';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_payment_retention_window ON public.payments;
CREATE TRIGGER trg_enforce_payment_retention_window
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_retention_window();

-- 4) Realtime: keep only RLS-protected, owner-scoped tables published
ALTER TABLE public.orders REPLICA IDENTITY DEFAULT;
ALTER TABLE public.payments REPLICA IDENTITY DEFAULT;
ALTER TABLE public.order_items REPLICA IDENTITY DEFAULT;

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT pt.tablename
    FROM pg_publication_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = pt.schemaname
    WHERE pt.pubname = 'supabase_realtime'
      AND pt.schemaname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t.tablename);
  END LOOP;
END $$;