# SQL à exécuter manuellement (Supabase SQL Editor)

Ce script est **complet et idempotent**. L'UI est déjà déployée et se branche automatiquement dessus : aucune action supplémentaire côté interface après exécution.

```sql
-- =========================================================
-- 1) DURCISSEMENT DES FONCTIONS (grants demandés)
-- =========================================================
REVOKE ALL ON FUNCTION public.can_manage_module(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_module(uuid,text,text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.validate_commission_amounts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_commission_amounts() TO service_role;

REVOKE ALL ON FUNCTION public.sync_smart_kit_total() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_smart_kit_total() TO service_role;

-- has_role doit rester exécutable par les clients (utilisée dans les policies + UI)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- =========================================================
-- 2) GRANTS TABLES KITS
-- =========================================================
GRANT SELECT ON public.smart_kits TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.smart_kits TO authenticated;
GRANT ALL ON public.smart_kits TO service_role;

GRANT SELECT ON public.smart_kit_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.smart_kit_items TO authenticated;
GRANT ALL ON public.smart_kit_items TO service_role;

ALTER TABLE public.smart_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_kit_items ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3) RLS KITS : lecture publique des kits publiés, écriture RBAC
-- =========================================================
DROP POLICY IF EXISTS "kits_public_read" ON public.smart_kits;
CREATE POLICY "kits_public_read" ON public.smart_kits
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND status = 'published');

DROP POLICY IF EXISTS "kits_staff_read" ON public.smart_kits;
CREATE POLICY "kits_staff_read" ON public.smart_kits
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "kits_admin_insert" ON public.smart_kits;
CREATE POLICY "kits_admin_insert" ON public.smart_kits
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "kits_admin_update" ON public.smart_kits;
CREATE POLICY "kits_admin_update" ON public.smart_kits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "kits_admin_delete" ON public.smart_kits;
CREATE POLICY "kits_admin_delete" ON public.smart_kits
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Lignes de composition : lisibles si le kit parent est lisible
DROP POLICY IF EXISTS "kit_items_public_read" ON public.smart_kit_items;
CREATE POLICY "kit_items_public_read" ON public.smart_kit_items
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.smart_kits k
    WHERE k.id = smart_kit_items.kit_id AND k.is_active = true AND k.status = 'published'
  ));

DROP POLICY IF EXISTS "kit_items_staff_read" ON public.smart_kit_items;
CREATE POLICY "kit_items_staff_read" ON public.smart_kit_items
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "kit_items_admin_write" ON public.smart_kit_items;
CREATE POLICY "kit_items_admin_write" ON public.smart_kit_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- =========================================================
-- 4) COMMANDES : RBAC/RLS strict sur chaque endpoint lié aux kits
-- =========================================================
DROP POLICY IF EXISTS "order_items_owner_read" ON public.order_items;
CREATE POLICY "order_items_owner_read" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'commercial')
    OR public.has_role(auth.uid(), 'comptable')
  );

DROP POLICY IF EXISTS "order_items_owner_insert" ON public.order_items;
CREATE POLICY "order_items_owner_insert" ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Une ligne de kit doit référencer un kit publié et actif (protection serveur)
CREATE OR REPLACE FUNCTION public.validate_order_item_kit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.kit_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.smart_kits k
      WHERE k.id = NEW.kit_id AND k.is_active = true AND k.status = 'published'
    ) THEN
      RAISE EXCEPTION 'Kit indisponible';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_order_item_kit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_order_item_kit() TO service_role;

DROP TRIGGER IF EXISTS trg_validate_order_item_kit ON public.order_items;
CREATE TRIGGER trg_validate_order_item_kit
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_kit();

-- =========================================================
-- 5) HARMONISATION DES PRIX DES KITS (fin des 0 FCFA)
-- =========================================================
UPDATE public.smart_kits k
SET total_price = sub.total
FROM (
  SELECT kit_id, SUM(COALESCE(estimated_price,0) * GREATEST(COALESCE(quantity,1),1)) AS total
  FROM public.smart_kit_items
  WHERE COALESCE(is_optional,false) = false
  GROUP BY kit_id
) sub
WHERE k.id = sub.kit_id
  AND sub.total > 0
  AND COALESCE(k.total_price,0) <> sub.total;
```
