
CREATE OR REPLACE FUNCTION public.increment_email_provider_stat(_provider text, _success boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_provider_daily_stats (stat_date, provider, sent_count, failed_count, updated_at)
  VALUES (CURRENT_DATE, _provider, CASE WHEN _success THEN 1 ELSE 0 END, CASE WHEN _success THEN 0 ELSE 1 END, now())
  ON CONFLICT (stat_date, provider) DO UPDATE
    SET sent_count   = public.email_provider_daily_stats.sent_count   + CASE WHEN _success THEN 1 ELSE 0 END,
        failed_count = public.email_provider_daily_stats.failed_count + CASE WHEN _success THEN 0 ELSE 1 END,
        updated_at = now();
END $$;

-- Ensure unique key for upsert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_provider_daily_stats_pkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'email_provider_daily_stats_unique'
  ) THEN
    CREATE UNIQUE INDEX email_provider_daily_stats_unique ON public.email_provider_daily_stats(stat_date, provider);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_provider_quota_status()
RETURNS TABLE(provider text, daily_limit int, sent_today int, failed_today int, remaining int, usage_pct numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH limits(provider, daily_limit) AS (
    VALUES ('brevo'::text, 300), ('resend'::text, 100)
  ),
  today AS (
    SELECT provider, sent_count, failed_count
    FROM public.email_provider_daily_stats
    WHERE stat_date = CURRENT_DATE
  )
  SELECT l.provider, l.daily_limit,
         COALESCE(t.sent_count, 0) AS sent_today,
         COALESCE(t.failed_count, 0) AS failed_today,
         GREATEST(l.daily_limit - COALESCE(t.sent_count, 0), 0) AS remaining,
         ROUND(LEAST(COALESCE(t.sent_count, 0)::numeric / l.daily_limit * 100, 100), 1) AS usage_pct
  FROM limits l
  LEFT JOIN today t ON t.provider = l.provider;
$$;
