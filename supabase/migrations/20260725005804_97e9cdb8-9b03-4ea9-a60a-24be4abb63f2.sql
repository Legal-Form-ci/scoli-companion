-- Match by first significant word of item_name (e.g., "Cahier", "Stylo", "Ardoise")
UPDATE public.smart_kit_items ski
SET product_id = (
  SELECT p.id FROM public.products p
  WHERE p.is_active = true
    AND p.stock > 0
    AND lower(p.name_fr) ILIKE '%' || lower(split_part(ski.item_name, ' ', 1)) || '%'
  ORDER BY p.price ASC NULLS LAST
  LIMIT 1
)
WHERE ski.product_id IS NULL
  AND length(split_part(ski.item_name, ' ', 1)) >= 4;

UPDATE public.smart_kit_items ski
SET estimated_price = p.price
FROM public.products p
WHERE ski.product_id = p.id
  AND (ski.estimated_price IS NULL OR ski.estimated_price = 0);