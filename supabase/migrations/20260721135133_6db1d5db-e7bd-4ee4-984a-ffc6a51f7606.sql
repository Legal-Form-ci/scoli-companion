
-- 1) schools: hide email/phone/address from anon/authenticated broad SELECT
REVOKE SELECT (email, phone, address) ON public.schools FROM anon, authenticated;
-- Admins/owners still access via get_school_contact() or their ALL policies (service_role/definer paths).

-- 2) get_email_segment_recipients: require admin
CREATE OR REPLACE FUNCTION public.get_email_segment_recipients(_segment_type text, _filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(recipient_email text, first_name text, source_table text, source_id uuid, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

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
    SELECT email, first_name, source_table, source_id, metadata FROM (
      SELECT DISTINCT ON (recipient_email) recipient_email AS email, first_name, source_table, source_id, metadata
      FROM public.get_email_segment_recipients('newsletter_subscribers', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email) recipient_email AS email, first_name, source_table, source_id, metadata
      FROM public.get_email_segment_recipients('customers', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email) recipient_email AS email, first_name, source_table, source_id, metadata
      FROM public.get_email_segment_recipients('account_users', '{}'::jsonb)
      UNION ALL
      SELECT DISTINCT ON (recipient_email) recipient_email AS email, first_name, source_table, source_id, metadata
      FROM public.get_email_segment_recipients('internal_members', '{}'::jsonb)
    ) all_recipients WHERE email IS NOT NULL;
  ELSIF _segment_type = 'custom' THEN
    RETURN QUERY
    SELECT * FROM public.get_email_segment_recipients(COALESCE(NULLIF(_filters->>'base_segment', ''), 'newsletter_subscribers'), '{}'::jsonb)
    WHERE (COALESCE(_filters->>'email_domain', '') = '' OR split_part(recipient_email, '@', 2) = (_filters->>'email_domain'));
  ELSE
    RAISE EXCEPTION 'Unknown email segment type: %', _segment_type;
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_email_segment_recipients(text, jsonb) FROM PUBLIC, anon;

-- 3) get_referral_balance: caller must be owner or admin
CREATE OR REPLACE FUNCTION public.get_referral_balance(_user_id uuid)
 RETURNS TABLE(total_earned numeric, total_withdrawn numeric, available numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_earned NUMERIC;
  v_withdrawn NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(SUM(commission_amount), 0) INTO v_earned
  FROM public.commissions WHERE user_id = _user_id AND status = 'paid';

  SELECT COALESCE(SUM(amount), 0) INTO v_withdrawn
  FROM public.withdrawal_requests WHERE user_id = _user_id AND status IN ('paid','processing','validated');

  RETURN QUERY SELECT v_earned, v_withdrawn, GREATEST(v_earned - v_withdrawn, 0);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_referral_balance(uuid) FROM PUBLIC, anon;

-- 4) get_delivery_stats: only self or admin
CREATE OR REPLACE FUNCTION public.get_delivery_stats(_delivery_user_id uuid)
 RETURNS TABLE(total_assigned bigint, pending_pickup bigint, in_transit bigint, delivered bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _delivery_user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE delivery_received_at IS NOT NULL AND customer_confirmed_at IS NULL)::BIGINT,
    COUNT(*) FILTER (WHERE customer_confirmed_at IS NOT NULL)::BIGINT
  FROM public.orders
  WHERE delivery_user_id = _delivery_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_delivery_stats(uuid) FROM PUBLIC, anon;

-- 5) Admin-only email tooling: add role check + revoke from public/anon
CREATE OR REPLACE FUNCTION public.get_failed_emails_for_retry(_limit integer DEFAULT 50)
 RETURNS TABLE(source text, log_id uuid, campaign_id uuid, recipient_email text, email_type text, email_category text, attempt_count integer, metadata jsonb, dedupe_key text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  RETURN QUERY
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
END;
$function$;

CREATE OR REPLACE FUNCTION public.schedule_email_retry(_source text, _log_id uuid, _attempt integer, _error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_delay interval;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  v_delay := (CASE LEAST(_attempt,5) WHEN 1 THEN '1 minute' WHEN 2 THEN '5 minutes'
                WHEN 3 THEN '15 minutes' WHEN 4 THEN '1 hour' ELSE '4 hours' END)::interval;
  IF _source='transactional' THEN
    UPDATE public.email_logs SET next_retry_at = now()+v_delay,
       last_error_code = COALESCE(_error,last_error_code), updated_at = now() WHERE id = _log_id;
  ELSIF _source='campaign' THEN
    UPDATE public.email_campaign_logs SET next_retry_at = now()+v_delay,
       last_error_code = COALESCE(_error,last_error_code) WHERE id = _log_id;
  END IF;
END; $function$;

CREATE OR REPLACE FUNCTION public.update_campaign_event_counts(_provider_message_id text, _event text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_campaign uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
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
END; $function$;

REVOKE EXECUTE ON FUNCTION public.get_failed_emails_for_retry(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_email_retry(text, uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_campaign_event_counts(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_campaign_analytics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_provider_quota_status() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_failed_emails_for_retry(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_email_retry(text, uuid, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_campaign_event_counts(text, text) TO service_role;
