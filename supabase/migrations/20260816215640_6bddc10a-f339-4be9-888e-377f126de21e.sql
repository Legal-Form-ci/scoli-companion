GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_module(uuid, text, text) TO anon, authenticated;