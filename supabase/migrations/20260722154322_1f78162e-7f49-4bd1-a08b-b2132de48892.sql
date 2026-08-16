
-- Revoke EXECUTE from PUBLIC/anon/authenticated on all SECURITY DEFINER functions,
-- then grant EXECUTE only on RPCs actually called from the client.

-- Trigger + internal-only functions: revoke from all API roles
REVOKE EXECUTE ON FUNCTION public.notify_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_order_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_article_published() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_item_price() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_payment_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_admin_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_commercial() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_article_publish_moderation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_article_premium_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_order_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_order_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_educational_content_file() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_sessions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_view_tracking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_campaign_event_counts(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_email_provider_stat(text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_email_log(text, text, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_email_log(uuid, text, text, text, text, boolean, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.finalize_campaign_email_log(uuid, text, text, text, text, text, text, boolean, integer, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_email_retry(text, uuid, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.pick_available_commercial(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_password_strength(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_share_stats(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_email_provider_daily_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_delivery_orders(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_referral_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_school_contact(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_resource_file_url(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_article_content(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_article_premium_content(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_blocked_session(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delivery_mark_picked_up(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delivery_submit_handoff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_product_views(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_article_views(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_article_share(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_loyalty_points(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_loyalty_points() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.confirm_newsletter_subscription(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unsubscribe_newsletter(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_confirm_newsletter_subscriber(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_runtime_settings() FROM PUBLIC, anon, authenticated;

-- Re-grant EXECUTE only to the roles that must call each RPC from the client
-- Public (unauthenticated) callable RPCs
GRANT EXECUTE ON FUNCTION public.increment_product_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_article_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_runtime_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter_subscription(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_article_content(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resource_file_url(uuid) TO anon, authenticated;

-- Authenticated-only RPCs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_article_share(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_loyalty_points(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loyalty_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_share_stats(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_provider_daily_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_orders(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_school_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_article_premium_content(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_blocked_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_mark_picked_up(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delivery_submit_handoff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_email_retry(text, uuid, integer, text) TO authenticated;
