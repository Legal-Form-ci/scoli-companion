
-- Fix security definer views by setting security_invoker = true
ALTER VIEW public.schools_public SET (security_invoker = true);
ALTER VIEW public.promotions_public SET (security_invoker = true);
