-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'sent',
    error_message TEXT
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view email logs (without IF NOT EXISTS)
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add delivery tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_user_id UUID,
ADD COLUMN IF NOT EXISTS delivery_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Create index for delivery user
CREATE INDEX IF NOT EXISTS idx_orders_delivery_user ON public.orders(delivery_user_id);

-- Add free_shipping_threshold to platform_settings if not exists
INSERT INTO public.platform_settings (key, value, description)
VALUES ('free_shipping_threshold', '15500', 'Minimum order amount for free shipping in FCFA')
ON CONFLICT (key) DO NOTHING;

-- Function to get delivery person's assigned orders
CREATE OR REPLACE FUNCTION public.get_delivery_orders(_delivery_user_id UUID)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT * FROM public.orders
    WHERE delivery_user_id = _delivery_user_id
    ORDER BY created_at DESC;
$$;

-- RLS policy for delivery users to view their assigned orders
DROP POLICY IF EXISTS "Delivery users can view their orders" ON public.orders;
CREATE POLICY "Delivery users can view their orders" ON public.orders
FOR SELECT TO authenticated
USING (
    user_id = auth.uid() 
    OR delivery_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
);

-- Delivery users can update delivery status on their orders
DROP POLICY IF EXISTS "Delivery users can update their orders" ON public.orders;
CREATE POLICY "Delivery users can update their orders" ON public.orders
FOR UPDATE TO authenticated
USING (
    delivery_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
);

-- Customers can confirm delivery on their orders
DROP POLICY IF EXISTS "Customers can confirm their orders" ON public.orders;
CREATE POLICY "Customers can confirm their orders" ON public.orders
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());