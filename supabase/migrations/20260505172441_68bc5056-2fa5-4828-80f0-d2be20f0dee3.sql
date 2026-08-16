-- Revoke EXECUTE from anon and authenticated on internal SECURITY DEFINER helpers
-- These should only be invoked by the database (triggers, other functions) or service_role.

REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_sessions() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_view_tracking() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_password_strength(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_admin_action() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_article_published() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_payment_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_order_on_payment() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_order_item_price() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_article_views(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_product_views(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_blocked_session(uuid) FROM anon;
