import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileQueryOptions } from "@/lib/userQueries";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

export function AvatarUploader({
  userId,
  fallbackChar,
}: {
  userId: string;
  fallbackChar: string;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQueryOptions(userId));
  const avatarPath = profile?.avatarPath ?? null;
  const signedUrl = profile?.avatarUrl ?? null;
  const displayName = profile?.displayName ?? null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max image size is 5 MB.");
      return;
    }
    setError(null);
    setBusy(true);

    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    if (avatarPath && avatarPath !== path) {
      await supabase.storage.from("avatars").remove([avatarPath]).catch(() => {});
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: path }, { onConflict: "id" });
    if (pErr) {
      setError(pErr.message);
      setBusy(false);
      return;
    }
    const { data: s } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, SIGNED_URL_TTL);
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, {
      displayName,
      avatarPath: path,
      avatarUrl: s?.signedUrl ?? null,
    });
    setBusy(false);
  }

  async function removeAvatar() {
    if (!avatarPath) return;
    setBusy(true);
    await supabase.storage.from("avatars").remove([avatarPath]).catch(() => {});
    await supabase.from("profiles").upsert({ id: userId, avatar_url: null }, { onConflict: "id" });
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, {
      displayName,
      avatarPath: null,
      avatarUrl: null,
    });
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-violet-100 text-lg font-semibold text-violet-700">
          {signedUrl ? (
            <img src={signedUrl} alt="Profile picture" className="h-full w-full object-cover" />
          ) : (
            fallbackChar.toUpperCase()
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground shadow hover:bg-muted disabled:opacity-60"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {displayName?.trim() || "Set a username"}
        </div>
        <div className="text-[11px] text-muted-foreground">PNG/JPG, up to 5 MB.</div>
        {error && <div className="mt-1 text-[11px] text-rose-700">{error}</div>}
        {avatarPath && !busy && (
          <button
            onClick={removeAvatar}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 hover:underline"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
