
-- =====================================================
-- FIX 1: Loyalty points race condition with advisory lock
-- =====================================================
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(_reward_type text, _points_required integer)
RETURNS TABLE(success boolean, reward_id uuid, coupon_code text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_available_points INTEGER;
  v_new_reward_id UUID;
  v_coupon TEXT;
  v_earned INTEGER;
  v_spent INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Authentification requise'::TEXT;
    RETURN;
  END IF;

  -- Advisory lock on user_id to prevent concurrent redemptions (fixes first-redemption race)
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || '_loyalty'));

  -- Lock existing rows
  PERFORM 1 FROM public.loyalty_rewards
  WHERE user_id = v_user_id
  FOR UPDATE;

  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_earned
  FROM public.orders WHERE user_id = v_user_id AND status = 'delivered';

  SELECT COALESCE(SUM(points_spent), 0)::INTEGER INTO v_spent
  FROM public.loyalty_rewards WHERE user_id = v_user_id;

  v_available_points := v_earned - v_spent;

  IF v_available_points < _points_required THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT,
      ('Points insuffisants. Vous avez ' || v_available_points || ' points disponibles.')::TEXT;
    RETURN;
  END IF;

  v_coupon := 'LOYALTY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  INSERT INTO public.loyalty_rewards (user_id, reward_type, points_spent, coupon_code)
  VALUES (v_user_id, _reward_type, _points_required, v_coupon)
  RETURNING id INTO v_new_reward_id;

  RETURN QUERY SELECT true, v_new_reward_id, v_coupon, 'Récompense échangée avec succès!'::TEXT;
END;
$$;

-- =====================================================
-- FIX 2: vendor_public_info - add SELECT policy
-- =====================================================
-- vendor_public_info is a VIEW, we need to check if RLS applies
-- Since it's a view derived from vendor_settings, RLS on vendor_settings applies
-- But let's ensure the view is secure
DROP VIEW IF EXISTS public.vendor_public_info;
CREATE OR REPLACE VIEW public.vendor_public_info 
WITH (security_invoker = true)
AS
SELECT 
  id, user_id, store_name, store_description, 
  logo_url, banner_url, city, is_verified
FROM public.vendor_settings;

-- =====================================================
-- FIX 3: Schools & Establishments tables
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'primary' CHECK (type IN ('primary', 'secondary', 'high_school', 'university')),
  city TEXT,
  region TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  admin_user_id UUID,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active schools"
  ON public.schools FOR SELECT
  USING (is_active = true);

CREATE POLICY "School admins can manage their school"
  ON public.schools FOR ALL
  TO authenticated
  USING (admin_user_id = auth.uid());

CREATE POLICY "Admins can manage all schools"
  ON public.schools FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Supply lists published by schools
CREATE TABLE IF NOT EXISTS public.school_supply_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  series TEXT,
  school_year TEXT NOT NULL DEFAULT '2025-2026',
  is_published BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.school_supply_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published supply lists"
  ON public.school_supply_lists FOR SELECT
  USING (is_published = true);

CREATE POLICY "School admins can manage their lists"
  ON public.school_supply_lists FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.schools 
    WHERE schools.id = school_supply_lists.school_id 
    AND schools.admin_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all supply lists"
  ON public.school_supply_lists FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Items in a supply list
CREATE TABLE IF NOT EXISTS public.school_supply_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.school_supply_lists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  notes TEXT,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.school_supply_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supply items of published lists"
  ON public.school_supply_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.school_supply_lists 
    WHERE school_supply_lists.id = school_supply_items.list_id 
    AND school_supply_lists.is_published = true
  ));

CREATE POLICY "School admins can manage supply items"
  ON public.school_supply_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.school_supply_lists sl
    JOIN public.schools s ON s.id = sl.school_id
    WHERE sl.id = school_supply_items.list_id 
    AND s.admin_user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all supply items"
  ON public.school_supply_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 4: Smart Kits (AI-generated)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.smart_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  series TEXT,
  school_type TEXT DEFAULT 'primary',
  description TEXT,
  total_price NUMERIC DEFAULT 0,
  discount_price NUMERIC,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.smart_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active kits"
  ON public.smart_kits FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage kits"
  ON public.smart_kits FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.smart_kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.smart_kits(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.smart_kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view kit items"
  ON public.smart_kit_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.smart_kits 
    WHERE smart_kits.id = smart_kit_items.kit_id 
    AND smart_kits.is_active = true
  ));

CREATE POLICY "Admins can manage kit items"
  ON public.smart_kit_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 5: Referral/Parrainage system
-- =====================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  TO authenticated
  WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Admins can manage all referrals"
  ON public.referrals FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (reward_type IN ('credit', 'discount', 'points')),
  amount NUMERIC NOT NULL DEFAULT 0,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their rewards"
  ON public.referral_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can claim their rewards"
  ON public.referral_rewards FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all rewards"
  ON public.referral_rewards FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 6: School loyalty program
-- =====================================================
CREATE TABLE IF NOT EXISTS public.school_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  total_points INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id)
);

ALTER TABLE public.school_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view school loyalty"
  ON public.school_loyalty FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage school loyalty"
  ON public.school_loyalty FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 7: Educational resources marketplace
-- =====================================================
-- The resources table already exists, add digital_content table
CREATE TABLE IF NOT EXISTS public.educational_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'document' CHECK (content_type IN ('document', 'exercise', 'exam', 'course', 'video')),
  subject TEXT,
  grade_level TEXT,
  file_url TEXT,
  preview_url TEXT,
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved content"
  ON public.educational_content FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Authors can manage their content"
  ON public.educational_content FOR ALL
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all content"
  ON public.educational_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Generate referral code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'SCOLY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;
