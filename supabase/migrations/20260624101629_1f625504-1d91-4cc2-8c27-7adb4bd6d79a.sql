
-- 1) Avatars storage: scope reads to owner folder
DROP POLICY IF EXISTS "avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "anyone can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "avatars read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are accessible" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;

CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2) user_roles: explicit admin-only INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "admins insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins delete user_roles" ON public.user_roles;

CREATE POLICY "admins insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "admins delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated.
-- Trigger functions don't need EXECUTE for end users (triggers run as table owner).
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies; keep it callable by authenticated only.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
