-- Switch public wrappers back to SECURITY INVOKER
ALTER FUNCTION public.can_create_set(uuid) SECURITY INVOKER;
ALTER FUNCTION public.can_add_sentence(uuid) SECURITY INVOKER;
ALTER FUNCTION public.consume_sentence_slot(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_pro(uuid) SECURITY INVOKER;

-- Allow authenticated users to reach the private helpers used by the wrappers.
-- The private functions are SECURITY DEFINER (where needed) and live outside
-- the exposed API schema, so they are not directly reachable through PostgREST.
GRANT USAGE ON SCHEMA private TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.can_create_set(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_add_sentence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.consume_sentence_slot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_pro(uuid) TO authenticated, anon;