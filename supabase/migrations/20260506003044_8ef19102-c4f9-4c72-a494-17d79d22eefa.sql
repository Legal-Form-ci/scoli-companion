-- Double opt-in fields
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirmation_token_idx
  ON public.newsletter_subscribers(confirmation_token);

-- Public function to confirm a subscription via token
CREATE OR REPLACE FUNCTION public.confirm_newsletter_subscription(_token text)
RETURNS TABLE(success boolean, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  UPDATE public.newsletter_subscribers
  SET confirmed = true,
      confirmed_at = COALESCE(confirmed_at, now()),
      is_active = true
  WHERE confirmation_token = _token
  RETURNING newsletter_subscribers.email INTO v_email;

  IF v_email IS NULL THEN
    RETURN QUERY SELECT false, NULL::text;
  ELSE
    RETURN QUERY SELECT true, v_email;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_newsletter_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(text) TO anon, authenticated;