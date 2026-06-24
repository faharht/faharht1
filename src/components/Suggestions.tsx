import { useEffect, useState, useCallback } from "react";
import { MessageSquarePlus, Send, ChevronLeft, Trash2, RotateCcw, AlertOctagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export type Thread = {
  id: string;
  subject: string;
  status: string;
  user_email?: string | null;
  user_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

type Msg = {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
};

export const MAX_USER_THREADS = 2;
export const RESTORE_WINDOW_DAYS = 14;

async function logAudit(
  adminId: string,
  adminEmail: string | null,
  thread: Thread,
  action: "soft_delete" | "restore" | "hard_delete",
) {
  await supabase.from("suggestion_deletion_audit").insert({
    suggestion_id: thread.id,
    suggestion_subject: thread.subject,
    thread_owner_id: thread.user_id ?? null,
    thread_owner_email: thread.user_email ?? null,
    admin_id: adminId,
    admin_email: adminEmail,
    action,
  });
}

export function UserSuggestions() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
      setLoadingUser(false);
    });
  }, []);

  const loadThreads = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("updated_at", { ascending: false });
    setThreads((data as Thread[]) ?? []);
  }, [userId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  if (loadingUser) {
    return (
      <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </section>
    );
  }

  if (!userId) {
    return (
      <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Suggestions</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to send suggestions to the admin.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signin" }}
          className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (active) {
    return (
      <ThreadView
        thread={active}
        userId={userId}
        userEmail={userEmail}
        onBack={() => {
          setActive(null);
          loadThreads();
        }}
        isAdminContext={false}
      />
    );
  }

  const atLimit = threads.length >= MAX_USER_THREADS;
  const remaining = Math.max(0, MAX_USER_THREADS - threads.length);
  const counterTone = atLimit
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : remaining === 1
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return (
    <>
      <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Suggestions</h2>
              <span
                aria-label={`${threads.length} of ${MAX_USER_THREADS} chats used`}
                className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold ${counterTone}`}
              >
                {threads.length}/{MAX_USER_THREADS} chats
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {atLimit
                ? "You've reached the limit. Wait for the admin to close one."
                : `${remaining} slot${remaining === 1 ? "" : "s"} left.`}
            </p>
          </div>
          <button
            onClick={() => setComposeOpen(true)}
            disabled={atLimit}
            title={atLimit ? `Limit of ${MAX_USER_THREADS} chats reached` : "New suggestion"}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New
          </button>
        </div>

        {threads.length === 0 ? (
          <p className="mt-4 text-xs text-muted-foreground">No suggestions yet. Tap "New" to send one to the admin.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {threads.map((th) => (
              <li key={th.id}>
                <button
                  onClick={() => setActive(th)}
                  className="w-full rounded-xl border border-border/60 bg-background/60 p-3 text-left transition hover:border-primary/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{th.subject}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {th.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Updated {new Date(th.updated_at).toLocaleString()}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {composeOpen && !atLimit && (
        <ComposeDialog
          userId={userId}
          userEmail={userEmail}
          existingCount={threads.length}
          onClose={() => setComposeOpen(false)}
          onCreated={async (thread) => {
            setComposeOpen(false);
            await loadThreads();
            setActive(thread);
          }}
        />
      )}
    </>
  );
}

function ComposeDialog({
  userId,
  userEmail,
  existingCount,
  onClose,
  onCreated,
}: {
  userId: string;
  userEmail: string | null;
  existingCount: number;
  onClose: () => void;
  onCreated: (t: Thread) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (existingCount >= MAX_USER_THREADS) {
      setError(`You already have ${MAX_USER_THREADS} active chats.`);
      return;
    }
    setBusy(true);
    setError(null);

    const { count } = await supabase
      .from("suggestions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);
    if ((count ?? 0) >= MAX_USER_THREADS) {
      setBusy(false);
      setError(`You already have ${MAX_USER_THREADS} active chats.`);
      return;
    }

    const { data, error } = await supabase
      .from("suggestions")
      .insert({ user_id: userId, user_email: userEmail, subject: subject.trim() })
      .select()
      .single();
    if (error || !data) {
      setError(error?.message ?? "Failed to create");
      setBusy(false);
      return;
    }
    const { error: mErr } = await supabase.from("suggestion_messages").insert({
      suggestion_id: data.id,
      user_id: userId,
      body: body.trim(),
      is_admin: false,
    });
    setBusy(false);
    if (mErr) {
      setError(mErr.message);
      return;
    }
    onCreated(data as Thread);
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-xl"
      >
        <h3 className="text-base font-semibold">New suggestion</h3>
        <p className="mt-1 text-xs text-muted-foreground">Send a message to the admin. They'll reply here.</p>
        <label className="mt-4 block text-xs font-medium">Subject</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={120}
          className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <label className="mt-3 block text-xs font-medium">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={4000}
          rows={5}
          className="mt-1 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-border/60 bg-background px-3 text-xs font-medium hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

function daysUntilHardDelete(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime();
  const expires = deleted + RESTORE_WINDOW_DAYS * 86400_000;
  const diff = expires - Date.now();
  return Math.max(0, Math.ceil(diff / 86400_000));
}

export function ThreadView({
  thread,
  userId,
  userEmail,
  onBack,
  isAdminContext,
  onChanged,
}: {
  thread: Thread;
  userId: string;
  userEmail?: string | null;
  onBack: () => void;
  isAdminContext: boolean;
  onChanged?: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState<null | "soft" | "restore" | "hard">(null);
  const isDeleted = !!thread.deleted_at;

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("suggestion_messages")
      .select("*")
      .eq("suggestion_id", thread.id)
      .order("created_at", { ascending: true });
    setMessages((data as Msg[]) ?? []);
  }, [thread.id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`thread-${thread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "suggestion_messages", filter: `suggestion_id=eq.${thread.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [thread.id, load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || isDeleted) return;
    setBusy(true);
    const { error } = await supabase.from("suggestion_messages").insert({
      suggestion_id: thread.id,
      user_id: userId,
      body: body.trim(),
      is_admin: isAdminContext,
    });
    setBusy(false);
    if (!error) {
      setBody("");
      load();
    }
  }

  async function doSoftDelete() {
    setWorking(true);
    const { error } = await supabase
      .from("suggestions")
      .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq("id", thread.id);
    if (!error) await logAudit(userId, userEmail ?? null, thread, "soft_delete");
    setWorking(false);
    setConfirm(null);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    onChanged?.();
    onBack();
  }

  async function doRestore() {
    setWorking(true);
    const { error } = await supabase
      .from("suggestions")
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", thread.id);
    if (!error) await logAudit(userId, userEmail ?? null, thread, "restore");
    setWorking(false);
    setConfirm(null);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    onChanged?.();
    onBack();
  }

  async function doHardDelete() {
    setWorking(true);
    // log first (row still exists)
    await logAudit(userId, userEmail ?? null, thread, "hard_delete");
    const { error } = await supabase.from("suggestions").delete().eq("id", thread.id);
    setWorking(false);
    setConfirm(null);
    if (error) {
      alert(`Failed: ${error.message}`);
      return;
    }
    onChanged?.();
    onBack();
  }

  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onBack} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 bg-background px-2 text-xs hover:bg-muted">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{thread.subject}</h2>
        {isAdminContext && !isDeleted && (
          <button
            onClick={() => setConfirm("soft")}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
        {isAdminContext && isDeleted && (
          <>
            <button
              onClick={() => setConfirm("restore")}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restore
            </button>
            <button
              onClick={() => setConfirm("hard")}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-400 bg-rose-100 px-2 text-xs font-medium text-rose-800 hover:bg-rose-200"
            >
              <AlertOctagon className="h-3.5 w-3.5" /> Delete forever
            </button>
          </>
        )}
      </div>

      {isDeleted && thread.deleted_at && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            Soft-deleted on {new Date(thread.deleted_at).toLocaleString()} ·{" "}
            <strong>{daysUntilHardDelete(thread.deleted_at)}</strong> day(s) left to restore before permanent deletion.
          </div>
        </div>
      )}

      <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto rounded-lg bg-muted/30 p-3">
        {messages.map((m) => {
          const mine = isAdminContext ? m.is_admin : !m.is_admin;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-card text-foreground border border-border/60"
                }`}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-70">
                  {m.is_admin ? "Admin" : "User"} · {new Date(m.created_at).toLocaleString()}
                </div>
                <div className="whitespace-pre-wrap">{m.body}</div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">No messages yet.</p>
        )}
      </div>

      {!isDeleted && (
        <form onSubmit={send} className="mt-3 flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            maxLength={4000}
            placeholder={isAdminContext ? "Reply as admin…" : "Write a reply…"}
            className="min-w-0 flex-1 rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="inline-flex h-10 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      )}

      {confirm === "soft" && (
        <ConfirmDialog
          title="Delete this chat?"
          message={
            <>
              The conversation will be moved to <strong>Deleted</strong> and can be restored within{" "}
              {RESTORE_WINDOW_DAYS} days. After that it is removed permanently.
            </>
          }
          confirmLabel="Delete"
          destructive
          busy={working}
          onConfirm={doSoftDelete}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === "restore" && (
        <ConfirmDialog
          title="Restore this chat?"
          message="The user will see this conversation again and be able to reply."
          confirmLabel="Restore"
          busy={working}
          onConfirm={doRestore}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === "hard" && (
        <ConfirmDialog
          title="Permanently delete this chat?"
          message="All messages will be erased forever. This cannot be undone."
          confirmLabel="Delete forever"
          destructive
          busy={working}
          onConfirm={doHardDelete}
          onClose={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
