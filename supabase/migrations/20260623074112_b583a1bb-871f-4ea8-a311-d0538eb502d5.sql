
-- 1. Orders: restrict customer UPDATE to only customer_confirmed_at column via RPC
DROP POLICY IF EXISTS "Customers can confirm their orders" ON public.orders;

CREATE OR REPLACE FUNCTION public.confirm_order_receipt(_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_owner uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  SELECT user_id INTO v_owner FROM public.orders WHERE id = _order_id;
  IF v_owner IS NULL OR v_owner <> v_uid THEN
    RETURN false;
  END IF;
  UPDATE public.orders
     SET customer_confirmed_at = COALESCE(customer_confirmed_at, now())
   WHERE id = _order_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_order_receipt(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) TO authenticated;

-- 2. Schools: block anon SELECT and restrict sensitive contact columns
REVOKE SELECT ON public.schools FROM anon;
REVOKE SELECT (email, phone, address) ON public.schools FROM anon, authenticated;
GRANT SELECT (email, phone, address) ON public.schools TO service_role;

-- Provide secure access to contact info for owners and admins via RPC
CREATE OR REPLACE FUNCTION public.get_school_contact(_school_id uuid)
RETURNS TABLE(email text, phone text, address text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT (
    public.has_role(v_uid, 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.schools WHERE id = _school_id AND admin_user_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT s.email, s.phone, s.address FROM public.schools s WHERE s.id = _school_id;
END;
$$;
REVOKE ALL ON FUNCTION public.get_school_contact(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_school_contact(uuid) TO authenticated;

-- 3. Newsletter: hash confirmation/unsubscribe tokens (drop plaintext)
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmation_token_hash text,
  ADD COLUMN IF NOT EXISTS unsubscribe_token_hash text;

-- Backfill hashes from existing plaintext tokens
UPDATE public.newsletter_subscribers
   SET confirmation_token_hash = encode(digest(confirmation_token, 'sha256'), 'hex')
 WHERE confirmation_token IS NOT NULL AND confirmation_token_hash IS NULL;

UPDATE public.newsletter_subscribers
   SET unsubscribe_token_hash = encode(digest(unsubscribe_token, 'sha256'), 'hex')
 WHERE unsubscribe_token IS NOT NULL AND unsubscribe_token_hash IS NULL;

ALTER TABLE public.newsletter_subscribers DROP COLUMN IF EXISTS confirmation_token;
ALTER TABLE public.newsletter_subscribers DROP COLUMN IF EXISTS unsubscribe_token;

CREATE INDEX IF NOT EXISTS idx_newsletter_conf_hash ON public.newsletter_subscribers(confirmation_token_hash);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsub_hash ON public.newsletter_subscribers(unsubscribe_token_hash);

-- Replace token-comparing RPC to use hashed comparison
CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(_token text)
RETURNS TABLE(success boolean, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_hash text;
BEGIN
  IF _token IS NULL OR length(_token) < 8 THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;
  v_hash := encode(digest(_token, 'sha256'), 'hex');
  UPDATE public.newsletter_subscribers
     SET confirmed = true,
         confirmed_at = COALESCE(confirmed_at, now()),
         is_active = true,
         confirmation_token_hash = NULL
   WHERE confirmation_token_hash = v_hash
   RETURNING newsletter_subscribers.email INTO v_email;

  IF v_email IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
  ELSE
    RETURN QUERY SELECT true, v_email;
  END IF;
END;
$$;

-- New unsubscribe RPC: hashes user-supplied token before matching
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_rows int;
BEGIN
  IF _token IS NULL OR length(_token) < 8 THEN
    RETURN false;
  END IF;
  v_hash := encode(digest(_token, 'sha256'), 'hex');
  UPDATE public.newsletter_subscribers
     SET is_active = false,
         unsubscribed_at = now()
   WHERE unsubscribe_token_hash = v_hash;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.unsubscribe_newsletter(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(text) TO anon, authenticated;
