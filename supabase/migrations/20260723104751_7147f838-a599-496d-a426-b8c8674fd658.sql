
-- 1. Rename Maternelle -> Scoly Maternelle
UPDATE public.categories SET name_fr='Scoly Maternelle', slug='scoly-maternelle' WHERE lower(name_fr)='maternelle';

-- 2. Auto-reclassification by education_level (highest priority)
WITH cats AS (
  SELECT id, name_fr FROM public.categories
)
UPDATE public.products p SET category_id = c.id
FROM cats c
WHERE (
     (c.name_fr='Scoly Maternelle' AND (p.education_level ILIKE '%préscol%' OR p.education_level ILIKE '%maternel%'))
  OR (c.name_fr='Scoly Primaire' AND p.education_level ILIKE '%primaire%')
  OR (c.name_fr='Scoly Secondaire' AND (p.education_level ILIKE '%collège%' OR p.education_level ILIKE '%college%' OR p.education_level ILIKE '%lycée%' OR p.education_level ILIKE '%lycee%' OR p.education_level ILIKE '%secondaire%'))
  OR (c.name_fr='Scoly Université' AND (p.education_level ILIKE '%univers%' OR p.education_level ILIKE '%supérieur%' OR p.education_level ILIKE '%superieur%'))
)
AND p.category_id IS DISTINCT FROM c.id;

-- 3. Bureautique heuristic (products without a school level)
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE name_fr='Scoly Bureautique')
WHERE (education_level IS NULL OR education_level = '')
  AND (
    name_fr ILIKE '%bureau%' OR name_fr ILIKE '%imprim%' OR name_fr ILIKE '%toner%'
    OR name_fr ILIKE '%cartouche%' OR name_fr ILIKE '%agrafeuse%' OR name_fr ILIKE '%perforat%'
    OR name_fr ILIKE '%calculatr%' OR name_fr ILIKE '%tampon%' OR name_fr ILIKE '%parapheur%'
    OR product_type ILIKE '%bureau%'
  )
  AND category_id IS DISTINCT FROM (SELECT id FROM public.categories WHERE name_fr='Scoly Bureautique');

-- 4. Librairie heuristic (romans / œuvres intégrales / littérature générale)
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE name_fr='Scoly Librairie')
WHERE (education_level IS NULL OR education_level = '')
  AND (
    product_type ILIKE '%œuvre%' OR product_type ILIKE '%oeuvre%'
    OR product_type ILIKE '%roman%' OR name_fr ILIKE '%roman%'
    OR name_fr ILIKE '%bibliothèque%' OR name_fr ILIKE '%littérature%'
  )
  AND category_id IS DISTINCT FROM (SELECT id FROM public.categories WHERE name_fr='Scoly Librairie');
