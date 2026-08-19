-- 1) login_sessions: remove direct self-update, replace with controlled RPC
DROP POLICY IF EXISTS "Users can confirm their login sessions" ON public.login_sessions;

CREATE OR REPLACE FUNCTION public.confirm_login_session(_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_blocked boolean;
  v_current uuid := auth.uid();
BEGIN
  IF v_current IS NULL THEN
    RETURN false;
  END IF;

  SELECT user_id, is_blocked INTO v_user_id, v_blocked
  FROM public.login_sessions WHERE id = _session_id;

  IF v_user_id IS NULL OR v_user_id <> v_current OR COALESCE(v_blocked, false) THEN
    RETURN false;
  END IF;

  UPDATE public.login_sessions
     SET is_confirmed = true,
         confirmed_at = now()
   WHERE id = _session_id
     AND user_id = v_current
     AND COALESCE(is_blocked, false) = false;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_login_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_login_session(uuid) TO authenticated, service_role;

-- 2) newsletter_subscribers: force server-controlled columns on public inserts
CREATE OR REPLACE FUNCTION public.enforce_newsletter_public_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  NEW.confirmed := false;
  NEW.confirmed_at := NULL;
  NEW.is_active := true;
  NEW.confirmation_token_hash := NULL;
  NEW.unsubscribe_token_hash := NULL;
  NEW.unsubscribed_at := NULL;
  NEW.subscribed_at := now();
  NEW.confirmation_sent_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_newsletter_public_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_newsletter_public_insert_trg ON public.newsletter_subscribers;
CREATE TRIGGER enforce_newsletter_public_insert_trg
BEFORE INSERT ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.enforce_newsletter_public_insert();

-- tighten the permissive insert policies to at least validate the email shape
DROP POLICY IF EXISTS "Secure public subscribe" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "secure_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND confirmed = false
  AND confirmed_at IS NULL
  AND confirmation_token_hash IS NULL
  AND unsubscribe_token_hash IS NULL
);