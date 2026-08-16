DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kits' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.smart_kits ADD COLUMN created_by uuid NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kits' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE public.smart_kits ADD COLUMN published_at timestamptz NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kits' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.smart_kits ADD COLUMN status text NOT NULL DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kit_items' AND column_name = 'estimated_price'
  ) THEN
    ALTER TABLE public.smart_kit_items ADD COLUMN estimated_price numeric NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kit_items' AND column_name = 'category_hint'
  ) THEN
    ALTER TABLE public.smart_kit_items ADD COLUMN category_hint text NULL;
  END IF;
END $$;

UPDATE public.smart_kits
SET status = CASE WHEN is_active THEN 'published' ELSE 'draft' END,
    published_at = CASE WHEN is_active THEN COALESCE(published_at, updated_at, created_at, now()) ELSE published_at END
WHERE status IS NULL OR status = 'draft';

UPDATE public.smart_kit_items ski
SET estimated_price = COALESCE(NULLIF(ski.estimated_price, 0), p.price, 0)
FROM public.products p
WHERE ski.product_id = p.id;

UPDATE public.smart_kits sk
SET total_price = COALESCE(t.total, 0)
FROM (
  SELECT kit_id, SUM(COALESCE(NULLIF(ski.estimated_price, 0), p.price, 0) * GREATEST(ski.quantity, 1)) AS total
  FROM public.smart_kit_items ski
  LEFT JOIN public.products p ON p.id = ski.product_id
  GROUP BY kit_id
) t
WHERE sk.id = t.kit_id;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kits_created_by_profiles_fkey') THEN
    ALTER TABLE public.smart_kits
      ADD CONSTRAINT smart_kits_created_by_profiles_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kits_status_check') THEN
    ALTER TABLE public.smart_kits
      ADD CONSTRAINT smart_kits_status_check
      CHECK (status IN ('draft', 'published', 'archived'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kit_items_quantity_positive') THEN
    ALTER TABLE public.smart_kit_items
      ADD CONSTRAINT smart_kit_items_quantity_positive
      CHECK (quantity > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kit_items_estimated_price_nonnegative') THEN
    ALTER TABLE public.smart_kit_items
      ADD CONSTRAINT smart_kit_items_estimated_price_nonnegative
      CHECK (estimated_price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_product_unique') THEN
    ALTER TABLE public.cart_items
      ADD CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_key_unique') THEN
    ALTER TABLE public.platform_settings
      ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_smart_kits_public_status ON public.smart_kits(is_active, status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_kits_grade_series ON public.smart_kits(grade_level, series) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_smart_kits_created_by ON public.smart_kits(created_by);
CREATE INDEX IF NOT EXISTS idx_smart_kit_items_kit_sort ON public.smart_kit_items(kit_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_smart_kit_items_product_id ON public.smart_kit_items(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_user_product ON public.cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_public_keys ON public.platform_settings(key) WHERE key IN ('maintenance_mode','maintenance_message','maintenance_image_url');

GRANT SELECT ON public.smart_kits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_kits TO authenticated;
GRANT ALL ON public.smart_kits TO service_role;
GRANT SELECT ON public.smart_kit_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_kit_items TO authenticated;
GRANT ALL ON public.smart_kit_items TO service_role;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

DROP POLICY IF EXISTS "Anyone can read public runtime settings" ON public.platform_settings;
CREATE POLICY "Anyone can read public runtime settings"
  ON public.platform_settings
  FOR SELECT
  TO anon, authenticated
  USING (key IN ('maintenance_mode','maintenance_message','maintenance_image_url'));

DROP POLICY IF EXISTS "Anyone can view active kits" ON public.smart_kits;
CREATE POLICY "Anyone can view active kits"
  ON public.smart_kits
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND status = 'published');

DROP POLICY IF EXISTS "Anyone can view kit items" ON public.smart_kit_items;
CREATE POLICY "Anyone can view kit items"
  ON public.smart_kit_items
  FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.smart_kits
    WHERE smart_kits.id = smart_kit_items.kit_id
      AND smart_kits.is_active = true
      AND smart_kits.status = 'published'
  ));

CREATE OR REPLACE FUNCTION public.get_public_runtime_settings()
RETURNS TABLE(key text, value text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.key, ps.value
  FROM public.platform_settings ps
  WHERE ps.key IN ('maintenance_mode','maintenance_message','maintenance_image_url');
$$;

GRANT EXECUTE ON FUNCTION public.get_public_runtime_settings() TO anon, authenticated, service_role;

INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('maintenance_mode', 'false', 'Active ou désactive la page publique de maintenance.'),
  ('maintenance_message', 'Site en maintenance — nous revenons dans un bref délai.', 'Message affiché au public pendant la maintenance.'),
  ('maintenance_image_url', '', 'Image de fond de la page maintenance.')
ON CONFLICT (key) DO NOTHING;