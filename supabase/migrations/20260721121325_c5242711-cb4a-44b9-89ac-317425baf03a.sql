-- Rendre category_id obligatoire sur les produits actifs
-- (les 523 produits existants ont déjà une catégorie renseignée)
ALTER TABLE public.products
  ALTER COLUMN category_id SET NOT NULL;