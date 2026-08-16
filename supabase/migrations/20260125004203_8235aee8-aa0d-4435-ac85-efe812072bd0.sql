-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow inserts from authenticated users (will be service role in edge function)
CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- Create rate_limits table for tracking request attempts
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action_type TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow public to check rate limits
CREATE POLICY "Anyone can read rate limits"
ON public.rate_limits
FOR SELECT
USING (true);

-- Allow inserts for rate limit tracking
CREATE POLICY "Anyone can insert rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (true);

-- Allow updates for rate limit tracking
CREATE POLICY "Anyone can update rate limits"
ON public.rate_limits
FOR UPDATE
USING (true);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier TEXT,
  _action_type TEXT,
  _max_attempts INTEGER DEFAULT 5,
  _window_seconds INTEGER DEFAULT 300,
  _block_seconds INTEGER DEFAULT 900
)
RETURNS TABLE(allowed BOOLEAN, remaining_attempts INTEGER, blocked_until TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record public.rate_limits%ROWTYPE;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_window_start TIMESTAMP WITH TIME ZONE := v_now - (_window_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Get existing record
  SELECT * INTO v_record
  FROM public.rate_limits
  WHERE identifier = _identifier AND action_type = _action_type;
  
  IF v_record.id IS NULL THEN
    -- No record exists, create one
    INSERT INTO public.rate_limits (identifier, action_type, attempts, first_attempt_at, last_attempt_at)
    VALUES (_identifier, _action_type, 1, v_now, v_now);
    
    RETURN QUERY SELECT true, _max_attempts - 1, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN QUERY SELECT false, 0, v_record.blocked_until;
    RETURN;
  END IF;
  
  -- Reset if window has passed
  IF v_record.first_attempt_at < v_window_start THEN
    UPDATE public.rate_limits
    SET attempts = 1, first_attempt_at = v_now, last_attempt_at = v_now, blocked_until = NULL
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT true, _max_attempts - 1, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  -- Increment attempts
  IF v_record.attempts >= _max_attempts THEN
    -- Block the user
    UPDATE public.rate_limits
    SET blocked_until = v_now + (_block_seconds || ' seconds')::INTERVAL, last_attempt_at = v_now
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT false, 0, v_now + (_block_seconds || ' seconds')::INTERVAL;
    RETURN;
  END IF;
  
  -- Allow and increment
  UPDATE public.rate_limits
  SET attempts = attempts + 1, last_attempt_at = v_now
  WHERE id = v_record.id;
  
  RETURN QUERY SELECT true, _max_attempts - v_record.attempts - 1, NULL::TIMESTAMP WITH TIME ZONE;
END;
$$;