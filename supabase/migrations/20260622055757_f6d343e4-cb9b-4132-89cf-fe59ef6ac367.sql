DROP POLICY IF EXISTS "post messages in own thread or admin" ON public.suggestion_messages;
CREATE POLICY "post messages in own thread or admin"
ON public.suggestion_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (is_admin = false OR public.has_role(auth.uid(), 'admin'::public.app_role))
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.suggestions s
      WHERE s.id = suggestion_messages.suggestion_id
        AND s.user_id = auth.uid()
    )
  )
);