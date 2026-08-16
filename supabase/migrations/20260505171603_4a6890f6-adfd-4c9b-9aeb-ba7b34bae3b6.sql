
ALTER VIEW public.schools_public SET (security_invoker = true);

-- Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_sessions() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_view_tracking() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_password_strength(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_admin_action() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_article_published() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_payment_status_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_order_on_payment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_order_item_price() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_share_stats(timestamptz, timestamptz) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_delivery_stats(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_delivery_orders(uuid) FROM anon, public;
