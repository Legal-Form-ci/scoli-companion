
-- 1. Tighten delivery_proofs: delivery users can only see their OWN proofs (not vendor/admin via this policy — admins already have ALL)
DROP POLICY IF EXISTS "Delivery users can view their proofs" ON public.delivery_proofs;
CREATE POLICY "Delivery users can view their proofs"
ON public.delivery_proofs FOR SELECT
TO authenticated
USING (auth.uid() = delivery_user_id);

-- 2. Block anon from delivery_proofs entirely
CREATE POLICY "Anon cannot access delivery proofs"
ON public.delivery_proofs FOR SELECT
TO anon
USING (false);

-- 3. Auto-cleanup old login sessions (> 30 days) — security definer function
CREATE OR REPLACE FUNCTION public.cleanup_old_login_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.login_sessions WHERE created_at < now() - interval '30 days';
$$;

-- 4. Block anon from login_sessions
CREATE POLICY "Anon cannot access login sessions"
ON public.login_sessions FOR SELECT
TO anon
USING (false);

-- 5. Block anon from notifications
CREATE POLICY "Anon cannot access notifications"
ON public.notifications FOR SELECT
TO anon
USING (false);

-- 6. Block anon from internal_messages
CREATE POLICY "Anon cannot access internal messages"
ON public.internal_messages FOR SELECT
TO anon
USING (false);

-- 7. Block anon from push_subscriptions
CREATE POLICY "Anon cannot access push subscriptions"
ON public.push_subscriptions FOR SELECT
TO anon
USING (false);

-- 8. Block anon from user_roles
CREATE POLICY "Anon cannot access user roles"
ON public.user_roles FOR SELECT
TO anon
USING (false);

-- 9. Block anon from cart_items
CREATE POLICY "Anon cannot access cart items"
ON public.cart_items FOR SELECT
TO anon
USING (false);

-- 10. Block anon from wishlist
CREATE POLICY "Anon cannot access wishlist"
ON public.wishlist FOR SELECT
TO anon
USING (false);

-- 11. Block anon from user_addresses
CREATE POLICY "Anon cannot access user addresses"
ON public.user_addresses FOR SELECT
TO anon
USING (false);

-- 12. Block anon from loyalty_rewards
CREATE POLICY "Anon cannot access loyalty rewards"
ON public.loyalty_rewards FOR SELECT
TO anon
USING (false);

-- 13. Block anon from delivery_proofs (all ops)
CREATE POLICY "Anon cannot insert delivery proofs"
ON public.delivery_proofs FOR INSERT
TO anon
WITH CHECK (false);
