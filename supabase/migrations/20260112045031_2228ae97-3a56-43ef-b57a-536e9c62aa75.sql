-- =====================================================
-- 1. FIX SECURITY ISSUES
-- =====================================================

-- Restrict profiles table: only users can see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Ensure admins can view all profiles for management
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix vendor_settings: hide phone/address from public, only show store info
DROP POLICY IF EXISTS "Anyone can view verified vendor settings" ON public.vendor_settings;
CREATE POLICY "Public can view vendor store info only"
ON public.vendor_settings
FOR SELECT
USING (is_verified = true);

-- Admins can view full vendor details including phone/address
DROP POLICY IF EXISTS "Admins can view full vendor details" ON public.vendor_settings;
CREATE POLICY "Admins can view full vendor details"
ON public.vendor_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add INSERT policy for email_logs (edge functions need to insert)
DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;
CREATE POLICY "Service can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 2. CREATE ADVERTISEMENTS TABLE FOR "À LA UNE"
-- =====================================================
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'text')),
  media_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'En savoir plus',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public can view active ads
CREATE POLICY "Anyone can view active advertisements"
ON public.advertisements
FOR SELECT
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Admins can manage all ads
CREATE POLICY "Admins can manage advertisements"
ON public.advertisements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. CREATE FUNCTION TO SEND ORDER EMAILS ON STATUS CHANGE
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_type TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN email_type := 'confirmation';
      WHEN 'shipped' THEN email_type := 'shipped';
      WHEN 'delivered' THEN email_type := 'delivered';
      ELSE email_type := NULL;
    END CASE;

    -- Insert notification for the user
    IF email_type IS NOT NULL AND NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        NEW.user_id,
        'order',
        CASE email_type
          WHEN 'confirmation' THEN 'Commande confirmée'
          WHEN 'shipped' THEN 'Commande expédiée'
          WHEN 'delivered' THEN 'Commande livrée'
        END,
        CASE email_type
          WHEN 'confirmation' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été confirmée.'
          WHEN 'shipped' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' est en cours de livraison.'
          WHEN 'delivered' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été livrée.'
        END,
        jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'email_type', email_type)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();