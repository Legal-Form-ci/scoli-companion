
-- 1) Storage: restrict the "own folder" upload/update policies to public user-content buckets only.
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND bucket_id IN ('product-images','article-images','article-media','advertisement-media')
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('product-images','article-images','article-media','advertisement-media')
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
    )
  )
)
WITH CHECK (
  bucket_id IN ('product-images','article-images','article-media','advertisement-media')
  AND (
    owner = auth.uid()
    OR (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::public.app_role
    )
  )
);

-- 2) Enforce authoritative product prices for customer-created order items.
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_user UUID;
  v_price NUMERIC;
  v_active BOOLEAN;
  v_name TEXT;
BEGIN
  SELECT user_id INTO v_order_user FROM public.orders WHERE id = NEW.order_id;
  -- Only enforce for the customer path (client inserting into their own order).
  -- Admin/service_role paths (auth.uid() null or different from order owner) keep flexibility.
  IF auth.uid() IS NULL OR v_order_user IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity for order item';
  END IF;

  SELECT price, is_active, COALESCE(name_fr, name_en) INTO v_price, v_active, v_name
    FROM public.products WHERE id = NEW.product_id;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Product % not found', NEW.product_id;
  END IF;
  IF v_active IS FALSE THEN
    RAISE EXCEPTION 'Product % is not available for purchase', NEW.product_id;
  END IF;

  NEW.unit_price := v_price;
  NEW.total_price := v_price * NEW.quantity;
  IF NEW.product_name IS NULL OR NEW.product_name = '' THEN
    NEW.product_name := v_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_item_price_biu ON public.order_items;
CREATE TRIGGER enforce_order_item_price_biu
  BEFORE INSERT OR UPDATE OF unit_price, total_price, product_id, quantity
  ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_item_price();

-- 3) Recompute the parent order's total_amount from authoritative line items.
CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_user UUID;
  v_items_total NUMERIC;
  v_discount NUMERIC;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  SELECT user_id, COALESCE(discount_amount, 0)
    INTO v_order_user, v_discount
    FROM public.orders WHERE id = v_order_id;

  -- Only recompute for customer-owned orders on the customer path.
  IF auth.uid() IS NULL OR v_order_user IS DISTINCT FROM auth.uid() THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(total_price), 0) INTO v_items_total
    FROM public.order_items WHERE order_id = v_order_id;

  UPDATE public.orders
    SET total_amount = GREATEST(0, v_items_total - v_discount)
    WHERE id = v_order_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS recompute_order_total_aiud ON public.order_items;
CREATE TRIGGER recompute_order_total_aiud
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_order_total();
