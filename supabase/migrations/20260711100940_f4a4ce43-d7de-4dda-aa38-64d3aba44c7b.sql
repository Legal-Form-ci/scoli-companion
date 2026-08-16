
-- ============================================================
-- ZONES GEOGRAPHIQUES (Côte d'Ivoire)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('district','region','departement','sous_prefecture')),
  parent_id UUID REFERENCES public.zones(id) ON DELETE CASCADE,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, level, parent_id)
);
GRANT SELECT ON public.zones TO anon, authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Zones public read" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Zones admin manage" ON public.zones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_zones_parent ON public.zones(parent_id);
CREATE INDEX IF NOT EXISTS idx_zones_level ON public.zones(level);

-- ============================================================
-- AFFECTATION COMMERCIAUX <-> ZONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commercial_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, zone_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_zones TO authenticated;
GRANT ALL ON public.commercial_zones TO service_role;
ALTER TABLE public.commercial_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own commercial zones view" ON public.commercial_zones FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admin manage commercial zones" ON public.commercial_zones FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_commercial_zones_user ON public.commercial_zones(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_zones_zone ON public.commercial_zones(zone_id);

-- ============================================================
-- INDISPONIBILITES COMMERCIAUX
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commercial_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('conge','maladie','suspension','mission','autre')),
  notes TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_availability TO authenticated;
GRANT ALL ON public.commercial_availability TO service_role;
ALTER TABLE public.commercial_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own availability view" ON public.commercial_availability FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admin manage availability" ON public.commercial_availability FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_availability_user ON public.commercial_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON public.commercial_availability(start_date, end_date);

-- ============================================================
-- DEMANDES DE RETRAIT (Référents)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','validated','rejected','paid')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT ALL ON public.withdrawal_requests TO service_role;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own withdrawals view" ON public.withdrawal_requests FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Own withdrawals create" ON public.withdrawal_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage withdrawals" ON public.withdrawal_requests FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawal_requests(status);

-- ============================================================
-- HISTORIQUE REATTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_reassignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_user_id UUID,
  to_user_id UUID,
  reason TEXT,
  reassigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_reassignments TO authenticated;
GRANT ALL ON public.order_reassignments TO service_role;
ALTER TABLE public.order_reassignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reassignments admin/mod read" ON public.order_reassignments FOR SELECT
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Reassignments admin insert" ON public.order_reassignments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_reassign_order ON public.order_reassignments(order_id);

