-- Table pour les achats d'articles premium
CREATE TABLE IF NOT EXISTS public.article_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_id UUID REFERENCES public.payments(id),
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.article_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for article_purchases
CREATE POLICY "Users can view their article purchases"
ON public.article_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create article purchases"
ON public.article_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all article purchases"
ON public.article_purchases
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Table pour les promotions et campagnes
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
  discount_value NUMERIC NOT NULL,
  min_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  applies_to TEXT DEFAULT 'all', -- 'all', 'products', 'articles'
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
ON public.promotions
FOR SELECT
USING (is_active = true AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage promotions"
ON public.promotions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Table pour les campagnes publicitaires
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'banner', -- 'banner', 'popup', 'email'
  content JSONB DEFAULT '{}',
  target_audience TEXT DEFAULT 'all',
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaigns"
ON public.campaigns
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add rejected status to articles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'rejection_reason') THEN
    ALTER TABLE public.articles ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Table FAQ
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_fr TEXT NOT NULL,
  question_en TEXT,
  answer_fr TEXT NOT NULL,
  answer_en TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQ"
ON public.faq
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage FAQ"
ON public.faq
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for article_purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.article_purchases;