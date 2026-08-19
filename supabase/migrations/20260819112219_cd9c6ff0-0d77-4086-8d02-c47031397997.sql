-- 1. Referent applications
CREATE TABLE public.referent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  submitted_role text NOT NULL DEFAULT 'commercial',
  sponsor_referent_id uuid,
  assigned_commercial_id uuid,
  zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  school_name text,
  city text,
  region text,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.referent_applications TO authenticated;
GRANT ALL ON public.referent_applications TO service_role;

ALTER TABLE public.referent_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read applications"
  ON public.referent_applications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR submitted_by = auth.uid()
    OR assigned_commercial_id = auth.uid()
    OR sponsor_referent_id = auth.uid()
  );

CREATE POLICY "Commercials and referents can submit"
  ON public.referent_applications FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'commercial')
      OR public.has_role(auth.uid(), 'referent')
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'super_admin')
    )
  );

CREATE POLICY "Staff can update applications"
  ON public.referent_applications FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR assigned_commercial_id = auth.uid()
    OR (submitted_by = auth.uid() AND status IN ('pending','rejected'))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR assigned_commercial_id = auth.uid()
    OR (submitted_by = auth.uid() AND status IN ('pending','submitted','rejected'))
  );

CREATE TRIGGER update_referent_applications_updated_at
  BEFORE UPDATE ON public.referent_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_referent_apps_status ON public.referent_applications(status);
CREATE INDEX idx_referent_apps_commercial ON public.referent_applications(assigned_commercial_id);
CREATE INDEX idx_referent_apps_sponsor ON public.referent_applications(sponsor_referent_id);

-- 2. Internal tasks
CREATE TABLE public.user_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_by uuid,
  title text NOT NULL,
  description text,
  module text,
  priority text NOT NULL DEFAULT 'normal',
  due_date date,
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tasks TO authenticated;
GRANT ALL ON public.user_tasks TO service_role;

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all tasks"
  ON public.user_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own tasks"
  ON public.user_tasks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users complete own tasks"
  ON public.user_tasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_tasks_user ON public.user_tasks(user_id);