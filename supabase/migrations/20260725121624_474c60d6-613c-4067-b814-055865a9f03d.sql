ALTER TABLE public.smart_kits ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'ecole';
UPDATE public.smart_kits SET kind = 'ecole' WHERE kind IS NULL;
CREATE INDEX IF NOT EXISTS smart_kits_kind_idx ON public.smart_kits(kind);