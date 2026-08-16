
-- ============================================================
-- DATABASE OPTIMIZATION: Indexes for performance
-- ============================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_education_level ON public.products(education_level);
CREATE INDEX IF NOT EXISTS idx_products_subject ON public.products(subject);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_user_id ON public.orders(delivery_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- Login sessions indexes
CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON public.login_sessions(user_id);

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_commissions_vendor_id ON public.commissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON public.commissions(order_id);

-- ============================================================
-- NOTIFICATION TRIGGER: Auto-notify on order status change
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'order',
      CASE NEW.status
        WHEN 'confirmed' THEN 'Commande confirmée'
        WHEN 'processing' THEN 'Commande en préparation'
        WHEN 'shipped' THEN 'Commande expédiée'
        WHEN 'delivered' THEN 'Commande livrée'
        WHEN 'cancelled' THEN 'Commande annulée'
        ELSE 'Mise à jour de commande'
      END,
      'Message généré automatiquement, ne pas répondre. ' ||
      CASE NEW.status
        WHEN 'confirmed' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été confirmée et est en cours de traitement.'
        WHEN 'processing' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' est en cours de préparation.'
        WHEN 'shipped' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été expédiée. Vous serez contacté pour la livraison.'
        WHEN 'delivered' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été livrée avec succès. Merci pour votre confiance !'
        WHEN 'cancelled' THEN 'Votre commande #' || LEFT(NEW.id::text, 8) || ' a été annulée.'
        ELSE 'Le statut de votre commande #' || LEFT(NEW.id::text, 8) || ' a été mis à jour.'
      END,
      jsonb_build_object(
        'order_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'amount', NEW.total_amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_notification ON public.orders;
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();

-- ============================================================
-- NOTIFICATION TRIGGER: Auto-notify on payment status change
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'payment',
      CASE NEW.status
        WHEN 'completed' THEN 'Paiement réussi'
        WHEN 'failed' THEN 'Paiement échoué'
        WHEN 'cancelled' THEN 'Paiement annulé'
        ELSE 'Mise à jour du paiement'
      END,
      'Message généré automatiquement, ne pas répondre. ' ||
      CASE NEW.status
        WHEN 'completed' THEN 'Votre paiement de ' || NEW.amount || ' FCFA a été confirmé avec succès.'
        WHEN 'failed' THEN 'Votre paiement de ' || NEW.amount || ' FCFA a échoué. Veuillez réessayer.'
        WHEN 'cancelled' THEN 'Votre paiement de ' || NEW.amount || ' FCFA a été annulé.'
        ELSE 'Le statut de votre paiement a été mis à jour.'
      END,
      jsonb_build_object(
        'payment_id', NEW.id,
        'order_id', NEW.order_id,
        'amount', NEW.amount,
        'status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_status_notification ON public.payments;
CREATE TRIGGER trg_payment_status_notification
  AFTER UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_status_change();

-- ============================================================
-- NOTIFICATION TRIGGER: Welcome notification on new user
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.id,
    'system',
    'Bienvenue sur ScoOffice+ !',
    'Message généré automatiquement, ne pas répondre. Bonjour ' || COALESCE(NEW.first_name, '') || ', bienvenue sur ScoOffice+ ! Découvrez notre catalogue de fournitures scolaires et bureautiques avec livraison gratuite partout en Côte d''Ivoire.',
    jsonb_build_object('type', 'welcome', 'user_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_notification ON public.profiles;
CREATE TRIGGER trg_welcome_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user();

-- ============================================================
-- NOTIFICATION TRIGGER: New article published
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_article_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'published' THEN
    -- Notify the author
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.author_id,
      'article',
      'Article publié !',
      'Message généré automatiquement, ne pas répondre. Votre article "' || NEW.title_fr || '" a été publié avec succès sur ScoOffice+.',
      jsonb_build_object('article_id', NEW.id, 'title', NEW.title_fr)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_article_published_notification ON public.articles;
CREATE TRIGGER trg_article_published_notification
  AFTER UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_article_published();
