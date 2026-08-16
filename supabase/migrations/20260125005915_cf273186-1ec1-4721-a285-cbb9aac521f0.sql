-- Create login_sessions table to track login attempts and confirmations
CREATE TABLE public.login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  is_confirmed BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their login sessions"
ON public.login_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their login sessions"
ON public.login_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert login sessions"
ON public.login_sessions
FOR INSERT
WITH CHECK (true);

-- Create a public view for vendor_settings to expose only public-safe fields
CREATE VIEW public.vendor_public_info AS
SELECT 
  id,
  user_id,
  store_name,
  store_description,
  logo_url,
  banner_url,
  city,
  is_verified
FROM public.vendor_settings
WHERE is_verified = true;

-- Grant access to authenticated and anon users
GRANT SELECT ON public.vendor_public_info TO authenticated;
GRANT SELECT ON public.vendor_public_info TO anon;

-- Function to notify user of new login attempt
CREATE OR REPLACE FUNCTION public.notify_login_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'security',
    'Nouvelle connexion détectée',
    'Une nouvelle connexion a été détectée depuis ' || COALESCE(NEW.device_info, 'un appareil inconnu') || '. Est-ce vous ?',
    jsonb_build_object(
      'session_id', NEW.id,
      'ip_address', NEW.ip_address,
      'device_info', NEW.device_info,
      'requires_confirmation', true
    )
  );
  RETURN NEW;
END;
$$;

-- Trigger for new login sessions
CREATE TRIGGER on_login_session_created
AFTER INSERT ON public.login_sessions
FOR EACH ROW
EXECUTE FUNCTION public.notify_login_attempt();