-- Add 'delivery' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';

-- Add delivery stats function for delivery personnel
CREATE OR REPLACE FUNCTION public.get_delivery_stats(_delivery_user_id uuid)
RETURNS TABLE(
  total_assigned bigint,
  pending_pickup bigint,
  in_transit bigint,
  delivered bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::BIGINT as total_assigned,
    COUNT(*) FILTER (WHERE delivery_received_at IS NULL)::BIGINT as pending_pickup,
    COUNT(*) FILTER (WHERE delivery_received_at IS NOT NULL AND delivery_delivered_at IS NULL)::BIGINT as in_transit,
    COUNT(*) FILTER (WHERE delivery_delivered_at IS NOT NULL)::BIGINT as delivered
  FROM public.orders
  WHERE delivery_user_id = _delivery_user_id
$$;

-- Create index for faster delivery queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_user_id, delivery_received_at, delivery_delivered_at);

-- Update RLS policy for delivery users to see their assigned orders
DROP POLICY IF EXISTS "Delivery users can view assigned orders" ON public.orders;
CREATE POLICY "Delivery users can view assigned orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    delivery_user_id = auth.uid() OR
    user_id = auth.uid() OR
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Allow delivery users to update delivery status
DROP POLICY IF EXISTS "Delivery users can update delivery status" ON public.orders;
CREATE POLICY "Delivery users can update delivery status"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (delivery_user_id = auth.uid())
  WITH CHECK (delivery_user_id = auth.uid());