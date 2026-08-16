CREATE TABLE IF NOT EXISTS public.email_provider_daily_stats (
  stat_date date NOT NULL,
  provider text NOT NULL,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stat_date, provider)
);

ALTER TABLE public.email_provider_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view provider daily stats" ON public.email_provider_daily_stats;
CREATE POLICY "Admins can view provider daily stats"
ON public.email_provider_daily_stats
FOR SELECT
TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "No direct write provider daily stats" ON public.email_provider_daily_stats;
CREATE POLICY "No direct write provider daily stats"
ON public.email_provider_daily_stats
FOR ALL
TO public
USING (false)
WITH CHECK (false);

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retryable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_category text,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS email_logs_dedupe_key_idx
  ON public.email_logs(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_logs_created_at_idx
  ON public.email_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_email_category_idx
  ON public.email_logs(email_category);

CREATE INDEX IF NOT EXISTS email_logs_provider_idx
  ON public.email_logs(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS email_logs_status_idx
  ON public.email_logs(status, created_at DESC);

DROP TRIGGER IF EXISTS update_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER update_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.email_campaign_logs
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retryable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_logs_dedupe_key_idx
  ON public.email_campaign_logs(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_campaign_logs_created_at_idx
  ON public.email_campaign_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS email_campaign_logs_status_idx
  ON public.email_campaign_logs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS email_campaign_logs_provider_idx
  ON public.email_campaign_logs(provider, created_at DESC);

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS segment_type text NOT NULL DEFAULT 'newsletter_subscribers',
  ADD COLUMN IF NOT EXISTS segment_filters jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS email_campaigns_segment_type_idx
  ON public.email_campaigns(segment_type);

UPDATE public.newsletter_subscribers
SET confirmed = true,
    confirmed_at = COALESCE(confirmed_at, subscribed_at, now()),
    is_active = true,
    confirmation_sent_at = COALESCE(confirmation_sent_at, now())
WHERE confirmed = false OR is_active = false;

CREATE OR REPLACE FUNCTION public.auto_confirm_newsletter_subscriber(_subscriber_id uuid)
RETURNS public.newsletter_subscribers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.newsletter_subscribers;
BEGIN
  UPDATE public.newsletter_subscribers
  SET confirmed = true,
      confirmed_at = COALESCE(confirmed_at, now()),
      is_active = true,
      confirmation_sent_at = COALESCE(confirmation_sent_at, now())
  WHERE id = _subscriber_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.auto_confirm_newsletter_subscriber(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_confirm_newsletter_subscriber(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_email_segment_recipients(_segment_type text, _filters jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE (
  recipient_email text,
  first_name text,
  source_table text,
  source_id uuid,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _segment_type = 'newsletter_subscribers' THEN
    RETURN QUERY
    SELECT ns.email, ns.first_name, 'newsletter_subscribers'::text, ns.id, jsonb_build_object('source', ns.source)
    FROM public.newsletter_subscribers ns
    WHERE ns.is_active = true AND ns.confirmed = true AND ns.unsubscribed_at IS NULL;

  ELSIF _segment_type = 'customers' THEN
    RETURN QUERY
    SELECT DISTINCT COALESCE(p.email, au.email)::text, p.first_name, 'orders'::text, o.id,
      jsonb_build_object('order_status', o.status, 'user_id', o.user_id)
    FROM public.orders o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    LEFT JOIN auth.users au ON au.id = o.user_id
    WHERE COALESCE(p.email, au.email) IS NOT NULL;

  ELSIF _segment_type = 'account_users' THEN
    RETURN QUERY
    SELECT COALESCE(p.email, au.email)::text, p.first_name, 'profiles'::text, p.id,
      jsonb_build_object('profile', true)
    FROM public.profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE COALESCE(p.email, au.email) IS NOT NULL;

  ELSIF _segment_type = 'internal_members' THEN
    RETURN QUERY
    SELECT COALESCE(p.email, au.email)::text, p.first_name, 'user_roles'::text, ur.id,
      jsonb_build_object('role', ur.role)
    FROM public.user_roles ur
    LEFT JOIN public.profiles p ON p.id = ur.user_id
    LEFT JOIN auth.users au ON au.id = ur.user_id
    WHERE ur.role IN ('admin', 'moderator') AND COALESCE(p.email, au.email) IS NOT NULL;

  ELSIF _segment_type = 'all_users' THEN
    RETURN QUERY
    SELECT email, first_name, source_table, source_id, metadata
    FROM (
      SELECT DISTINCT ON (recipient_email)
        recipient_email AS email,
        first_name,
        source_table,
        source_id,
        metadata
      FROM public.get_email_segment_recipients('newsletter_subscribers', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email)
        recipient_email AS email,
        first_name,
        source_table,
        source_id,
        metadata
      FROM public.get_email_segment_recipients('customers', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email)
        recipient_email AS email,
        first_name,
        source_table,
        source_id,
        metadata
      FROM public.get_email_segment_recipients('account_users', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email)
        recipient_email AS email,
        first_name,
        source_table,
        source_id,
        metadata
      FROM public.get_email_segment_recipients('internal_members', '{}'::jsonb)
    ) all_recipients
    WHERE email IS NOT NULL;

  ELSIF _segment_type = 'custom' THEN
    RETURN QUERY
    SELECT *
    FROM public.get_email_segment_recipients(COALESCE(NULLIF(_filters->>'base_segment', ''), 'newsletter_subscribers'), '{}'::jsonb)
    WHERE (
      COALESCE(_filters->>'email_domain', '') = ''
      OR split_part(recipient_email, '@', 2) = (_filters->>'email_domain')
    );

  ELSE
    RAISE EXCEPTION 'Unknown email segment type: %', _segment_type;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_segment_recipients(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_segment_recipients(text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_email_provider_daily_stats()
RETURNS TABLE (
  stat_date date,
  provider text,
  sent_count integer,
  failed_count integer,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT eps.stat_date, eps.provider, eps.sent_count, eps.failed_count, eps.updated_at
  FROM public.email_provider_daily_stats eps
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY eps.stat_date DESC, eps.provider ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_email_provider_daily_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_provider_daily_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.reserve_email_log(
  _dedupe_key text,
  _recipient_email text,
  _email_type text,
  _email_category text DEFAULT NULL,
  _order_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.email_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.email_logs;
BEGIN
  INSERT INTO public.email_logs (
    dedupe_key,
    recipient_email,
    email_type,
    email_category,
    order_id,
    metadata,
    status,
    attempt_count,
    created_at,
    updated_at,
    last_attempt_at
  )
  VALUES (
    _dedupe_key,
    _recipient_email,
    _email_type,
    _email_category,
    _order_id,
    COALESCE(_metadata, '{}'::jsonb),
    'queued',
    0,
    now(),
    now(),
    now()
  )
  ON CONFLICT (dedupe_key) WHERE _dedupe_key IS NOT NULL DO UPDATE
  SET updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_email_log(text, text, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_email_log(text, text, text, text, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.finalize_email_log(
  _log_id uuid,
  _provider text,
  _status text,
  _provider_message_id text DEFAULT NULL,
  _error_message text DEFAULT NULL,
  _retryable boolean DEFAULT false,
  _attempt_increment integer DEFAULT 1,
  _metadata_patch jsonb DEFAULT '{}'::jsonb
)
RETURNS public.email_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.email_logs;
BEGIN
  UPDATE public.email_logs
  SET provider = _provider,
      status = _status,
      provider_message_id = COALESCE(_provider_message_id, provider_message_id),
      error_message = _error_message,
      retryable = COALESCE(_retryable, false),
      attempt_count = COALESCE(attempt_count, 0) + GREATEST(COALESCE(_attempt_increment, 1), 0),
      metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(_metadata_patch, '{}'::jsonb),
      updated_at = now(),
      last_attempt_at = now(),
      sent_at = CASE WHEN _status = 'sent' THEN COALESCE(sent_at, now()) ELSE sent_at END,
      delivered_at = CASE WHEN _status = 'delivered' THEN COALESCE(delivered_at, now()) ELSE delivered_at END
  WHERE id = _log_id
  RETURNING * INTO v_row;

  INSERT INTO public.email_provider_daily_stats (stat_date, provider, sent_count, failed_count, updated_at)
  VALUES (
    CURRENT_DATE,
    _provider,
    CASE WHEN _status = 'sent' THEN 1 ELSE 0 END,
    CASE WHEN _status <> 'sent' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (stat_date, provider)
  DO UPDATE SET
    sent_count = public.email_provider_daily_stats.sent_count + CASE WHEN _status = 'sent' THEN 1 ELSE 0 END,
    failed_count = public.email_provider_daily_stats.failed_count + CASE WHEN _status <> 'sent' THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_email_log(uuid, text, text, text, text, boolean, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_email_log(uuid, text, text, text, text, boolean, integer, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.finalize_campaign_email_log(
  _campaign_id uuid,
  _recipient_email text,
  _dedupe_key text,
  _provider text,
  _status text,
  _provider_message_id text DEFAULT NULL,
  _error_message text DEFAULT NULL,
  _retryable boolean DEFAULT false,
  _attempt_count integer DEFAULT 1,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.email_campaign_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.email_campaign_logs;
BEGIN
  INSERT INTO public.email_campaign_logs (
    campaign_id,
    recipient_email,
    status,
    resend_id,
    error_message,
    provider,
    provider_message_id,
    attempt_count,
    retryable,
    dedupe_key,
    metadata,
    created_at,
    sent_at
  )
  VALUES (
    _campaign_id,
    _recipient_email,
    _status,
    _provider_message_id,
    _error_message,
    _provider,
    _provider_message_id,
    COALESCE(_attempt_count, 1),
    COALESCE(_retryable, false),
    _dedupe_key,
    COALESCE(_metadata, '{}'::jsonb),
    now(),
    now()
  )
  ON CONFLICT (dedupe_key) WHERE _dedupe_key IS NOT NULL DO UPDATE
  SET status = EXCLUDED.status,
      resend_id = EXCLUDED.resend_id,
      error_message = EXCLUDED.error_message,
      provider = EXCLUDED.provider,
      provider_message_id = EXCLUDED.provider_message_id,
      attempt_count = EXCLUDED.attempt_count,
      retryable = EXCLUDED.retryable,
      metadata = COALESCE(public.email_campaign_logs.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
      sent_at = now()
  RETURNING * INTO v_row;

  INSERT INTO public.email_provider_daily_stats (stat_date, provider, sent_count, failed_count, updated_at)
  VALUES (
    CURRENT_DATE,
    _provider,
    CASE WHEN _status = 'sent' THEN 1 ELSE 0 END,
    CASE WHEN _status <> 'sent' THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (stat_date, provider)
  DO UPDATE SET
    sent_count = public.email_provider_daily_stats.sent_count + CASE WHEN _status = 'sent' THEN 1 ELSE 0 END,
    failed_count = public.email_provider_daily_stats.failed_count + CASE WHEN _status <> 'sent' THEN 1 ELSE 0 END,
    updated_at = now();

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_campaign_email_log(uuid, text, text, text, text, text, text, boolean, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_campaign_email_log(uuid, text, text, text, text, text, text, boolean, integer, jsonb) TO authenticated;