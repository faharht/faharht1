import { createFileRoute, Link, redirect, useNavigate, isRedirect } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, ShieldAlert, Trash2, RotateCcw, AlertOctagon, ClipboardList, MessagesSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThreadView, type Thread, RESTORE_WINDOW_DAYS } from "@/components/Suggestions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Russian Master" }] }),
  beforeLoad: async () => {
    // Server-side admin gate: requireSupabaseAuth validates the bearer token,
    // then has_role() checks the admin role. UI-level dev-tools toggles
    // cannot reach this check.
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) throw redirect({ to: "/auth" });
    try {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) throw redirect({ to: "/" });
    } catch (err) {
      if (isRedirect(err)) throw err;
      throw redirect({ to: "/" });
    }

  },
  component: AdminPage,
});


type AuditEntry = {
  id: string;
  suggestion_id: string;
  suggestion_subject: string | null;
  thread_owner_email: string | null;
  admin_email: string | null;
  action: string;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"active" | "deleted" | "audit">("active");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [confirmThread, setConfirmThread] = useState<{ thread: Thread; mode: "soft" | "restore" | "hard" } | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      setUserEmail(data.user?.email ?? null);
      if (!uid) {
        setIsAdmin(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin");
      setIsAdmin((roles?.length ?? 0) > 0);
    })();
  }, []);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .order("updated_at", { ascending: false });
    setThreads((data as Thread[]) ?? []);
  }, []);

  const loadAudit = useCallback(async () => {
    const { data } = await supabase
      .from("suggestion_deletion_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setAudit((data as AuditEntry[]) ?? []);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadThreads();
    loadAudit();
  }, [isAdmin, loadThreads, loadAudit]);

  async function doAction() {
    if (!confirmThread || !userId) return;
    const { thread, mode } = confirmThread;
    setWorking(true);
    const auditInsert = (action: "soft_delete" | "restore" | "hard_delete") =>
      supabase.from("suggestion_deletion_audit").insert({
        suggestion_id: thread.id,
        suggestion_subject: thread.subject,
        thread_owner_id: thread.user_id ?? null,
        thread_owner_email: thread.user_email ?? null,
        admin_id: userId,
        admin_email: userEmail,
        action,
      });

    let err: { message: string } | null = null;
    if (mode === "soft") {
      const { error } = await supabase
        .from("suggestions")
        .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
        .eq("id", thread.id);
      err = error;
      if (!err) await auditInsert("soft_delete");
    } else if (mode === "restore") {
      const { error } = await supabase
        .from("suggestions")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", thread.id);
      err = error;
      if (!err) await auditInsert("restore");
    } else {
      await auditInsert("hard_delete");
      const { error } = await supabase.from("suggestions").delete().eq("id", thread.id);
      err = error;
    }
    setWorking(false);
    setConfirmThread(null);
    if (err) {
      alert(`Failed: ${err.message}`);
      return;
    }
    loadThreads();
    loadAudit();
  }

  if (isAdmin === null) {
    return <div className="min-h-screen bg-[oklch(0.985_0.008_180)] p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
        <main className="mx-auto max-w-2xl px-4 pt-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <ShieldAlert className="mx-auto h-6 w-6 text-rose-600" />
            <h1 className="mt-2 text-lg font-semibold text-rose-700">Access denied</h1>
            <p className="mt-1 text-xs text-rose-600">This area is restricted to administrators.</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Go home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const activeThreads = threads.filter((t) => !t.deleted_at);
  const deletedThreads = threads.filter((t) => t.deleted_at);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <header className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">Admin · Suggestions</h1>
          <p className="mt-1 text-xs text-white/80">Reply, soft-delete, restore, or audit chat deletions.</p>
          <Link
            to="/admin/sentences"
            className="mt-3 inline-flex h-8 items-center rounded-md bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
          >
            Manage sentences →
          </Link>
        </header>


        {active ? (
          <ThreadView
            thread={active}
            userId={userId!}
            userEmail={userEmail}
            onBack={() => {
              setActive(null);
              loadThreads();
              loadAudit();
            }}
            onChanged={() => {
              loadThreads();
              loadAudit();
            }}
            isAdminContext
          />
        ) : (
          <>
            <div className="mt-5 flex gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm">
              <TabButton active={tab === "active"} onClick={() => setTab("active")} icon={MessagesSquare} label={`Active (${activeThreads.length})`} />
              <TabButton active={tab === "deleted"} onClick={() => setTab("deleted")} icon={Trash2} label={`Deleted (${deletedThreads.length})`} />
              <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={ClipboardList} label="Audit log" />
            </div>

            {tab === "active" && (
              <ThreadList
                threads={activeThreads}
                onOpen={setActive}
                onDelete={(th) => setConfirmThread({ thread: th, mode: "soft" })}
                kind="active"
              />
            )}
            {tab === "deleted" && (
              <ThreadList
                threads={deletedThreads}
                onOpen={setActive}
                onRestore={(th) => setConfirmThread({ thread: th, mode: "restore" })}
                onHardDelete={(th) => setConfirmThread({ thread: th, mode: "hard" })}
                kind="deleted"
              />
            )}
            {tab === "audit" && <AuditList entries={audit} />}
          </>
        )}
      </main>

      {confirmThread && (
        <ConfirmDialog
          title={
            confirmThread.mode === "soft"
              ? "Delete this chat?"
              : confirmThread.mode === "restore"
                ? "Restore this chat?"
                : "Permanently delete this chat?"
          }
          message={
            confirmThread.mode === "soft" ? (
              <>
                "<strong>{confirmThread.thread.subject}</strong>" will be moved to Deleted and can be restored within{" "}
                {RESTORE_WINDOW_DAYS} days. This action is logged.
              </>
            ) : confirmThread.mode === "restore" ? (
              <>The user will see this chat again and be able to reply. This action is logged.</>
            ) : (
              <>This will erase all messages forever. This cannot be undone.</>
            )
          }
          confirmLabel={
            confirmThread.mode === "soft" ? "Delete" : confirmThread.mode === "restore" ? "Restore" : "Delete forever"
          }
          destructive={confirmThread.mode !== "restore"}
          busy={working}
          onConfirm={doAction}
          onClose={() => setConfirmThread(null)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ThreadList({
  threads,
  onOpen,
  onDelete,
  onRestore,
  onHardDelete,
  kind,
}: {
  threads: Thread[];
  onOpen: (t: Thread) => void;
  onDelete?: (t: Thread) => void;
  onRestore?: (t: Thread) => void;
  onHardDelete?: (t: Thread) => void;
  kind: "active" | "deleted";
}) {
  if (threads.length === 0) {
    return (
      <section className="mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">
          {kind === "active" ? "No active suggestions." : "Nothing in the trash."}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <ul className="space-y-2">
        {threads.map((th) => {
          const daysLeft =
            th.deleted_at
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(th.deleted_at).getTime() + RESTORE_WINDOW_DAYS * 86400_000 - Date.now()) / 86400_000,
                  ),
                )
              : null;
          return (
            <li
              key={th.id}
              className="flex items-stretch gap-2 rounded-xl border border-border/60 bg-background/60 transition hover:border-primary/50"
            >
              <button onClick={() => onOpen(th)} className="min-w-0 flex-1 p-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{th.subject}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {th.status}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {th.user_email ?? (th.user_id ?? "").slice(0, 8)} · Updated{" "}
                  {new Date(th.updated_at).toLocaleString()}
                </div>
                {kind === "deleted" && daysLeft !== null && (
                  <div className="mt-1 text-[11px] font-medium text-amber-700">
                    {daysLeft} day(s) left to restore
                  </div>
                )}
              </button>
              <div className="my-2 mr-2 flex flex-col gap-1">
                {kind === "active" && onDelete && (
                  <button
                    onClick={() => onDelete(th)}
                    title="Delete chat"
                    aria-label="Delete chat"
                    className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {kind === "deleted" && onRestore && (
                  <button
                    onClick={() => onRestore(th)}
                    title="Restore"
                    aria-label="Restore chat"
                    className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                {kind === "deleted" && onHardDelete && (
                  <button
                    onClick={() => onHardDelete(th)}
                    title="Delete forever"
                    aria-label="Delete forever"
                    className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-rose-400 bg-rose-100 text-rose-800 hover:bg-rose-200"
                  >
                    <AlertOctagon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">No deletion events recorded yet.</p>
      </section>
    );
  }
  const tone: Record<string, string> = {
    soft_delete: "bg-rose-100 text-rose-700",
    restore: "bg-emerald-100 text-emerald-700",
    hard_delete: "bg-rose-200 text-rose-900",
  };
  const label: Record<string, string> = {
    soft_delete: "Soft delete",
    restore: "Restore",
    hard_delete: "Hard delete",
  };
  return (
    <section className="mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Deletion audit log</h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground">Most recent 200 events.</p>
      <ul className="mt-3 space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  tone[e.action] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {label[e.action] ?? e.action}
              </span>
              <span className="truncate text-sm font-semibold">{e.suggestion_subject ?? "(no subject)"}</span>
            </div>
            <div className="mt-1 grid gap-0.5 text-[11px] text-muted-foreground">
              <div>
                <strong>Admin:</strong> {e.admin_email ?? "unknown"}
              </div>
              <div>
                <strong>Thread owner:</strong> {e.thread_owner_email ?? "unknown"}
              </div>
              <div>
                <strong>When:</strong> {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
