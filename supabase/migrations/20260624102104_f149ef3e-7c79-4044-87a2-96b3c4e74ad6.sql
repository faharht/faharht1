
-- 1) suggestion_email_spoof: server-populated user_email
CREATE OR REPLACE FUNCTION public.set_suggestion_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  SELECT email INTO NEW.user_email FROM auth.users WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_suggestion_user_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS suggestions_set_user_email_insert ON public.suggestions;
DROP TRIGGER IF EXISTS suggestions_set_user_email_update ON public.suggestions;

CREATE TRIGGER suggestions_set_user_email_insert
BEFORE INSERT ON public.suggestions
FOR EACH ROW EXECUTE FUNCTION public.set_suggestion_user_email();

CREATE TRIGGER suggestions_set_user_email_update
BEFORE UPDATE OF user_email, user_id ON public.suggestions
FOR EACH ROW EXECUTE FUNCTION public.set_suggestion_user_email();

-- 2) admin_email_hardcoded: rewrite the signup-role trigger to drop the hardcoded email.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
