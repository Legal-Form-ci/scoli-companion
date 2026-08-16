-- Fix: 'asc' is a reserved keyword, use different alias

CREATE OR REPLACE FUNCTION public.get_share_stats(
  _start_date timestamptz DEFAULT NULL,
  _end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  article_id uuid,
  title_fr text,
  facebook bigint,
  whatsapp bigint,
  twitter bigint,
  linkedin bigint,
  telegram bigint,
  total bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    sc.article_id,
    a.title_fr,
    sc.facebook::bigint,
    sc.whatsapp::bigint,
    sc.twitter::bigint,
    sc.linkedin::bigint,
    sc.telegram::bigint,
    sc.total::bigint
  FROM public.article_share_counts sc
  LEFT JOIN public.articles a ON a.id = sc.article_id
  WHERE sc.total > 0
  ORDER BY sc.total DESC
  LIMIT 50;
END;
$$;

-- RPC to get analytics summary for admin dashboard
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  _start_date timestamptz DEFAULT (now() - interval '30 days'),
  _end_date timestamptz DEFAULT now()
)
RETURNS TABLE(
  event_type text,
  event_count bigint,
  unique_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    ae.event_type,
    COUNT(*)::bigint as event_count,
    COUNT(DISTINCT ae.user_id)::bigint as unique_users
  FROM public.analytics_events ae
  WHERE ae.created_at >= _start_date AND ae.created_at <= _end_date
  GROUP BY ae.event_type
  ORDER BY event_count DESC;
END;
$$;