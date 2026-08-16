-- Fix security definer view issue by recreating it without security definer
DROP VIEW IF EXISTS public.admin_stats;

-- Create as a regular function instead that checks for admin role
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_products BIGINT,
  total_orders BIGINT,
  total_users BIGINT,
  total_revenue NUMERIC,
  monthly_revenue NUMERIC,
  pending_orders BIGINT,
  total_articles BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.products WHERE is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM public.orders)::BIGINT,
    (SELECT COUNT(*) FROM public.profiles)::BIGINT,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered'),
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM public.articles WHERE status = 'published')::BIGINT;
END;
$$;