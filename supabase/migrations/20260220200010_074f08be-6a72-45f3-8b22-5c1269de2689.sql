
-- Add views column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- Function to increment article views (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_article_views(_article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = _article_id AND status = 'published';
END;
$$;

-- Function to increment product views (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_product_views(_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = _product_id AND is_active = true;
END;
$$;
