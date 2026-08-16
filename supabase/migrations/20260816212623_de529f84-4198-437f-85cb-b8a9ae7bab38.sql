-- 1) Authoritative discount computation (no exceptions, returns 0 when invalid)
CREATE OR REPLACE FUNCTION public.compute_coupon_discount(_code text, _subtotal numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  c RECORD;
  v_discount numeric := 0;
BEGIN
  IF _code IS NULL OR btrim(_code) = '' OR COALESCE(_subtotal, 0) <= 0 THEN
    RETURN 0;
  END IF;

  SELECT * INTO c FROM public.coupons
  WHERE code = _code
    AND COALESCE(is_active, true) = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (min_order_amount IS NULL OR _subtotal >= min_order_amount)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF c.discount_percent IS NOT NULL AND c.discount_percent > 0 THEN
    v_discount := round((_subtotal * c.discount_percent / 100.0)::numeric, 0);
  ELSIF c.discount_amount IS NOT NULL AND c.discount_amount > 0 THEN
    v_discount := c.discount_amount;
  END IF;

  RETURN LEAST(GREATEST(v_discount, 0), _subtotal);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compute_coupon_discount(text, numeric) FROM PUBLIC, anon, authenticated;

-- 2) Enforce server-side prices for BOTH products and kits
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_price numeric;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.product_id IS NOT NULL THEN
    SELECT price INTO v_price FROM public.products WHERE id = NEW.product_id AND is_active = true;
    IF v_price IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;
    NEW.unit_price := v_price;
    NEW.total_price := v_price * NEW.quantity;
    RETURN NEW;
  END IF;

  IF NEW.kit_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(discount_price, 0), total_price)
      INTO v_price
      FROM public.smart_kits
     WHERE id = NEW.kit_id AND COALESCE(is_active, true) = true;
    IF v_price IS NULL THEN
      RAISE EXCEPTION 'Kit not found or inactive';
    END IF;
    NEW.unit_price := v_price;
    NEW.total_price := v_price * NEW.quantity;
    RETURN NEW;
  END IF;

  -- Free-form line items are only allowed for trusted server-side/admin callers
  IF auth.uid() IS NOT NULL AND NOT (
       public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
     ) THEN
    RAISE EXCEPTION 'Order item must reference a product or a kit';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_order_item_price() FROM PUBLIC, anon, authenticated;

-- 3) Discount is always re-derived server-side from the coupon code
CREATE OR REPLACE FUNCTION public.guard_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subtotal numeric;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal FROM public.order_items WHERE order_id = NEW.id;
  NEW.discount_amount := public.compute_coupon_discount(NEW.coupon_code, v_subtotal);
  IF v_subtotal > 0 THEN
    NEW.total_amount := GREATEST(v_subtotal - COALESCE(NEW.discount_amount, 0), 0);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_order_total() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_order_user UUID;
  v_coupon TEXT;
  v_items_total NUMERIC;
  v_discount NUMERIC;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  SELECT user_id, coupon_code
    INTO v_order_user, v_coupon
    FROM public.orders WHERE id = v_order_id;

  IF auth.uid() IS NULL OR v_order_user IS DISTINCT FROM auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(total_price), 0) INTO v_items_total
    FROM public.order_items WHERE order_id = v_order_id;

  v_discount := public.compute_coupon_discount(v_coupon, v_items_total);

  UPDATE public.orders
     SET discount_amount = v_discount,
         total_amount = GREATEST(0, v_items_total - v_discount)
   WHERE id = v_order_id;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.recompute_order_total() FROM PUBLIC, anon, authenticated;

-- Make sure the orders guard also runs on INSERT
DROP TRIGGER IF EXISTS trg_guard_order_total_ins ON public.orders;
CREATE TRIGGER trg_guard_order_total_ins
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_total();

-- 4) Lock down internal SECURITY DEFINER functions that must not be callable via the API
REVOKE EXECUTE ON FUNCTION public.enforce_payment_retention_window() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
