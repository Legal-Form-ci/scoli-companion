
-- 1) reviews.user_id column-level protection
REVOKE SELECT (user_id) ON public.reviews FROM authenticated;
GRANT SELECT (id, product_id, rating, comment, created_at) ON public.reviews TO authenticated, anon;
-- Owners and admins still get all cols via their existing ALL policies (row-level); grant back user_id to service_role only
GRANT SELECT (user_id) ON public.reviews TO service_role;

-- 2) school_loyalty: restrict SELECT
DROP POLICY IF EXISTS "Anyone can view school loyalty" ON public.school_loyalty;
CREATE POLICY "School admin or admins can view loyalty"
ON public.school_loyalty FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_loyalty.school_id AND s.admin_user_id = auth.uid())
);
REVOKE SELECT ON public.school_loyalty FROM anon;

-- 3) sms_templates: admin/moderator only
DROP POLICY IF EXISTS "SMS templates read auth" ON public.sms_templates;
CREATE POLICY "SMS templates read admin/mod"
ON public.sms_templates FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- 4) articles: prevent non-admin/mod self-publish via trigger
CREATE OR REPLACE FUNCTION public.enforce_article_publish_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_staff boolean := has_role(v_uid, 'admin'::app_role) OR has_role(v_uid, 'moderator'::app_role);
BEGIN
  IF v_is_staff THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS DISTINCT FROM 'draft' AND NEW.status IS DISTINCT FROM 'pending' THEN
      NEW.status := 'pending';
    END IF;
    NEW.published_at := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
      RAISE EXCEPTION 'Only admins or moderators can publish articles';
    END IF;
    IF NEW.published_at IS DISTINCT FROM OLD.published_at THEN
      NEW.published_at := OLD.published_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_article_publish_moderation ON public.articles;
CREATE TRIGGER enforce_article_publish_moderation
BEFORE INSERT OR UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.enforce_article_publish_moderation();
