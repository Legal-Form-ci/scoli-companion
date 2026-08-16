-- Add email column to profiles to enable username login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update existing profiles with email from auth.users (via trigger on next login)
-- Note: We cannot directly access auth.users from client, so we'll update profiles on login

-- Allow users to view their own profile email for lookup
-- The RLS policy already allows users to see their own profile