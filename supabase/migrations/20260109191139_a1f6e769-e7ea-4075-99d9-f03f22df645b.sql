-- Fix overly-permissive notifications insert policy
DO $$
BEGIN
  -- Drop permissive policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND policyname='System can insert notifications'
  ) THEN
    EXECUTE 'DROP POLICY "System can insert notifications" ON public.notifications';
  END IF;

  -- Ensure a safe INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can create their notifications'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create their notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END$$;
