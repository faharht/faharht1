import { createFileRoute, Link, redirect, isRedirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin.functions";
import {
  LEVELS,
  BEGINNER_EXTRAS,
  INTERMEDIATE_EXTRAS,
  SENTENCE_SETS,
  type ListMeta,
} from "@/lib/trainer/levels";

export const Route = createFileRoute("/admin/sentences")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · Sentences" }] }),
  beforeLoad: async () => {
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
  component: AdminSentencesPage,
});

type Row = {
  id: string;
  list_id: string;
  ru: string;
  ru_stressed: string;
  translit: string;
  en: string;
  pl: string | null;
  de: string | null;
  sort_order: number;
};

const ALL_LISTS: ListMeta[] = [
  ...LEVELS.flatMap((l) => l.lists),
  ...BEGINNER_EXTRAS,
  ...INTERMEDIATE_EXTRAS,
  ...SENTENCE_SETS,
];

function AdminSentencesPage() {
  const [listId, setListId] = useState<string>(ALL_LISTS[0]?.id ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("sentences")
      .select("*")
      .eq("list_id", listId)
      .order("sort_order", { ascending: true });
    if (error) setError(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    load();
  }, [load]);

  const nextSort = useMemo(
    () => (rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0),
    [rows],
  );

  function startNew() {
    setError(null);
    setEditing({
      id: `${listId}-${Date.now()}`,
      list_id: listId,
      ru: "",
      ru_stressed: "",
      translit: "",
      en: "",
      pl: "",
      de: "",
      sort_order: nextSort,
    });
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    const payload = {
      ...editing,
      pl: editing.pl?.trim() ? editing.pl : null,
      de: editing.de?.trim() ? editing.de : null,
    };
    const { error } = await supabase.from("sentences").upsert(payload, { onConflict: "id" });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this sentence?")) return;
    setBusy(true);
    const { error } = await supabase.from("sentences").delete().eq("id", id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-3xl px-4 pt-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>

        <header className="mt-3 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">Admin · Sentences</h1>
          <p className="mt-1 text-xs text-white/80">Add, edit or delete sentences in any list.</p>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-foreground">List</label>
          <select
            value={listId}
            onChange={(e) => {
              setListId(e.target.value);
              setEditing(null);
            }}
            className="h-9 rounded-md border border-border/60 bg-card px-2 text-sm"
          >
            {ALL_LISTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} — {l.title}
              </option>
            ))}
          </select>
          <button
            onClick={startNew}
            className="ml-auto inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New sentence
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}

        {editing && (
          <section className="mt-4 rounded-2xl border border-primary/30 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Edit sentence</h2>
              <button
                onClick={() => setEditing(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="ID" value={editing.id} onChange={(v) => setEditing({ ...editing, id: v })} />
              <Field
                label="Sort order"
                type="number"
                value={String(editing.sort_order)}
                onChange={(v) => setEditing({ ...editing, sort_order: Number(v) || 0 })}
              />
              <Field label="Russian" value={editing.ru} onChange={(v) => setEditing({ ...editing, ru: v })} />
              <Field
                label="Russian (stressed)"
                value={editing.ru_stressed}
                onChange={(v) => setEditing({ ...editing, ru_stressed: v })}
              />
              <Field
                label="Transliteration"
                value={editing.translit}
                onChange={(v) => setEditing({ ...editing, translit: v })}
              />
              <Field label="English" value={editing.en} onChange={(v) => setEditing({ ...editing, en: v })} />
              <Field
                label="Polish"
                value={editing.pl ?? ""}
                onChange={(v) => setEditing({ ...editing, pl: v })}
              />
              <Field
                label="German"
                value={editing.de ?? ""}
                onChange={(v) => setEditing({ ...editing, de: v })}
              />
            </div>
            <button
              onClick={save}
              disabled={busy}
              className="mt-4 inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
          {loading ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">No sentences in this list.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start gap-2 py-2">
                  <span className="w-8 shrink-0 pt-1 text-right text-[10px] text-muted-foreground">
                    {r.sort_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.ru}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.en}</p>
                  </div>
                  <button
                    onClick={() => setEditing(r)}
                    className="rounded-md border border-border/60 px-2 py-1 text-[11px] font-semibold hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-border/60 bg-background px-2 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}
