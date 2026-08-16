
WITH normalized AS (
  SELECT id, created_at, is_active,
    regexp_replace(
      lower(translate(coalesce(name_fr,''), 'àâäáãåçèéêëìíîïñòóôõöùúûüýÿÀÂÄÁÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
                                            'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuy')),
      '[^a-z0-9]+', ' ', 'g'
    ) AS nkey
  FROM public.products
),
ranked AS (
  SELECT id,
    row_number() OVER (PARTITION BY nkey ORDER BY (is_active::int) DESC, created_at ASC) AS rn
  FROM normalized
  WHERE nkey IS NOT NULL AND length(trim(nkey)) > 0
)
UPDATE public.products p
SET is_active = false
FROM ranked r
WHERE p.id = r.id AND r.rn > 1 AND p.is_active = true;
