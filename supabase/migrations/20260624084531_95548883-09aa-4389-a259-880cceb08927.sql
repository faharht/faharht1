
-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by owner or admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "profiles insert own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles update own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill profiles for existing users
INSERT INTO public.profiles (id)
SELECT id FROM auth.users ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SOFT DELETE on suggestions ============
ALTER TABLE public.suggestions
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX idx_suggestions_deleted_at ON public.suggestions(deleted_at);

-- Replace SELECT policy to hide deleted threads from regular users
DROP POLICY IF EXISTS "users view own suggestions" ON public.suggestions;
CREATE POLICY "users view own suggestions"
  ON public.suggestions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (auth.uid() = user_id AND deleted_at IS NULL)
  );

-- Replace messages SELECT to hide messages of soft-deleted threads from non-admins
DROP POLICY IF EXISTS "view messages in own thread" ON public.suggestion_messages;
CREATE POLICY "view messages in own thread"
  ON public.suggestion_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.suggestions s
      WHERE s.id = suggestion_messages.suggestion_id
        AND s.user_id = auth.uid()
        AND s.deleted_at IS NULL
    )
  );

-- Block new messages on deleted threads
DROP POLICY IF EXISTS "post messages in own thread or admin" ON public.suggestion_messages;
CREATE POLICY "post messages in own thread or admin"
  ON public.suggestion_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (is_admin = false OR public.has_role(auth.uid(), 'admin'::public.app_role))
    AND EXISTS (
      SELECT 1 FROM public.suggestions s
      WHERE s.id = suggestion_messages.suggestion_id
        AND s.deleted_at IS NULL
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR s.user_id = auth.uid()
        )
    )
  );

-- ============ AUDIT LOG ============
CREATE TABLE public.suggestion_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL,
  suggestion_subject text,
  thread_owner_id uuid,
  thread_owner_email text,
  admin_id uuid NOT NULL,
  admin_email text,
  action text NOT NULL CHECK (action IN ('soft_delete','restore','hard_delete')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.suggestion_deletion_audit TO authenticated;
GRANT ALL ON public.suggestion_deletion_audit TO service_role;

ALTER TABLE public.suggestion_deletion_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read audit"
  ON public.suggestion_deletion_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins insert audit"
  ON public.suggestion_deletion_audit FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND admin_id = auth.uid()
  );

CREATE INDEX idx_suggestion_audit_created_at ON public.suggestion_deletion_audit(created_at DESC);
