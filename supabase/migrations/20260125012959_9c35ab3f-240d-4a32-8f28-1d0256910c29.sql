-- Create loyalty_rewards table to track redeemed rewards
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL, -- 'discount_5', 'free_shipping', 'discount_10'
  points_spent INTEGER NOT NULL,
  coupon_code TEXT, -- Generated coupon code for discounts
  is_used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their rewards"
ON public.loyalty_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own rewards (redeem points)
CREATE POLICY "Users can redeem rewards"
ON public.loyalty_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their rewards (mark as used)
CREATE POLICY "Users can use their rewards"
ON public.loyalty_rewards
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all rewards
CREATE POLICY "Admins can manage all rewards"
ON public.loyalty_rewards
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to redeem loyalty points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  _reward_type TEXT,
  _points_required INTEGER
)
RETURNS TABLE(success BOOLEAN, reward_id UUID, coupon_code TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_available_points INTEGER;
  v_new_reward_id UUID;
  v_coupon TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Authentification requise'::TEXT;
    RETURN;
  END IF;

  -- Calculate available points (1 point per 1000 FCFA on delivered orders)
  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_available_points
  FROM public.orders
  WHERE user_id = v_user_id AND status = 'delivered';

  -- Subtract already spent points
  v_available_points := v_available_points - COALESCE(
    (SELECT SUM(points_spent) FROM public.loyalty_rewards WHERE user_id = v_user_id),
    0
  );

  -- Check if user has enough points
  IF v_available_points < _points_required THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 
      ('Points insuffisants. Vous avez ' || v_available_points || ' points disponibles.')::TEXT;
    RETURN;
  END IF;

  -- Generate coupon code
  v_coupon := 'LOYALTY-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Create the reward
  INSERT INTO public.loyalty_rewards (user_id, reward_type, points_spent, coupon_code)
  VALUES (v_user_id, _reward_type, _points_required, v_coupon)
  RETURNING id INTO v_new_reward_id;

  RETURN QUERY SELECT true, v_new_reward_id, v_coupon, 'Récompense échangée avec succès!'::TEXT;
END;
$$;

-- Create function to get user available loyalty points
CREATE OR REPLACE FUNCTION public.get_user_loyalty_points()
RETURNS TABLE(total_earned INTEGER, total_spent INTEGER, available INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_earned INTEGER;
  v_spent INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0;
    RETURN;
  END IF;

  -- Calculate earned points
  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_earned
  FROM public.orders
  WHERE user_id = v_user_id AND status = 'delivered';

  -- Calculate spent points
  SELECT COALESCE(SUM(points_spent), 0)::INTEGER INTO v_spent
  FROM public.loyalty_rewards
  WHERE user_id = v_user_id;

  RETURN QUERY SELECT v_earned, v_spent, (v_earned - v_spent);
END;
$$;