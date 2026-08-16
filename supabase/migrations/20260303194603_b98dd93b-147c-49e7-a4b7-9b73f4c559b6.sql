
-- ============================================================
-- SCRIPT 1: SÉCURITÉ COMPLÈTE + TRIGGERS MANQUANTS
-- ============================================================

-- =============================================
-- 1. TRIGGERS MANQUANTS (fonctions existent mais pas de triggers)
-- =============================================

-- Trigger: nouveau utilisateur -> profil + rôle
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: notification bienvenue
CREATE OR REPLACE TRIGGER on_profile_created_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_user();

-- Trigger: article publié -> notification auteur
CREATE OR REPLACE TRIGGER on_article_published
  AFTER UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.notify_article_published();

-- Trigger: changement statut commande -> notification client
CREATE OR REPLACE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- Trigger: changement statut paiement -> notification
CREATE OR REPLACE TRIGGER on_payment_status_change
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_status_change();

-- Triggers updated_at automatiques
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_moderator_notes_updated_at
  BEFORE UPDATE ON public.moderator_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_educational_content_updated_at
  BEFORE UPDATE ON public.educational_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_internal_messages_updated_at
  BEFORE UPDATE ON public.internal_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. SÉCURITÉ: Moderators SELECT access manquant
-- =============================================

-- Moderateurs peuvent voir les commandes pour support
CREATE POLICY "Moderators can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderateurs peuvent voir les profils pour support
CREATE POLICY "Moderators can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- Moderateurs peuvent gérer les articles (modération)
CREATE POLICY "Moderators can manage articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));

-- =============================================
-- 3. SÉCURITÉ: Fonction anti-brute-force renforcée
-- =============================================

CREATE OR REPLACE FUNCTION public.check_password_strength(_password text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Min 8 chars, 1 uppercase, 1 lowercase, 1 digit
  RETURN length(_password) >= 8
    AND _password ~ '[A-Z]'
    AND _password ~ '[a-z]'
    AND _password ~ '[0-9]';
END;
$$;

-- =============================================
-- 4. SÉCURITÉ: Nettoyage automatique données expirées
-- =============================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Nettoyer les sessions de login > 30 jours
  DELETE FROM public.login_sessions WHERE created_at < now() - interval '30 days';
  -- Nettoyer le tracking des vues > 24h
  DELETE FROM public.view_tracking WHERE viewed_at < now() - interval '24 hours';
  -- Nettoyer les rate limits expirés > 1 jour
  DELETE FROM public.rate_limits WHERE last_attempt_at < now() - interval '1 day' AND (blocked_until IS NULL OR blocked_until < now());
  -- Nettoyer les notifications lues > 90 jours
  DELETE FROM public.notifications WHERE is_read = true AND created_at < now() - interval '90 days';
$$;

-- =============================================
-- 5. SÉCURITÉ: Audit automatique des actions admin
-- =============================================

CREATE OR REPLACE FUNCTION public.audit_admin_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Audit sur les tables critiques
CREATE OR REPLACE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

CREATE OR REPLACE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

CREATE OR REPLACE TRIGGER audit_payments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

-- =============================================
-- 6. PERFORMANCE: Index complets pour lectures instantanées
-- =============================================

-- Products: recherche, filtrage, tri
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_vendor ON public.products (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured) WHERE is_featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products (created_at DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_name_fr ON public.products USING gin (to_tsvector('french', name_fr));
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products (product_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_level ON public.products (education_level) WHERE is_active = true;

-- Orders: suivi rapide
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON public.orders (delivery_user_id) WHERE delivery_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at DESC);

-- Articles: blog performant
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles (published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles (author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles (category) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles (status);

-- Notifications: lecture instantanée
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications (type, user_id);

-- Payments: historique rapide
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- Login sessions: sécurité
CREATE INDEX IF NOT EXISTS idx_login_sessions_user ON public.login_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_sessions_blocked ON public.login_sessions (is_blocked) WHERE is_blocked = true;

-- Rate limits: performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits (identifier, action_type);

-- Audit logs: consultation admin
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- Order items: jointures rapides
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);

-- Cart items: panier instantané
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON public.cart_items (user_id);

-- Reviews: affichage produit
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews (product_id);

-- Commissions: dashboard vendeur
CREATE INDEX IF NOT EXISTS idx_commissions_vendor ON public.commissions (vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON public.commissions (order_id);

-- Referrals: programme parrainage
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals (referral_code);

-- Categories: navigation
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- Coupons: validation rapide
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code) WHERE is_active = true;

-- Internal messages: messagerie
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.internal_messages (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.internal_messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.internal_messages (recipient_id) WHERE is_read = false;

-- Article interactions
CREATE INDEX IF NOT EXISTS idx_article_likes_article ON public.article_likes (article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_article ON public.article_comments (article_id) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON public.article_reactions (article_id);

-- Profiles: recherche admin
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Delivery proofs
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_order ON public.delivery_proofs (order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_user ON public.delivery_proofs (delivery_user_id, created_at DESC);

-- Resources
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources (category);

-- Schools (if exists)
CREATE INDEX IF NOT EXISTS idx_school_supply_items_list ON public.school_supply_items (list_id);

-- View tracking: anti-spam
CREATE INDEX IF NOT EXISTS idx_view_tracking_fingerprint ON public.view_tracking (session_fingerprint);

-- Promotions: affichage actives
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions (is_active, end_date) WHERE is_active = true;

-- FAQ: tri
CREATE INDEX IF NOT EXISTS idx_faq_active ON public.faq (sort_order) WHERE is_active = true;

-- =============================================
-- 7. PERFORMANCE: Statistiques à jour pour l'optimiseur
-- =============================================

ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.articles;
ANALYZE public.notifications;
ANALYZE public.payments;
ANALYZE public.profiles;
ANALYZE public.order_items;
ANALYZE public.categories;
