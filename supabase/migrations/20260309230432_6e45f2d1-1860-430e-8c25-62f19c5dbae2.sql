
-- ============================================================
-- MIGRATION: Make all RESTRICTIVE policies PERMISSIVE + add missing tables
-- ============================================================

-- Drop and recreate ALL restrictive policies as PERMISSIVE

-- ===== advertisements =====
DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisements;
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON public.advertisements;
CREATE POLICY "Admins can manage advertisements" ON public.advertisements FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active advertisements" ON public.advertisements FOR SELECT TO public USING ((is_active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at >= now())));

-- ===== article_comments =====
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.article_comments;
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.article_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.article_comments;
DROP POLICY IF EXISTS "Users can manage their comments" ON public.article_comments;
CREATE POLICY "Admins can manage all comments" ON public.article_comments FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view approved comments" ON public.article_comments FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Users can create comments" ON public.article_comments FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their comments" ON public.article_comments FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== article_likes =====
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.article_likes;
DROP POLICY IF EXISTS "Users can manage their likes" ON public.article_likes;
CREATE POLICY "Authenticated can view likes" ON public.article_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their likes" ON public.article_likes FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== article_purchases =====
DROP POLICY IF EXISTS "Admins can manage all article purchases" ON public.article_purchases;
DROP POLICY IF EXISTS "Users can create article purchases" ON public.article_purchases;
DROP POLICY IF EXISTS "Users can view their article purchases" ON public.article_purchases;
CREATE POLICY "Admins can manage all article purchases" ON public.article_purchases FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create article purchases" ON public.article_purchases FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their article purchases" ON public.article_purchases FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== article_reactions =====
DROP POLICY IF EXISTS "Authenticated can view reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Users can manage their reactions" ON public.article_reactions;
CREATE POLICY "Authenticated can view reactions" ON public.article_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their reactions" ON public.article_reactions FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== article_share_counts =====
DROP POLICY IF EXISTS "Article share counts are viewable by everyone" ON public.article_share_counts;
CREATE POLICY "Article share counts are viewable by everyone" ON public.article_share_counts FOR SELECT TO public USING (true);

-- ===== articles =====
DROP POLICY IF EXISTS "Admins can manage all articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Authors can manage their articles" ON public.articles;
DROP POLICY IF EXISTS "Moderators can manage articles" ON public.articles;
CREATE POLICY "Admins can manage all articles" ON public.articles FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT TO public USING (status = 'published'::text);
CREATE POLICY "Authors can manage their articles" ON public.articles FOR ALL TO public USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Moderators can manage articles" ON public.articles FOR ALL TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role)) WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

-- ===== audit_logs =====
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== campaigns =====
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===== cart_items =====
DROP POLICY IF EXISTS "Anon cannot access cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.cart_items;
CREATE POLICY "Anon cannot access cart items" ON public.cart_items FOR SELECT TO anon USING (false);
CREATE POLICY "Users can manage their cart" ON public.cart_items FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== categories =====
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO public USING (true);

-- ===== commissions =====
DROP POLICY IF EXISTS "Admins can manage all commissions" ON public.commissions;
DROP POLICY IF EXISTS "Vendors can only view their commissions" ON public.commissions;
CREATE POLICY "Admins can manage all commissions" ON public.commissions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Vendors can only view their commissions" ON public.commissions FOR SELECT TO authenticated USING (auth.uid() = vendor_id);

-- ===== coupon_redemptions =====
DROP POLICY IF EXISTS "Admins can view all coupon redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Users can create their coupon redemptions" ON public.coupon_redemptions;
DROP POLICY IF EXISTS "Users can view their coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Admins can view all coupon redemptions" ON public.coupon_redemptions FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their coupon redemptions" ON public.coupon_redemptions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their coupon redemptions" ON public.coupon_redemptions FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== coupons =====
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT TO public USING (is_active = true);

-- ===== delivery_proofs =====
DROP POLICY IF EXISTS "Admins can manage all proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Anon cannot access delivery proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Anon cannot insert delivery proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Delivery users can create proofs" ON public.delivery_proofs;
DROP POLICY IF EXISTS "Delivery users can view very recent proofs" ON public.delivery_proofs;
CREATE POLICY "Admins can manage all proofs" ON public.delivery_proofs FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access delivery proofs" ON public.delivery_proofs FOR SELECT TO anon USING (false);
CREATE POLICY "Anon cannot insert delivery proofs" ON public.delivery_proofs FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Delivery users can create proofs" ON public.delivery_proofs FOR INSERT TO authenticated WITH CHECK (auth.uid() = delivery_user_id);
CREATE POLICY "Delivery users can view very recent proofs" ON public.delivery_proofs FOR SELECT TO authenticated USING ((auth.uid() = delivery_user_id) AND (created_at > (now() - '7 days'::interval)));

