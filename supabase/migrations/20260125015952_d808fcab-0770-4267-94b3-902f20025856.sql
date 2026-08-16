-- Update notify_login_attempt to also trigger push notification via pg_net
CREATE OR REPLACE FUNCTION public.notify_login_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
BEGIN
  -- Insert notification for in-app display
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
      'requires_confirmation', true,
      'notification_id', gen_random_uuid()
    )
  );
  
  -- Note: Push notification will be triggered by the application
  -- when it detects new login_sessions entries
  
  RETURN NEW;
END;
$function$;