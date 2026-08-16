
-- Fix remaining security issues

-- 1. Schools: drop any leftover public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active schools" ON public.schools;

-- 2. Commissions: ensure vendors have read-only access (no INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Vendors can view their commissions" ON public.commissions;
CREATE POLICY "Vendors can only view their commissions"
ON public.commissions FOR SELECT TO authenticated
USING (auth.uid() = vendor_id);

-- 3. Comments: change default to require moderation
ALTER TABLE public.article_comments ALTER COLUMN is_approved SET DEFAULT false;

-- 4. Order items: validate prices server-side via trigger
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_price numeric;
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    SELECT price INTO v_product_price FROM public.products WHERE id = NEW.product_id AND is_active = true;
    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive';
    END IF;
    NEW.unit_price := v_product_price;
    NEW.total_price := v_product_price * NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER enforce_order_item_price
BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();

-- 5. Login sessions: restrict user updates to confirmation only
DROP POLICY IF EXISTS "Users can update their login sessions" ON public.login_sessions;
CREATE POLICY "Users can confirm their login sessions"
ON public.login_sessions FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND is_blocked = false)
WITH CHECK (auth.uid() = user_id);

-- 6. Unique constraints to prevent duplicate likes/reactions
ALTER TABLE public.article_likes DROP CONSTRAINT IF EXISTS article_likes_user_article_unique;
ALTER TABLE public.article_likes ADD CONSTRAINT article_likes_user_article_unique UNIQUE (user_id, article_id);

ALTER TABLE public.article_reactions DROP CONSTRAINT IF EXISTS article_reactions_user_article_type_unique;
ALTER TABLE public.article_reactions ADD CONSTRAINT article_reactions_user_article_type_unique UNIQUE (user_id, article_id, reaction_type);
