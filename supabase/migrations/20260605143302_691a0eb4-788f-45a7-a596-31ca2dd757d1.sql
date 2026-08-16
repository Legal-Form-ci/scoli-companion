DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'smart_kits' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE public.smart_kits ADD COLUMN product_id uuid NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kits_product_id_fkey') THEN
    ALTER TABLE public.smart_kits
      ADD CONSTRAINT smart_kits_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'smart_kits_product_id_unique') THEN
    ALTER TABLE public.smart_kits
      ADD CONSTRAINT smart_kits_product_id_unique UNIQUE (product_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_smart_kits_product_id ON public.smart_kits(product_id) WHERE product_id IS NOT NULL;

GRANT SELECT ON public.smart_kits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_kits TO authenticated;
GRANT ALL ON public.smart_kits TO service_role;