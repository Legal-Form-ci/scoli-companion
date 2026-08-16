CREATE INDEX IF NOT EXISTS idx_articles_status_views
  ON public.articles (status, views DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_status_published_at
  ON public.articles (status, published_at DESC NULLS LAST)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_status_created_at
  ON public.articles (status, created_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (is_active, created_at DESC)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_views
  ON public.products (is_active, views DESC NULLS LAST)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_category
  ON public.products (is_active, category_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON public.orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_delivery_user
  ON public.orders (delivery_user_id, created_at DESC)
  WHERE delivery_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
  ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_cart_items_user
  ON public.cart_items (user_id);

CREATE INDEX IF NOT EXISTS idx_article_likes_article
  ON public.article_likes (article_id);

CREATE INDEX IF NOT EXISTS idx_article_comments_article
  ON public.article_comments (article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);

CREATE INDEX IF NOT EXISTS idx_payments_order
  ON public.payments (order_id);

ANALYZE public.articles;
ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.notifications;