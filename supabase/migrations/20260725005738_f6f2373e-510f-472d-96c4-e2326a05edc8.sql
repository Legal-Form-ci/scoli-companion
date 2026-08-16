-- Auto-link smart_kit_items to matching products by fuzzy name match
UPDATE public.smart_kit_items ski
SET product_id = p.id
FROM public.products p
WHERE ski.product_id IS NULL
  AND p.is_active = true
  AND (
    lower(p.name_fr) = lower(ski.item_name)
    OR lower(p.name_fr) ILIKE '%' || lower(ski.item_name) || '%'
    OR lower(ski.item_name) ILIKE '%' || lower(p.name_fr) || '%'
  )
  AND p.id = (
    SELECT p2.id FROM public.products p2
    WHERE p2.is_active = true
      AND (
        lower(p2.name_fr) = lower(ski.item_name)
        OR lower(p2.name_fr) ILIKE '%' || lower(ski.item_name) || '%'
        OR lower(ski.item_name) ILIKE '%' || lower(p2.name_fr) || '%'
      )
    ORDER BY
      CASE WHEN lower(p2.name_fr) = lower(ski.item_name) THEN 0 ELSE 1 END,
      length(p2.name_fr) ASC
    LIMIT 1
  );

-- For kit items without an estimated price but linked to a product, copy product price
UPDATE public.smart_kit_items ski
SET estimated_price = p.price
FROM public.products p
WHERE ski.product_id = p.id
  AND (ski.estimated_price IS NULL OR ski.estimated_price = 0);