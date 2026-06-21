import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MessageSquarePlus, Send, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/utilities")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Utilities — Russian Master" },
      { name: "description", content: "Submit suggestions and chat with the admin." },
    ],
  }),
  component: UtilitiesPage,
});

type Thread = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};
type Msg = {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
};

function UtilitiesPage() {
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
    return <div className="min-h-screen bg-[oklch(0.985_0.008_180)] p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
        <main className="mx-auto max-w-2xl px-4 pt-6">
          <BackToHome />
          <div className="mt-6 rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold">Sign in to submit suggestions</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Your conversations with the admin are linked to your account.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <BackToHome />
        <header className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">Utilities</h1>
          <p className="mt-1 text-xs text-white/80">Send suggestions, ideas, or report issues. The admin will reply here.</p>
        </header>

        {active ? (
          <ThreadView
            thread={active}
            userId={userId}
            onBack={() => {
              setActive(null);
              loadThreads();
            }}
            isAdminContext={false}
          />
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Your suggestions</h2>
                <button
                  onClick={() => setComposeOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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

            {composeOpen && (
              <ComposeDialog
                userId={userId}
                userEmail={userEmail}
                onClose={() => setComposeOpen(false)}
                onCreated={async (thread) => {
                  setComposeOpen(false);
                  await loadThreads();
                  setActive(thread);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function BackToHome() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Home
    </Link>
  );
}

function ComposeDialog({
  userId,
  userEmail,
  onClose,
  onCreated,
}: {
  userId: string;
  userEmail: string | null;
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
    setBusy(true);
    setError(null);
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

export function ThreadView({
  thread,
  userId,
  onBack,
  isAdminContext,
}: {
  thread: Thread;
  userId: string;
  onBack: () => void;
  isAdminContext: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (!body.trim()) return;
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

  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="inline-flex h-8 items-center gap-1 rounded-md border border-border/60 bg-background px-2 text-xs hover:bg-muted">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h2 className="truncate text-sm font-semibold">{thread.subject}</h2>
      </div>

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
    </section>
  );
}
