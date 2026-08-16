
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS from_email text,
  ADD COLUMN IF NOT EXISTS delivered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounced_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complained_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_code text;

ALTER TABLE public.email_campaign_logs
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_code text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS complained_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_email_logs_retry
  ON public.email_logs (next_retry_at) WHERE status = 'failed' AND retryable = true;
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_retry
  ON public.email_campaign_logs (next_retry_at) WHERE status = 'failed' AND retryable = true;
CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id
  ON public.email_logs (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_campaign_logs_provider_message_id
  ON public.email_campaign_logs (provider_message_id);

CREATE OR REPLACE FUNCTION public.get_failed_emails_for_retry(_limit integer DEFAULT 50)
RETURNS TABLE (source text, log_id uuid, campaign_id uuid, recipient_email text,
  email_type text, email_category text, attempt_count integer, metadata jsonb, dedupe_key text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  (SELECT 'transactional'::text, el.id, NULL::uuid, el.recipient_email,
          el.email_type, el.email_category, COALESCE(el.attempt_count,0), el.metadata, el.dedupe_key
     FROM public.email_logs el
    WHERE el.status='failed' AND COALESCE(el.retryable,false)=true
      AND COALESCE(el.attempt_count,0) < 5
      AND (el.next_retry_at IS NULL OR el.next_retry_at <= now())
    ORDER BY el.last_attempt_at ASC NULLS FIRST LIMIT _limit)
  UNION ALL
  (SELECT 'campaign'::text, cl.id, cl.campaign_id, cl.recipient_email,
          'campaign'::text, NULL::text, COALESCE(cl.attempt_count,0), cl.metadata, cl.dedupe_key
     FROM public.email_campaign_logs cl
    WHERE cl.status='failed' AND COALESCE(cl.retryable,false)=true
      AND COALESCE(cl.attempt_count,0) < 5
      AND (cl.next_retry_at IS NULL OR cl.next_retry_at <= now())
    ORDER BY cl.sent_at ASC NULLS FIRST LIMIT _limit);
$$;

CREATE OR REPLACE FUNCTION public.schedule_email_retry(_source text, _log_id uuid, _attempt integer, _error text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_delay interval;
BEGIN
  v_delay := (CASE LEAST(_attempt,5) WHEN 1 THEN '1 minute' WHEN 2 THEN '5 minutes'
                WHEN 3 THEN '15 minutes' WHEN 4 THEN '1 hour' ELSE '4 hours' END)::interval;
  IF _source='transactional' THEN
    UPDATE public.email_logs SET next_retry_at = now()+v_delay,
       last_error_code = COALESCE(_error,last_error_code), updated_at = now() WHERE id = _log_id;
  ELSIF _source='campaign' THEN
    UPDATE public.email_campaign_logs SET next_retry_at = now()+v_delay,
       last_error_code = COALESCE(_error,last_error_code) WHERE id = _log_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.update_campaign_event_counts(_provider_message_id text, _event text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_campaign uuid;
BEGIN
  SELECT campaign_id INTO v_campaign FROM public.email_campaign_logs
   WHERE provider_message_id = _provider_message_id LIMIT 1;
  IF v_campaign IS NULL THEN RETURN; END IF;
  IF _event='delivered' THEN
    UPDATE public.email_campaigns SET delivered_count=delivered_count+1, updated_at=now() WHERE id=v_campaign;
    UPDATE public.email_campaign_logs SET delivered_at=COALESCE(delivered_at,now()),
       status=CASE WHEN status='failed' THEN status ELSE 'delivered' END
     WHERE provider_message_id=_provider_message_id;
  ELSIF _event='opened' THEN
    UPDATE public.email_campaigns SET opened_count=opened_count+1, updated_at=now() WHERE id=v_campaign;
    UPDATE public.email_campaign_logs SET opened_at=COALESCE(opened_at,now()) WHERE provider_message_id=_provider_message_id;
  ELSIF _event='clicked' THEN
    UPDATE public.email_campaigns SET clicked_count=clicked_count+1, updated_at=now() WHERE id=v_campaign;
    UPDATE public.email_campaign_logs SET clicked_at=COALESCE(clicked_at,now()) WHERE provider_message_id=_provider_message_id;
  ELSIF _event='bounced' THEN
    UPDATE public.email_campaigns SET bounced_count=bounced_count+1, updated_at=now() WHERE id=v_campaign;
    UPDATE public.email_campaign_logs SET bounced_at=COALESCE(bounced_at,now()), status='bounced' WHERE provider_message_id=_provider_message_id;
  ELSIF _event='complained' THEN
    UPDATE public.email_campaigns SET complained_count=complained_count+1, updated_at=now() WHERE id=v_campaign;
    UPDATE public.email_campaign_logs SET complained_at=COALESCE(complained_at,now()) WHERE provider_message_id=_provider_message_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.get_campaign_analytics()
RETURNS TABLE (campaign_id uuid, name text, subject text, status text, sent_at timestamptz,
  recipients_count integer, sent_count integer, failed_count integer,
  delivered_count integer, opened_count integer, clicked_count integer,
  bounced_count integer, complained_count integer,
  bounce_rate numeric, open_rate numeric, click_rate numeric, delivery_rate numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.subject, c.status, c.sent_at,
         c.recipients_count, c.sent_count, c.failed_count,
         c.delivered_count, c.opened_count, c.clicked_count,
         c.bounced_count, c.complained_count,
         CASE WHEN c.sent_count>0 THEN ROUND(100.0*c.bounced_count/c.sent_count,2) ELSE 0 END,
         CASE WHEN c.delivered_count>0 THEN ROUND(100.0*c.opened_count/c.delivered_count,2) ELSE 0 END,
         CASE WHEN c.opened_count>0 THEN ROUND(100.0*c.clicked_count/c.opened_count,2) ELSE 0 END,
         CASE WHEN c.sent_count>0 THEN ROUND(100.0*c.delivered_count/c.sent_count,2) ELSE 0 END
    FROM public.email_campaigns c
   WHERE public.has_role(auth.uid(),'admin'::app_role)
   ORDER BY c.created_at DESC;
$$;
