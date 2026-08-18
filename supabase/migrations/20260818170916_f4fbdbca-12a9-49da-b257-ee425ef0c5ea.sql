CREATE TABLE IF NOT EXISTS public.sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  body text NOT NULL,
  template_key text,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'smsing',
  provider_message_id text,
  error_message text,
  sent_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sms logs" ON public.sms_logs;
CREATE POLICY "Admins can view sms logs"
ON public.sms_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'moderator'));

DROP TRIGGER IF EXISTS update_sms_logs_updated_at ON public.sms_logs;
CREATE TRIGGER update_sms_logs_updated_at
BEFORE UPDATE ON public.sms_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs (created_at DESC);

DROP POLICY IF EXISTS "Admins can manage sms templates" ON public.sms_templates;
CREATE POLICY "Admins can manage sms templates"
ON public.sms_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_templates TO authenticated;