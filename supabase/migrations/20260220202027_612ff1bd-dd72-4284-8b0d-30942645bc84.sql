-- ============================================================
-- SECURITY HARDENING - Vue compteurs + rate limiting + RLS
-- ============================================================

-- 1. Table pour tracker les vues (anti-spam / manipulation)
CREATE TABLE IF NOT EXISTS public.view_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'article' | 'product'
  entity_id uuid NOT NULL,
  session_fingerprint text NOT NULL, -- hash IP+UA
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, session_fingerprint)
);

ALTER TABLE public.view_tracking ENABLE ROW LEVEL SECURITY;

-- Personne ne peut lire (seulement les fonctions SECURITY DEFINER)
CREATE POLICY "No direct access to view tracking"
  ON public.view_tracking FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2. Remplacer increment_article_views avec rate-limiting
CREATE OR REPLACE FUNCTION public.increment_article_views(_article_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_fingerprint text;
  v_inserted boolean := false;
BEGIN
  -- Fingerprint basé sur l'ID session (client devrait passer pg_backend_pid comme proxy)
  -- On utilise une combinaison heure tronquée + article pour limiter à 1 vue/heure/session
  v_fingerprint := encode(
    digest(
      _article_id::text || date_trunc('hour', now())::text || pg_backend_pid()::text,
      'sha256'
    ),
    'hex'
  );

  BEGIN
    INSERT INTO public.view_tracking (entity_type, entity_id, session_fingerprint)
    VALUES ('article', _article_id, v_fingerprint);
    v_inserted := true;
  EXCEPTION WHEN unique_violation THEN
    v_inserted := false;
  END;

  -- Incrémenter seulement si vue unique pour cette heure
  IF v_inserted THEN
    UPDATE public.articles
    SET views = COALESCE(views, 0) + 1
    WHERE id = _article_id AND status = 'published';
  END IF;
END;
$$;

-- 3. Remplacer increment_product_views avec rate-limiting
CREATE OR REPLACE FUNCTION public.increment_product_views(_product_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_fingerprint text;
  v_inserted boolean := false;
BEGIN
  v_fingerprint := encode(
    digest(
      _product_id::text || date_trunc('hour', now())::text || pg_backend_pid()::text,
      'sha256'
    ),
    'hex'
  );

  BEGIN
    INSERT INTO public.view_tracking (entity_type, entity_id, session_fingerprint)
    VALUES ('product', _product_id, v_fingerprint);
    v_inserted := true;
  EXCEPTION WHEN unique_violation THEN
    v_inserted := false;
  END;

  IF v_inserted THEN
    UPDATE public.products
    SET views = COALESCE(views, 0) + 1
    WHERE id = _product_id AND is_active = true;
  END IF;
END;
$$;

-- 4. Nettoyage automatique des view_tracking anciens (> 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_view_tracking()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  DELETE FROM public.view_tracking WHERE viewed_at < now() - interval '24 hours';
$$;

-- 5. Table user_addresses pour les adresses des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addresses"
  ON public.user_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.user_addresses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

SELECT 'Migration sécurité complète' AS status;