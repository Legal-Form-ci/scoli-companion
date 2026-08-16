-- =============================================
-- SCOLY E-COMMERCE SINGLE STORE MIGRATION
-- =============================================

-- 1. Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'order', -- order, payment, system, promotion
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 2. Create payments table for tracking all payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- orange_money, mtn_money, moov_money, wave, card, bank
  payment_reference TEXT,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add free_shipping flag to products (all products have free shipping)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT true;

-- 4. Add article_comments table for journal comments
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments" ON public.article_comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create comments" ON public.article_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their comments" ON public.article_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.article_comments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add article_likes table
CREATE TABLE IF NOT EXISTS public.article_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, user_id)
);

ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON public.article_likes FOR ALL USING (auth.uid() = user_id);

-- 6. Create admin_stats view for statistics
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.products WHERE is_active = true) as total_products,
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status = 'delivered') as total_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE created_at >= date_trunc('month', CURRENT_DATE)) as monthly_revenue,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM public.articles WHERE status = 'published') as total_articles;

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- 8. Add trigger for creating notification on new order
CREATE OR REPLACE FUNCTION public.notify_admin_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Notify all admins
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_id,
      'order',
      'Nouvelle commande',
      'Une nouvelle commande de ' || NEW.total_amount || ' FCFA a été passée.',
      jsonb_build_object('order_id', NEW.id, 'amount', NEW.total_amount)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_order_notify_admin
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_order();

-- 9. Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;