-- ===== educational_content =====
DROP POLICY IF EXISTS "Admins can manage all content" ON public.educational_content;
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.educational_content;
DROP POLICY IF EXISTS "Authors can manage their content" ON public.educational_content;
CREATE POLICY "Admins can manage all content" ON public.educational_content FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view approved content" ON public.educational_content FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "Authors can manage their content" ON public.educational_content FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- ===== email_logs =====
DROP POLICY IF EXISTS "Admins can view email logs" ON public.email_logs;
DROP POLICY IF EXISTS "No direct insert email logs" ON public.email_logs;
CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "No direct insert email logs" ON public.email_logs FOR INSERT TO public WITH CHECK (false);

-- ===== faq =====
DROP POLICY IF EXISTS "Admins can manage FAQ" ON public.faq;
DROP POLICY IF EXISTS "Anyone can view active FAQ" ON public.faq;
CREATE POLICY "Admins can manage FAQ" ON public.faq FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active FAQ" ON public.faq FOR SELECT TO public USING (is_active = true);

-- ===== internal_messages =====
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Anon cannot access internal messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.internal_messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.internal_messages;
CREATE POLICY "Admins can manage all messages" ON public.internal_messages FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access internal messages" ON public.internal_messages FOR SELECT TO anon USING (false);
CREATE POLICY "Users can send messages" ON public.internal_messages FOR INSERT TO public WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their own messages" ON public.internal_messages FOR UPDATE TO public USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
CREATE POLICY "Users can view their messages" ON public.internal_messages FOR SELECT TO public USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- ===== login_sessions =====
DROP POLICY IF EXISTS "Anon cannot access login sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert login sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Users can confirm their login sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Users can view their login sessions" ON public.login_sessions;
CREATE POLICY "Anon cannot access login sessions" ON public.login_sessions FOR SELECT TO anon USING (false);
CREATE POLICY "Authenticated users can insert login sessions" ON public.login_sessions FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can confirm their login sessions" ON public.login_sessions FOR UPDATE TO authenticated USING ((auth.uid() = user_id) AND (is_blocked = false)) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their login sessions" ON public.login_sessions FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== loyalty_rewards =====
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Anon cannot access loyalty rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Users can redeem rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Users can use their rewards" ON public.loyalty_rewards;
DROP POLICY IF EXISTS "Users can view their rewards" ON public.loyalty_rewards;
CREATE POLICY "Admins can manage all rewards" ON public.loyalty_rewards FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access loyalty rewards" ON public.loyalty_rewards FOR SELECT TO anon USING (false);
CREATE POLICY "Users can redeem rewards" ON public.loyalty_rewards FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can use their rewards" ON public.loyalty_rewards FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can view their rewards" ON public.loyalty_rewards FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== moderator_notes =====
DROP POLICY IF EXISTS "Moderators can manage notes" ON public.moderator_notes;
DROP POLICY IF EXISTS "Vendors can view notes on their products" ON public.moderator_notes;
CREATE POLICY "Moderators can manage notes" ON public.moderator_notes FOR ALL TO public USING (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Vendors can view notes on their products" ON public.moderator_notes FOR SELECT TO public USING ((entity_type = 'product'::text) AND EXISTS (SELECT 1 FROM products WHERE products.id = moderator_notes.entity_id AND products.vendor_id = auth.uid()));

-- ===== notifications =====
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anon cannot access notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access notifications" ON public.notifications FOR SELECT TO anon USING (false);
CREATE POLICY "Users can create their notifications" ON public.notifications FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== order_items =====
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT TO public USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ===== orders =====
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Anon cannot access orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can confirm their orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery users can update recent delivery status" ON public.orders;
DROP POLICY IF EXISTS "Delivery users can view recent assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Moderators can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access orders" ON public.orders FOR SELECT TO anon USING (false);
CREATE POLICY "Customers can confirm their orders" ON public.orders FOR UPDATE TO public USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delivery users can update recent delivery status" ON public.orders FOR UPDATE TO authenticated USING ((delivery_user_id = auth.uid()) AND (created_at > (now() - '60 days'::interval))) WITH CHECK ((delivery_user_id = auth.uid()) AND (created_at > (now() - '60 days'::interval)));
CREATE POLICY "Delivery users can view recent assigned orders" ON public.orders FOR SELECT TO authenticated USING (((delivery_user_id = auth.uid()) AND (created_at > (now() - '60 days'::interval))) OR (user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Moderators can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their orders" ON public.orders FOR SELECT TO public USING (auth.uid() = user_id);

-- ===== payments =====
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Anon cannot access payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view recent payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access payments" ON public.payments FOR SELECT TO anon USING (false);
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view recent payments" ON public.payments FOR SELECT TO authenticated USING ((auth.uid() = user_id) AND (created_at > (now() - '365 days'::interval)));

-- ===== platform_settings =====
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Only admins can view platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can view platform settings" ON public.platform_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- ===== products =====
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their products" ON public.products;
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Vendors can manage their products" ON public.products FOR ALL TO public USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);

-- ===== profiles =====
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon cannot access profiles" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access profiles" ON public.profiles FOR SELECT TO anon USING (false);
CREATE POLICY "Moderators can view profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'moderator'::app_role));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = id);

-- ===== promotions =====
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
DROP POLICY IF EXISTS "Authenticated can view active promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view active promotions" ON public.promotions FOR SELECT TO authenticated USING ((is_active = true) AND ((end_date IS NULL) OR (end_date > now())));

-- ===== push_subscriptions =====
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anon cannot access push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage their subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.push_subscriptions FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anon cannot access push subscriptions" ON public.push_subscriptions FOR SELECT TO anon USING (false);
CREATE POLICY "Users can manage their subscriptions" ON public.push_subscriptions FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== rate_limits =====
DROP POLICY IF EXISTS "No direct access" ON public.rate_limits;
CREATE POLICY "No direct access" ON public.rate_limits FOR ALL TO public USING (false) WITH CHECK (false);

-- ===== referral_rewards =====
DROP POLICY IF EXISTS "Admins can manage all rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS "Users can claim their rewards" ON public.referral_rewards;
CREATE POLICY "Admins can manage all referral rewards" ON public.referral_rewards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can claim their rewards" ON public.referral_rewards FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view their referral rewards" ON public.referral_rewards FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ===== referrals =====
-- Add policies for referrals table if missing
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'referrals' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
    DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
    DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
    
    CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());
    CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
    CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ===== reviews =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can manage their reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
    
    CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT TO public USING (true);
    CREATE POLICY "Users can manage their reviews" ON public.reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Admins can manage all reviews" ON public.reviews FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ===== resources =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'resources' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Anyone can view free resources" ON public.resources;
    DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
    DROP POLICY IF EXISTS "Authors can manage their resources" ON public.resources;
    
    CREATE POLICY "Anyone can view free resources" ON public.resources FOR SELECT TO public USING (is_free = true);
    CREATE POLICY "Admins can manage resources" ON public.resources FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
    CREATE POLICY "Authors can manage their resources" ON public.resources FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
    CREATE POLICY "Authenticated can view all resources" ON public.resources FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ===== Create missing triggers =====
-- Trigger for order status notifications
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Trigger for payment status notifications
DROP TRIGGER IF EXISTS on_payment_status_change ON public.payments;
CREATE TRIGGER on_payment_status_change
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_status_change();

-- Trigger for article published notifications
DROP TRIGGER IF EXISTS on_article_published ON public.articles;
CREATE TRIGGER on_article_published
  AFTER UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION notify_article_published();

-- Trigger for new user welcome
DROP TRIGGER IF EXISTS on_new_profile ON public.profiles;
CREATE TRIGGER on_new_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- Trigger for order item price validation
DROP TRIGGER IF EXISTS validate_order_item_price_trigger ON public.order_items;
CREATE TRIGGER validate_order_item_price_trigger
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_item_price();

-- Trigger for updated_at on orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on payments  
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;

-- Trigger for admin audit on products
DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION audit_admin_action();

-- Trigger for admin audit on orders
DROP TRIGGER IF EXISTS audit_orders ON public.orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION audit_admin_action();

-- ===== Add wishlist table if not exists =====
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage their wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== Add view_tracking unique constraint if missing =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'view_tracking_unique_session') THEN
    BEGIN
      ALTER TABLE public.view_tracking ADD CONSTRAINT view_tracking_unique_session UNIQUE (entity_type, entity_id, session_fingerprint);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;

-- ===== Add schools table policies if missing =====
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schools' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Anyone can view approved schools" ON public.schools;
    DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
    
    CREATE POLICY "Anyone can view approved schools" ON public.schools FOR SELECT TO public USING (true);
    CREATE POLICY "Admins can manage schools" ON public.schools FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ===== Function: auto-update order status when payment completes =====
CREATE OR REPLACE FUNCTION public.auto_confirm_order_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.order_id IS NOT NULL THEN
    UPDATE public.orders
    SET status = 'confirmed', payment_reference = NEW.transaction_id, payment_method = NEW.payment_method
    WHERE id = NEW.order_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_order_on_payment ON public.payments;
CREATE TRIGGER auto_confirm_order_on_payment
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_order_on_payment();

-- ===== Function: decrement stock on order confirmation =====
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    UPDATE public.products p
    SET stock = GREATEST(0, COALESCE(p.stock, 0) - oi.quantity)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decrement_stock_on_order ON public.orders;
CREATE TRIGGER decrement_stock_on_order
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order();
