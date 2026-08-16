-- Tighten delivery visibility on orders to active assignments only
DROP POLICY IF EXISTS "Delivery users can view recent assigned orders" ON public.orders;
CREATE POLICY "Delivery users can view active assigned orders"
ON public.orders FOR SELECT TO authenticated
USING (
  (
    delivery_user_id = auth.uid()
    AND status NOT IN ('delivered'::order_status, 'cancelled'::order_status)
    AND customer_confirmed_at IS NULL
    AND assigned_at IS NOT NULL
    AND created_at > (now() - interval '30 days')
  )
);

-- Owner / staff visibility, scoped to authenticated role only
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Payments: strictly owner or admin, authenticated only
DROP POLICY IF EXISTS "Users can view recent payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Anonymous access explicitly revoked
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.payments FROM anon;