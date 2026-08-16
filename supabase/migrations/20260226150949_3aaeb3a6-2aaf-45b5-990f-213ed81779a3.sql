
-- Further restrict delivery_proofs: reduce access window to 7 days and remove sensitive fields after delivery
-- Replace the 30-day policy with a 7-day policy
DROP POLICY IF EXISTS "Delivery users can view recent proofs" ON public.delivery_proofs;
CREATE POLICY "Delivery users can view very recent proofs"
  ON public.delivery_proofs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = delivery_user_id
    AND created_at > now() - interval '7 days'
  );

-- Ensure delivery proof INSERT requires authenticated role explicitly
DROP POLICY IF EXISTS "Delivery users can create proofs" ON public.delivery_proofs;
CREATE POLICY "Delivery users can create proofs"
  ON public.delivery_proofs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = delivery_user_id);
