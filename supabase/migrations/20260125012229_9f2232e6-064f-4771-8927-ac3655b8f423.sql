-- Ensure platform_settings.key is unique so upsert(onConflict: 'key') works reliably
-- 1) Deduplicate existing rows keeping the most recently updated
WITH ranked AS (
  SELECT
    id,
    key,
    ROW_NUMBER() OVER (
      PARTITION BY key
      ORDER BY updated_at DESC NULLS LAST
    ) AS rn
  FROM public.platform_settings
)
DELETE FROM public.platform_settings ps
USING ranked r
WHERE ps.id = r.id
  AND r.rn > 1;

-- 2) Add a unique constraint on key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_settings_key_unique'
  ) THEN
    ALTER TABLE public.platform_settings
      ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);
  END IF;
END $$;