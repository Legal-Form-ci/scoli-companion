-- Persisted share counters per article (publicly readable)

CREATE TABLE IF NOT EXISTS public.article_share_counts (
  article_id uuid PRIMARY KEY,
  facebook integer NOT NULL DEFAULT 0,
  whatsapp integer NOT NULL DEFAULT 0,
  twitter integer NOT NULL DEFAULT 0,
  linkedin integer NOT NULL DEFAULT 0,
  telegram integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_share_counts ENABLE ROW LEVEL SECURITY;

-- Anyone can read counters (public content)
DO $$ BEGIN
  CREATE POLICY "Article share counts are viewable by everyone"
  ON public.article_share_counts
  FOR SELECT
  USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prevent direct writes (no INSERT/UPDATE policies); writes go through the function below.

-- Trigger helper for updated_at (create if missing)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_article_share_counts_updated_at ON public.article_share_counts;
CREATE TRIGGER update_article_share_counts_updated_at
BEFORE UPDATE ON public.article_share_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to increment share counters safely (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_article_share(
  _article_id uuid,
  _platform text
)
RETURNS public.article_share_counts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.article_share_counts;
BEGIN
  IF _platform NOT IN ('facebook','whatsapp','twitter','linkedin','telegram') THEN
    RAISE EXCEPTION 'Unsupported platform: %', _platform;
  END IF;

  INSERT INTO public.article_share_counts (article_id)
  VALUES (_article_id)
  ON CONFLICT (article_id) DO NOTHING;

  UPDATE public.article_share_counts
  SET
    facebook = facebook + CASE WHEN _platform = 'facebook' THEN 1 ELSE 0 END,
    whatsapp = whatsapp + CASE WHEN _platform = 'whatsapp' THEN 1 ELSE 0 END,
    twitter = twitter + CASE WHEN _platform = 'twitter' THEN 1 ELSE 0 END,
    linkedin = linkedin + CASE WHEN _platform = 'linkedin' THEN 1 ELSE 0 END,
    telegram = telegram + CASE WHEN _platform = 'telegram' THEN 1 ELSE 0 END,
    total = total + 1
  WHERE article_id = _article_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Allow calling the RPC from the frontend (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.increment_article_share(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_article_share(uuid, text) TO authenticated;

-- Ensure reads can happen even without an existing row
-- (Rows are created lazily by increment_article_share)