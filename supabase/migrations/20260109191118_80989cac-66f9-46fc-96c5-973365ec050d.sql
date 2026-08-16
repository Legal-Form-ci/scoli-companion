-- Idempotent setup for storage + coupons

-- Buckets
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('article-images', 'article-images', true)
on conflict (id) do nothing;

-- Storage policies (safe if rerun)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can view product images') THEN
    EXECUTE 'CREATE POLICY "Public can view product images" ON storage.objects FOR SELECT USING (bucket_id = ''product-images'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public can view article images') THEN
    EXECUTE 'CREATE POLICY "Public can view article images" ON storage.objects FOR SELECT USING (bucket_id = ''article-images'')';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can upload product images') THEN
    EXECUTE 'CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''product-images'' AND has_role(auth.uid(), ''admin''::app_role))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can update product images') THEN
    EXECUTE 'CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = ''product-images'' AND has_role(auth.uid(), ''admin''::app_role))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admins can delete product images') THEN
    EXECUTE 'CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = ''product-images'' AND has_role(auth.uid(), ''admin''::app_role))';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload their own article images') THEN
    EXECUTE 'CREATE POLICY "Users can upload their own article images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''article-images'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their own article images') THEN
    EXECUTE 'CREATE POLICY "Users can update their own article images" ON storage.objects FOR UPDATE USING (bucket_id = ''article-images'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their own article images') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own article images" ON storage.objects FOR DELETE USING (bucket_id = ''article-images'' AND auth.role() = ''authenticated'' AND (storage.foldername(name))[1] = auth.uid()::text)';
  END IF;
END$$;

-- Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coupons' AND policyname='Admins can manage coupons') THEN
    EXECUTE 'CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id, order_id)
);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coupon_redemptions' AND policyname='Users can view their coupon redemptions') THEN
    EXECUTE 'CREATE POLICY "Users can view their coupon redemptions" ON public.coupon_redemptions FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coupon_redemptions' AND policyname='Users can create their coupon redemptions') THEN
    EXECUTE 'CREATE POLICY "Users can create their coupon redemptions" ON public.coupon_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='coupon_redemptions' AND policyname='Admins can view all coupon redemptions') THEN
    EXECUTE 'CREATE POLICY "Admins can view all coupon redemptions" ON public.coupon_redemptions FOR SELECT USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON public.orders(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);

-- Validate coupon RPC
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_total numeric)
RETURNS TABLE(
  coupon_id uuid,
  discount_amount numeric,
  discount_percent int,
  discount_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  v_discount numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO c
  FROM public.coupons
  WHERE code = _code
    AND COALESCE(is_active, true) = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND (valid_until IS NULL OR valid_until >= now())
    AND (min_order_amount IS NULL OR _order_total >= min_order_amount)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon';
  END IF;

  IF c.max_uses IS NOT NULL AND COALESCE(c.used_count, 0) >= c.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  v_discount := 0;
  IF c.discount_percent IS NOT NULL AND c.discount_percent > 0 THEN
    v_discount := round((_order_total * c.discount_percent / 100.0)::numeric, 0);
  ELSIF c.discount_amount IS NOT NULL AND c.discount_amount > 0 THEN
    v_discount := c.discount_amount;
  END IF;

  IF v_discount > _order_total THEN
    v_discount := _order_total;
  END IF;

  RETURN QUERY
  SELECT c.id, v_discount, COALESCE(c.discount_percent, 0), COALESCE(c.discount_amount, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
