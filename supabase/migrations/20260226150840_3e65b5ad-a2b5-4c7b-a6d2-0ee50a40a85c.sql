
-- 1. Restrict platform_settings: remove public read, keep admin-only
DROP POLICY IF EXISTS "Anyone can view platform settings" ON public.platform_settings;
CREATE POLICY "Only admins can view platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Time-limit delivery_proofs access for delivery users (30 days after creation)
DROP POLICY IF EXISTS "Delivery users can view their proofs" ON public.delivery_proofs;
CREATE POLICY "Delivery users can view recent proofs"
  ON public.delivery_proofs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = delivery_user_id
    AND created_at > now() - interval '30 days'
  );

-- 3. Time-limit delivery user access to orders (60 days)
DROP POLICY IF EXISTS "Delivery users can view assigned orders" ON public.orders;
CREATE POLICY "Delivery users can view recent assigned orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    (delivery_user_id = auth.uid() AND created_at > now() - interval '60 days')
    OR (user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- 4. Time-limit delivery user update access to orders (60 days)
DROP POLICY IF EXISTS "Delivery users can update delivery status" ON public.orders;
CREATE POLICY "Delivery users can update recent delivery status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    delivery_user_id = auth.uid()
    AND created_at > now() - interval '60 days'
  )
  WITH CHECK (
    delivery_user_id = auth.uid()
    AND created_at > now() - interval '60 days'
  );

-- 5. Limit payment history access to 1 year for users
DROP POLICY IF EXISTS "Users can view their payments" ON public.payments;
CREATE POLICY "Users can view recent payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND created_at > now() - interval '365 days'
  );

-- 6. Limit user_addresses: users can only see active addresses (no change needed as RLS is already user_id scoped, but add explicit authenticated role)
-- Already properly scoped, no change needed.
