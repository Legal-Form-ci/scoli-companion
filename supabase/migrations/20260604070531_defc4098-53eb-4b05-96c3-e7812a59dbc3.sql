
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_deal_ends_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_flash_deal_ends_at ON public.products (flash_deal_ends_at) WHERE flash_deal_ends_at IS NOT NULL;
