import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThreadView, type Thread } from "@/components/Suggestions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin — Russian Master" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
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

  useEffect(() => {
    if (isAdmin) loadThreads();
  }, [isAdmin, loadThreads]);

  async function deleteThread(th: Thread, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete chat "${th.subject}"? This cannot be undone.`)) return;
    setDeletingId(th.id);
    const { error } = await supabase.from("suggestions").delete().eq("id", th.id);
    setDeletingId(null);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadThreads();
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

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <header className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-orange-600 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">Admin · Suggestions</h1>
          <p className="mt-1 text-xs text-white/80">All user suggestion threads. Reply or delete.</p>
        </header>

        {active ? (
          <ThreadView
            thread={active}
            userId={userId!}
            onBack={() => {
              setActive(null);
              loadThreads();
            }}
            onDeleted={loadThreads}
            isAdminContext
          />
        ) : (
          <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            {threads.length === 0 ? (
              <p className="text-xs text-muted-foreground">No suggestions yet.</p>
            ) : (
              <ul className="space-y-2">
                {threads.map((th) => (
                  <li
                    key={th.id}
                    className="flex items-stretch gap-2 rounded-xl border border-border/60 bg-background/60 transition hover:border-primary/50"
                  >
                    <button
                      onClick={() => setActive(th)}
                      className="min-w-0 flex-1 p-3 text-left"
                    >
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
                    </button>
                    <button
                      onClick={(e) => deleteThread(th, e)}
                      disabled={deletingId === th.id}
                      title="Delete chat"
                      aria-label="Delete chat"
                      className="my-2 mr-2 inline-flex w-9 shrink-0 items-center justify-center rounded-md border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
