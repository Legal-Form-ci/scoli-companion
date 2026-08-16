
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
  v_earned INTEGER;
  v_spent INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Authentification requise'::TEXT;
    RETURN;
  END IF;

  -- Lock the user's existing loyalty_rewards rows to prevent concurrent redemptions
  PERFORM 1 FROM public.loyalty_rewards
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Calculate earned points
  SELECT COALESCE(FLOOR(SUM(total_amount) / 1000), 0)::INTEGER INTO v_earned
  FROM public.orders WHERE user_id = v_user_id AND status = 'delivered';

  -- Calculate spent points (under lock)
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