-- ============================================================
-- MODELES SMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_templates TO authenticated;
GRANT ALL ON public.sms_templates TO service_role;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SMS templates read auth" ON public.sms_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "SMS templates admin manage" ON public.sms_templates FOR ALL
  USING (public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

-- Seed templates
INSERT INTO public.sms_templates (key, label, body) VALUES
  ('order_confirmed', 'Commande confirmée', 'Bonjour {nom}. Votre commande SCOOLY est confirmée. Livraison sous 72 heures. Merci pour votre confiance.'),
  ('order_shipping', 'Commande en cours de livraison', 'Bonjour {nom}. Votre commande est en cours de livraison. Merci de rester joignable.'),
  ('order_arrived', 'Commande arrivée', 'Bonjour {nom}. Votre commande est arrivée dans votre zone. Notre livreur vous contactera très prochainement.'),
  ('order_delivered', 'Livraison terminée', 'Merci {nom}. Votre commande SCOOLY a été livrée avec succès. Merci pour votre confiance.'),
  ('withdrawal_paid', 'Retrait payé', 'Bonjour {nom}. Votre demande de retrait SCOOLY de {montant} FCFA a été payée. Merci.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- COLONNES ADDITIONNELLES
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reassignment_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_zone ON public.orders(zone_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_user ON public.orders(delivery_user_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- Triggers updated_at
-- ============================================================
DROP TRIGGER IF EXISTS trg_zones_updated_at ON public.zones;
CREATE TRIGGER trg_zones_updated_at BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_availability_updated_at ON public.commercial_availability;
CREATE TRIGGER trg_availability_updated_at BEFORE UPDATE ON public.commercial_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_withdrawals_updated_at ON public.withdrawal_requests;
CREATE TRIGGER trg_withdrawals_updated_at BEFORE UPDATE ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sms_templates_updated_at ON public.sms_templates;
CREATE TRIGGER trg_sms_templates_updated_at BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Fonction : commercial disponible pour une zone
-- ============================================================
CREATE OR REPLACE FUNCTION public.pick_available_commercial(_zone_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  SELECT cz.user_id INTO v_user
  FROM public.commercial_zones cz
  LEFT JOIN public.profiles p ON p.id = cz.user_id
  WHERE cz.zone_id = _zone_id
    AND COALESCE(p.is_available, true) = true
    AND NOT EXISTS (
      SELECT 1 FROM public.commercial_availability ca
      WHERE ca.user_id = cz.user_id
        AND ca.start_date <= CURRENT_DATE
        AND (ca.end_date IS NULL OR ca.end_date >= CURRENT_DATE)
    )
  ORDER BY (
    SELECT COUNT(*) FROM public.orders o
    WHERE o.delivery_user_id = cz.user_id
      AND o.status IN ('confirmed','processing','shipped')
  ) ASC, cz.assigned_at ASC
  LIMIT 1;
  RETURN v_user;
END;
$$;

-- ============================================================
-- Trigger : auto-assign commercial when order is confirmed
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_assign_commercial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
BEGIN
  IF NEW.status = 'confirmed'
     AND (OLD.status IS DISTINCT FROM 'confirmed')
     AND NEW.delivery_user_id IS NULL
     AND NEW.zone_id IS NOT NULL THEN
    v_user := public.pick_available_commercial(NEW.zone_id);
    IF v_user IS NOT NULL THEN
      NEW.delivery_user_id := v_user;
      NEW.assigned_at := now();
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        v_user,
        'order',
        'Nouvelle commande attribuée',
        'Message généré automatiquement, ne pas répondre. Une nouvelle commande #' || LEFT(NEW.id::text, 8) || ' vous est attribuée pour livraison.',
        jsonb_build_object('order_id', NEW.id, 'zone_id', NEW.zone_id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_commercial ON public.orders;
CREATE TRIGGER trg_auto_assign_commercial
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_commercial();

-- ============================================================
-- Fonction utilitaire : solde retirable d'un référent
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_referral_balance(_user_id UUID)
RETURNS TABLE(total_earned NUMERIC, total_withdrawn NUMERIC, available NUMERIC)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned NUMERIC;
  v_withdrawn NUMERIC;
BEGIN
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_earned
  FROM public.commissions
  WHERE user_id = _user_id AND status = 'paid';

  SELECT COALESCE(SUM(amount), 0) INTO v_withdrawn
  FROM public.withdrawal_requests
  WHERE user_id = _user_id AND status IN ('paid','processing','validated');

  RETURN QUERY SELECT v_earned, v_withdrawn, GREATEST(v_earned - v_withdrawn, 0);
END;
$$;

-- ============================================================
-- SEED : Districts + Régions principales de Côte d'Ivoire
-- ============================================================
INSERT INTO public.zones (name, level, code) VALUES
  ('District Autonome d''Abidjan', 'district', 'DAA'),
  ('District Autonome de Yamoussoukro', 'district', 'DAY'),
  ('Bas-Sassandra', 'district', 'BSA'),
  ('Comoé', 'district', 'COM'),
  ('Denguélé', 'district', 'DEN'),
  ('Gôh-Djiboua', 'district', 'GDJ'),
  ('Lacs', 'district', 'LAC'),
  ('Lagunes', 'district', 'LAG'),
  ('Montagnes', 'district', 'MTG'),
  ('Sassandra-Marahoué', 'district', 'SMA'),
  ('Savanes', 'district', 'SAV'),
  ('Vallée du Bandama', 'district', 'VDB'),
  ('Woroba', 'district', 'WOR'),
  ('Zanzan', 'district', 'ZAN')
ON CONFLICT (name, level, parent_id) DO NOTHING;
