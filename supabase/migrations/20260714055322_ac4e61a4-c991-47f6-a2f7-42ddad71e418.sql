
-- Add Kit École fields to smart_kits
ALTER TABLE public.smart_kits
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS options TEXT;

-- Constraint on category values (only when not null)
DO $$ BEGIN
  ALTER TABLE public.smart_kits
    ADD CONSTRAINT smart_kits_category_check
    CHECK (category IS NULL OR category IN ('kit_cahiers','kit_livres','kit_complet_cl','kit_complet_clad'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_smart_kits_school_id ON public.smart_kits(school_id);
CREATE INDEX IF NOT EXISTS idx_smart_kits_category ON public.smart_kits(category);

-- Public view of validated schools (safe columns only) for the Kit École search
CREATE OR REPLACE VIEW public.public_schools
WITH (security_invoker = true)
AS
SELECT id, name, code, logo_url, city, region, type
FROM public.schools
WHERE is_active = true AND is_verified = true;

GRANT SELECT ON public.public_schools TO anon, authenticated;

-- Allow anonymous SELECT of active+verified schools directly (needed for view under security_invoker)
DO $$ BEGIN
  CREATE POLICY "Public can view validated schools"
    ON public.schools FOR SELECT
    USING (is_active = true AND is_verified = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON public.schools TO anon;
