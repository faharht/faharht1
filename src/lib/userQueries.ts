import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SessionUser = {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
} | null;

export const sessionUserQueryOptions = queryOptions({
  queryKey: ["sessionUser"],
  queryFn: async (): Promise<SessionUser> => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email ?? null,
      emailConfirmed: !!data.user.email_confirmed_at,
    };
  },
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});

const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

export type ProfileData = {
  displayName: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
};

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", userId)
        .maybeSingle();
      const path = data?.avatar_url ?? null;
      let url: string | null = null;
      if (path) {
        const { data: s } = await supabase.storage
          .from("avatars")
          .createSignedUrl(path, SIGNED_URL_TTL);
        url = s?.signedUrl ?? null;
      }
      return {
        displayName: data?.display_name ?? null,
        avatarPath: path,
        avatarUrl: url,
      };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
