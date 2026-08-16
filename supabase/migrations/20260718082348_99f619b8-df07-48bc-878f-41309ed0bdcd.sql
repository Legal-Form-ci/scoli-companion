
-- 1) Reviews: revoke column-level access to user_id from anon/authenticated
REVOKE SELECT (user_id) ON public.reviews FROM anon, authenticated, PUBLIC;
GRANT SELECT (id, product_id, rating, comment, created_at) ON public.reviews TO anon, authenticated;
GRANT SELECT (user_id) ON public.reviews TO service_role;

-- 2) Schools: revoke sensitive columns from anon
REVOKE SELECT (email, phone, admin_user_id, address) ON public.schools FROM anon, PUBLIC;
GRANT SELECT (id, name, code, city, region, type, is_active, is_verified, logo_url, website, student_count, created_at, updated_at) ON public.schools TO anon;

-- 3) Educational content: hide file_url on paid rows from public reads
REVOKE SELECT (file_url) ON public.educational_content FROM anon, authenticated, PUBLIC;
GRANT SELECT (file_url) ON public.educational_content TO service_role;

CREATE OR REPLACE FUNCTION public.get_resource_file_url(_resource_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.educational_content%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_row FROM public.educational_content WHERE id = _resource_id AND is_approved = true;
  IF v_row.id IS NULL THEN
    RETURN NULL;
  END IF;
  IF COALESCE(v_row.is_free, false) = true THEN
    RETURN v_row.file_url;
  END IF;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_row.author_id = v_uid OR public.has_role(v_uid, 'admin'::app_role) OR public.has_role(v_uid, 'moderator'::app_role) THEN
    RETURN v_row.file_url;
  END IF;
  -- Check purchase in article_purchases table if resource-based purchases stored there; otherwise deny
  IF EXISTS (
    SELECT 1 FROM public.article_purchases ap
    WHERE ap.user_id = v_uid AND ap.article_id = _resource_id AND ap.status = 'completed'
  ) THEN
    RETURN v_row.file_url;
  END IF;
  RAISE EXCEPTION 'Purchase required';
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_resource_file_url(uuid) TO anon, authenticated;

-- 4) Premium articles: hide full content columns on premium rows via column revoke + RPC
REVOKE SELECT (content_fr, content_en, content_de, content_es) ON public.articles FROM anon, authenticated, PUBLIC;
GRANT SELECT (content_fr, content_en, content_de, content_es) ON public.articles TO service_role;

CREATE OR REPLACE FUNCTION public.get_article_content(_article_id uuid)
RETURNS TABLE(content_fr text, content_en text, content_de text, content_es text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.articles%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_row FROM public.articles WHERE id = _article_id AND status = 'published';
  IF v_row.id IS NULL THEN
    RETURN;
  END IF;
  IF COALESCE(v_row.is_premium, false) = false THEN
    RETURN QUERY SELECT v_row.content_fr, v_row.content_en, v_row.content_de, v_row.content_es;
    RETURN;
  END IF;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF v_row.author_id = v_uid OR public.has_role(v_uid, 'admin'::app_role) OR public.has_role(v_uid, 'moderator'::app_role) THEN
    RETURN QUERY SELECT v_row.content_fr, v_row.content_en, v_row.content_de, v_row.content_es;
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.article_purchases ap
    WHERE ap.user_id = v_uid AND ap.article_id = _article_id AND ap.status = 'completed'
  ) THEN
    RETURN QUERY SELECT v_row.content_fr, v_row.content_en, v_row.content_de, v_row.content_es;
    RETURN;
  END IF;
  RAISE EXCEPTION 'Purchase required';
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_article_content(uuid) TO anon, authenticated;
