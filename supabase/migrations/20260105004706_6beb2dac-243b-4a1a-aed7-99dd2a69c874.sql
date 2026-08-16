-- Extend products table for richer catalog metadata and dynamic forms
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS product_genre text,
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS education_series text,
  ADD COLUMN IF NOT EXISTS author_name text,
  ADD COLUMN IF NOT EXISTS author_details text,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS is_office_supply boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS dimensions text;

-- Helpful indexes for fast browsing/admin lists
CREATE INDEX IF NOT EXISTS idx_products_active_created_at ON public.products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products (category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON public.products (is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products (product_type);

-- Articles moderation lists
CREATE INDEX IF NOT EXISTS idx_articles_status_created_at ON public.articles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author_created_at ON public.articles (author_id, created_at DESC);

-- Orders dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);

-- Comments moderation
CREATE INDEX IF NOT EXISTS idx_article_comments_approved_created_at ON public.article_comments (is_approved, created_at DESC);
