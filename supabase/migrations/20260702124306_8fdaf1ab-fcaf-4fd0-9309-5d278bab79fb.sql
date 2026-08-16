DROP POLICY IF EXISTS "Delivery users can update recent delivery status" ON public.orders;

CREATE OR REPLACE FUNCTION public.delivery_mark_picked_up(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF v_order.id IS NULL OR v_order.delivery_user_id IS DISTINCT FROM v_uid THEN
    RETURN false;
  END IF;

  IF v_order.created_at < now() - interval '60 days' THEN
    RAISE EXCEPTION 'Order too old for delivery update';
  END IF;

  UPDATE public.orders
  SET delivery_received_at = COALESCE(delivery_received_at, now()),
      status = 'shipped',
      updated_at = now()
  WHERE id = _order_id;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delivery_submit_handoff(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF v_order.id IS NULL OR v_order.delivery_user_id IS DISTINCT FROM v_uid THEN
    RETURN false;
  END IF;

  IF v_order.delivery_received_at IS NULL THEN
    RAISE EXCEPTION 'Pickup must be confirmed first';
  END IF;

  IF v_order.created_at < now() - interval '60 days' THEN
    RAISE EXCEPTION 'Order too old for delivery update';
  END IF;

  UPDATE public.orders
  SET delivery_delivered_at = COALESCE(delivery_delivered_at, now()),
      status = 'shipped',
      updated_at = now()
  WHERE id = _order_id;

  IF v_order.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_order.user_id,
      'delivery',
      'Validation de réception requise',
      'Message généré automatiquement, ne pas répondre. Le livreur indique vous avoir remis la commande #' || left(_order_id::text, 8) || '. Connectez-vous à votre compte Scoly pour confirmer la réception.',
      jsonb_build_object('order_id', _order_id, 'requires_customer_confirmation', true)
    );
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirm_order_receipt(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF v_order.id IS NULL OR v_order.user_id IS DISTINCT FROM v_uid THEN
    RETURN false;
  END IF;

  IF v_order.delivery_delivered_at IS NULL THEN
    RAISE EXCEPTION 'Delivery handoff has not been submitted yet';
  END IF;

  UPDATE public.orders
  SET customer_confirmed_at = COALESCE(customer_confirmed_at, now()),
      status = 'delivered',
      updated_at = now()
  WHERE id = _order_id;

  IF v_order.delivery_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_order.delivery_user_id,
      'delivery',
      'Réception client confirmée',
      'Message généré automatiquement, ne pas répondre. Le client a confirmé la réception de la commande #' || left(_order_id::text, 8) || '.',
      jsonb_build_object('order_id', _order_id, 'customer_confirmed', true)
    );
  END IF;

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_delivery_stats(_delivery_user_id uuid)
RETURNS TABLE(total_assigned bigint, pending_pickup bigint, in_transit bigint, delivered bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NOT NULL AND customer_confirmed_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE customer_confirmed_at IS NOT NULL)::BIGINT
  FROM public.orders
  WHERE delivery_user_id = _delivery_user_id
$function$;

GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_submit_handoff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delivery_submit_handoff(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_delivery_stats(uuid) TO service_role;