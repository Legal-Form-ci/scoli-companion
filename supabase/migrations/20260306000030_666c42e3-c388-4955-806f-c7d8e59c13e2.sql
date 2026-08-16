
-- SECURITY HARDENING: Fix exposed data vulnerabilities
-- (vendor_public_info is a VIEW - skip ALTER TABLE for it)

-- 1. SCHOOLS: Protect email/phone from anonymous access
CREATE OR REPLACE VIEW public.schools_public AS
SELECT id, name, type, city, region, address, code, logo_url, 
       student_count, is_verified, is_active, created_at
FROM public.schools
WHERE is_verified = true AND is_active = true;

DROP POLICY IF EXISTS "Anyone can view verified schools" ON public.schools;
DROP POLICY IF EXISTS "Anyone can view schools" ON public.schools;
DROP POLICY IF EXISTS "Public can view verified schools" ON public.schools;

CREATE POLICY "Authenticated can view verified schools"
ON public.schools FOR SELECT TO authenticated
USING (is_verified = true);

DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;
CREATE POLICY "Admins can manage schools"
ON public.schools FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "School admins can manage their school" ON public.schools;
CREATE POLICY "School admins can manage their school"
ON public.schools FOR ALL TO authenticated
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can register a school" ON public.schools;
CREATE POLICY "Anyone can register a school"
ON public.schools FOR INSERT TO authenticated
WITH CHECK (true);

-- 2. ARTICLE_REACTIONS: Hide user_ids from anonymous
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.article_reactions;
CREATE POLICY "Authenticated can view reactions"
ON public.article_reactions FOR SELECT TO authenticated
USING (true);

-- 3. PROMOTIONS: Hide business metrics from public
CREATE OR REPLACE VIEW public.promotions_public AS
SELECT id, name, description, discount_type, discount_value, 
       min_amount, start_date, end_date, applies_to, is_active
FROM public.promotions
WHERE is_active = true AND (end_date IS NULL OR end_date > now());

DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
CREATE POLICY "Authenticated can view active promotions"
ON public.promotions FOR SELECT TO authenticated
USING ((is_active = true) AND ((end_date IS NULL) OR (end_date > now())));

-- 4. ARTICLE_LIKES: Tighten
DROP POLICY IF EXISTS "Anyone can view likes" ON public.article_likes;
CREATE POLICY "Authenticated can view likes"
ON public.article_likes FOR SELECT TO authenticated
USING (true);

-- 5. Audit triggers for sensitive tables
CREATE OR REPLACE TRIGGER audit_schools_changes
AFTER INSERT OR UPDATE OR DELETE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

CREATE OR REPLACE TRIGGER audit_promotions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_action();

-- 6. Enhanced cleanup with audit log rotation
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.login_sessions WHERE created_at < now() - interval '30 days';
  DELETE FROM public.view_tracking WHERE viewed_at < now() - interval '24 hours';
  DELETE FROM public.rate_limits WHERE last_attempt_at < now() - interval '1 day' AND (blocked_until IS NULL OR blocked_until < now());
  DELETE FROM public.notifications WHERE is_read = true AND created_at < now() - interval '90 days';
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '365 days';
$$;
