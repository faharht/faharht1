GRANT EXECUTE ON FUNCTION public.can_create_set(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_add_sentence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_sentence_slot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, anon;