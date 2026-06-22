-- Cascade delete messages when a suggestion is removed
ALTER TABLE public.suggestion_messages
  DROP CONSTRAINT IF EXISTS suggestion_messages_suggestion_id_fkey;
ALTER TABLE public.suggestion_messages
  ADD CONSTRAINT suggestion_messages_suggestion_id_fkey
  FOREIGN KEY (suggestion_id) REFERENCES public.suggestions(id) ON DELETE CASCADE;

-- Admin delete policies
CREATE POLICY "admins delete suggestions"
ON public.suggestions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete messages"
ON public.suggestion_messages
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));