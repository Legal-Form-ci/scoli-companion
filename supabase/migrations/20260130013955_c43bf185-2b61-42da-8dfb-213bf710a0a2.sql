-- Fix login alert: add origin_device_fingerprint to notification data in trigger
-- And add enforcement for blocked sessions

CREATE OR REPLACE FUNCTION public.notify_login_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Do NOT create notification here - the application will handle it
  -- This prevents duplicate notifications and allows fingerprint to be included
  -- The client-side sendLoginPushNotification already creates the notification with fingerprint
  
  RETURN NEW;
END;
$function$;

-- Create function to revoke/invalidate blocked sessions
-- This will be called when user clicks "Ce n'est pas moi"
CREATE OR REPLACE FUNCTION public.revoke_blocked_session(_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_session_user_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Get the session's user_id
  SELECT user_id INTO v_session_user_id
  FROM public.login_sessions
  WHERE id = _session_id;
  
  -- Only allow the session owner to revoke
  IF v_session_user_id IS NULL OR v_session_user_id != v_current_user_id THEN
    RETURN false;
  END IF;
  
  -- Mark session as blocked
  UPDATE public.login_sessions
  SET 
    is_blocked = true,
    is_confirmed = false,
    confirmed_at = now()
  WHERE id = _session_id;
  
  -- Create audit log entry
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address)
  VALUES (
    v_current_user_id,
    'session_revoked',
    'login_session',
    _session_id::text,
    jsonb_build_object('blocked', true, 'revoked_at', now()),
    NULL
  );
  
  RETURN true;
END;
$function$;

-- Revoke anon access to increment_article_share (security fix)
REVOKE EXECUTE ON FUNCTION public.increment_article_share(uuid, text) FROM anon;

-- Only authenticated users can increment shares (with rate limiting in function)
GRANT EXECUTE ON FUNCTION public.increment_article_share(uuid, text) TO authenticated;

-- Update increment_article_share to include rate limiting
CREATE OR REPLACE FUNCTION public.increment_article_share(_article_id uuid, _platform text)
RETURNS article_share_counts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result public.article_share_counts;
  v_user_id uuid;
  v_rate_check record;
BEGIN
  v_user_id := auth.uid();
  
  -- Require authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _platform NOT IN ('facebook','whatsapp','twitter','linkedin','telegram') THEN
    RAISE EXCEPTION 'Unsupported platform: %', _platform;
  END IF;

  -- Check rate limit (max 10 shares per article per user per hour)
  SELECT * INTO v_rate_check FROM public.check_rate_limit(
    v_user_id::text || '_share_' || _article_id::text,
    'article_share',
    10,  -- max 10 attempts
    3600, -- per hour
    1800  -- block for 30 min if exceeded
  );
  
  IF NOT v_rate_check.allowed THEN
    RAISE EXCEPTION 'Rate limit exceeded. Try again later.';
  END IF;

  INSERT INTO public.article_share_counts (article_id)
  VALUES (_article_id)
  ON CONFLICT (article_id) DO NOTHING;

  UPDATE public.article_share_counts
  SET
    facebook = facebook + CASE WHEN _platform = 'facebook' THEN 1 ELSE 0 END,
    whatsapp = whatsapp + CASE WHEN _platform = 'whatsapp' THEN 1 ELSE 0 END,
    twitter = twitter + CASE WHEN _platform = 'twitter' THEN 1 ELSE 0 END,
    linkedin = linkedin + CASE WHEN _platform = 'linkedin' THEN 1 ELSE 0 END,
    telegram = telegram + CASE WHEN _platform = 'telegram' THEN 1 ELSE 0 END,
    total = total + 1
  WHERE article_id = _article_id
  RETURNING * INTO result;

  RETURN result;
END;
$function$;