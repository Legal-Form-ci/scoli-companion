
-- 1) ORDER TOTAL TAMPER PROTECTION
CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order_id uuid; v_subtotal numeric;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);
  IF v_order_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal FROM public.order_items WHERE order_id = v_order_id;
  UPDATE public.orders
    SET total_amount = GREATEST(v_subtotal - COALESCE(discount_amount, 0), 0), updated_at = now()
    WHERE id = v_order_id;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_recompute_order_total ON public.order_items;
CREATE TRIGGER trg_recompute_order_total
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.recompute_order_total();

CREATE OR REPLACE FUNCTION public.guard_order_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_subtotal numeric;
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal FROM public.order_items WHERE order_id = NEW.id;
  IF v_subtotal > 0 THEN
    NEW.total_amount := GREATEST(v_subtotal - COALESCE(NEW.discount_amount, 0), 0);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_order_total ON public.orders;
CREATE TRIGGER trg_guard_order_total
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_total();

-- 2) ARTICLES PREMIUM CONTENT SPLIT
CREATE TABLE IF NOT EXISTS public.article_premium_content (
  article_id uuid PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
  content_fr text, content_en text, content_de text, content_es text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.article_premium_content TO service_role;
ALTER TABLE public.article_premium_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage premium content" ON public.article_premium_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role));

CREATE POLICY "Authors can manage own premium content" ON public.article_premium_content FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.author_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.author_id = auth.uid()));

INSERT INTO public.article_premium_content (article_id, content_fr, content_en, content_de, content_es)
SELECT id, content_fr, content_en, content_de, content_es FROM public.articles WHERE is_premium = true
ON CONFLICT (article_id) DO NOTHING;

UPDATE public.articles SET content_fr=NULL, content_en=NULL, content_de=NULL, content_es=NULL WHERE is_premium = true;

CREATE OR REPLACE FUNCTION public.sync_article_premium_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_premium = true THEN
    INSERT INTO public.article_premium_content (article_id, content_fr, content_en, content_de, content_es, updated_at)
    VALUES (NEW.id, NEW.content_fr, NEW.content_en, NEW.content_de, NEW.content_es, now())
    ON CONFLICT (article_id) DO UPDATE SET
      content_fr = COALESCE(EXCLUDED.content_fr, public.article_premium_content.content_fr),
      content_en = COALESCE(EXCLUDED.content_en, public.article_premium_content.content_en),
      content_de = COALESCE(EXCLUDED.content_de, public.article_premium_content.content_de),
      content_es = COALESCE(EXCLUDED.content_es, public.article_premium_content.content_es),
      updated_at = now();
    NEW.content_fr := NULL; NEW.content_en := NULL; NEW.content_de := NULL; NEW.content_es := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_article_premium ON public.articles;
CREATE TRIGGER trg_sync_article_premium
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.sync_article_premium_content();

CREATE OR REPLACE FUNCTION public.get_article_premium_content(_article_id uuid)
RETURNS TABLE(content_fr text, content_en text, content_de text, content_es text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_author uuid; v_is_premium boolean;
BEGIN
  SELECT author_id, is_premium INTO v_author, v_is_premium
  FROM public.articles WHERE id = _article_id AND status = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'Article not found'; END IF;

  IF v_is_premium = false THEN
    RETURN QUERY SELECT a.content_fr, a.content_en, a.content_de, a.content_es
                 FROM public.articles a WHERE a.id = _article_id;
    RETURN;
  END IF;

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF v_uid = v_author
     OR public.has_role(v_uid,'admin'::app_role)
     OR public.has_role(v_uid,'moderator'::app_role)
     OR EXISTS (SELECT 1 FROM public.article_purchases
                WHERE article_id = _article_id AND user_id = v_uid AND status = 'completed')
  THEN
    RETURN QUERY SELECT p.content_fr, p.content_en, p.content_de, p.content_es
                 FROM public.article_premium_content p WHERE p.article_id = _article_id;
  ELSE
    RAISE EXCEPTION 'Access denied: purchase required';
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.get_article_premium_content(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_article_premium_content(uuid) TO anon, authenticated;

-- 3) EDUCATIONAL CONTENT PAID FILE URL SPLIT
CREATE TABLE IF NOT EXISTS public.educational_content_files (
  content_id uuid PRIMARY KEY REFERENCES public.educational_content(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.educational_content_files TO service_role;
ALTER TABLE public.educational_content_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage paid content files" ON public.educational_content_files FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'moderator'::app_role));

CREATE POLICY "Authors can manage own paid content files" ON public.educational_content_files FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.educational_content e WHERE e.id = content_id AND e.author_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.educational_content e WHERE e.id = content_id AND e.author_id = auth.uid()));

INSERT INTO public.educational_content_files (content_id, file_url)
SELECT id, file_url FROM public.educational_content
WHERE COALESCE(is_free, false) = false AND file_url IS NOT NULL
ON CONFLICT (content_id) DO NOTHING;

UPDATE public.educational_content SET file_url = NULL WHERE COALESCE(is_free, false) = false;

CREATE OR REPLACE FUNCTION public.sync_educational_content_file()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_free, false) = false AND NEW.file_url IS NOT NULL THEN
    INSERT INTO public.educational_content_files (content_id, file_url, updated_at)
    VALUES (NEW.id, NEW.file_url, now())
    ON CONFLICT (content_id) DO UPDATE SET file_url = EXCLUDED.file_url, updated_at = now();
    NEW.file_url := NULL;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_sync_educational_content_file ON public.educational_content;
CREATE TRIGGER trg_sync_educational_content_file
BEFORE INSERT OR UPDATE ON public.educational_content
FOR EACH ROW EXECUTE FUNCTION public.sync_educational_content_file();

CREATE OR REPLACE FUNCTION public.get_educational_content_file_url(_content_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_is_free boolean; v_author uuid; v_url text;
BEGIN
  SELECT is_free, author_id, file_url INTO v_is_free, v_author, v_url
  FROM public.educational_content WHERE id = _content_id AND is_approved = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Content not found'; END IF;

  IF COALESCE(v_is_free, false) = true THEN RETURN v_url; END IF;

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF v_uid = v_author
     OR public.has_role(v_uid,'admin'::app_role)
     OR public.has_role(v_uid,'moderator'::app_role)
     OR EXISTS (SELECT 1 FROM public.article_purchases
                WHERE article_id = _content_id AND user_id = v_uid AND status = 'completed')
  THEN
    SELECT file_url INTO v_url FROM public.educational_content_files WHERE content_id = _content_id;
    RETURN v_url;
  ELSE
    RAISE EXCEPTION 'Access denied: purchase required';
  END IF;
END; $$;

REVOKE ALL ON FUNCTION public.get_educational_content_file_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_educational_content_file_url(uuid) TO anon, authenticated;
