import { useEffect, useRef, useState } from "react";
import { Camera, Crown, Loader2, Pencil } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileQueryOptions } from "@/lib/userQueries";
import { ProBadge } from "@/components/ProBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

function defaultUsernameFromEmail(email: string | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .slice(0, 40);
}

export function AvatarUploader({
  userId,
  email,
  fallbackChar,
  isPro = false,
}: {
  userId: string;
  email: string | null;
  fallbackChar: string;
  isPro?: boolean;
}) {

  const queryClient = useQueryClient();
  const { data: profile } = useQuery(profileQueryOptions(userId));
  const avatarPath = profile?.avatarPath ?? null;
  const signedUrl = profile?.avatarUrl ?? null;
  const displayName = profile?.displayName ?? null;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const autofilledRef = useRef(false);

  // Auto-set username from email on first load if profile has none yet.
  useEffect(() => {
    if (autofilledRef.current) return;
    if (!profile) return; // wait until profile has loaded at least once
    if (displayName && displayName.trim()) return;
    const seed = defaultUsernameFromEmail(email);
    if (!seed) return;
    autofilledRef.current = true;
    (async () => {
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: seed }, { onConflict: "id" });
      if (pErr) return;
      queryClient.setQueryData(profileQueryOptions(userId).queryKey, {
        displayName: seed,
        avatarPath,
        avatarUrl: signedUrl,
      });
    })();
  }, [profile, displayName, email, userId, avatarPath, signedUrl, queryClient]);

  function openEdit() {
    setNameDraft(displayName ?? defaultUsernameFromEmail(email));
    setError(null);
    setDialogOpen(true);
  }

  async function uploadPicture(file: File) {
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
      await supabase.storage
        .from("avatars")
        .remove([avatarPath])
        .catch(() => {});
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: path }, { onConflict: "id" });
    if (pErr) {
      setError(pErr.message);
      setBusy(false);
      return;
    }
    const { data: s } = await supabase.storage.from("avatars").createSignedUrl(path, SIGNED_URL_TTL);
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, {
      displayName,
      avatarPath: path,
      avatarUrl: s?.signedUrl ?? null,
    });
    setBusy(false);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadPicture(file);
  }

  async function saveName() {
    const trimmed = nameDraft.trim().slice(0, 40);
    if (!trimmed) {
      setError("Username can't be empty.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, display_name: trimmed }, { onConflict: "id" });
    if (pErr) {
      setError(pErr.message);
      setBusy(false);
      return;
    }
    queryClient.setQueryData(profileQueryOptions(userId).queryKey, {
      displayName: trimmed,
      avatarPath,
      avatarUrl: signedUrl,
    });
    setBusy(false);
    setDialogOpen(false);
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
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-sm font-semibold text-foreground">
            {displayName?.trim() || defaultUsernameFromEmail(email) || "Set a username"}
          </div>
          <button
            type="button"
            onClick={openEdit}
            aria-label="Edit profile"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your username and profile picture.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-violet-100 text-xl font-semibold text-violet-700">
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
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5" />
                Change picture
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-foreground">
                Username
              </label>
              <input
                id="username"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={40}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Your name"
              />
              <p className="text-[11px] text-muted-foreground">Up to 40 characters.</p>
            </div>

            {error && <div className="text-[11px] text-rose-700">{error}</div>}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveName}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
