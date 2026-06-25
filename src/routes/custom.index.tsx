import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Plus, Crown, Sparkles, Trash2, ChevronRight, ListChecks } from "lucide-react";
import { toast } from "sonner";
import {
  listMySets,
  getMyUsage,
  createCustomSet,
  deleteCustomSet,
  type CustomSet,
  type UsageInfo,
} from "@/lib/customSets.functions";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/custom/")({
  head: () => ({
    meta: [{ title: "My sets — RussianFlow" }],
  }),
  component: CustomIndex,
});

function CustomIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMySets);
  const usageFn = useServerFn(getMyUsage);
  const createFn = useServerFn(createCustomSet);
  const deleteFn = useServerFn(deleteCustomSet);

  const sets = useQuery({ queryKey: ["customSets"], queryFn: () => list() });
  const usage = useQuery({ queryKey: ["customUsage"], queryFn: () => usageFn() });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<CustomSet | null>(null);

  const createMut = useMutation({
    mutationFn: async () => createFn({ data: { title: title.trim() } }),
    onSuccess: (row) => {
      setOpen(false);
      setTitle("");
      qc.invalidateQueries({ queryKey: ["customSets"] });
      qc.invalidateQueries({ queryKey: ["customUsage"] });
      navigate({ to: "/custom/$setId", params: { setId: row.id } });
    },
    onError: (err: Error & { message?: string }) => {
      const msg = err.message ?? "";
      if (msg.includes("SET_LIMIT_REACHED")) {
        toast.error("Free plan allows 1 custom set. Upgrade to Pro for unlimited.");
      } else {
        toast.error("Could not create set");
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customSets"] });
      qc.invalidateQueries({ queryKey: ["customUsage"] });
      setConfirmDelete(null);
      toast.success("Set deleted");
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 pb-8 pt-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/70">Your library</div>
            <h1 className="text-xl font-bold">My sets</h1>
          </div>
        </div>
        {usage.data && <UsagePill usage={usage.data} />}
      </header>

      <main className="mx-auto -mt-4 max-w-2xl px-4">
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-600">
            <Plus className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-slate-900">Create new set</div>
            <p className="mt-0.5 text-xs text-slate-500">Write sentences in any language — we translate them</p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>

        {usage.data && !usage.data.isPro && (
          <Link
            to="/pricing"
            className="mt-3 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-4 py-4 text-white shadow-sm"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white/25">
              <Crown className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold">Upgrade to Pro</div>
              <p className="mt-0.5 text-xs text-white/90">Unlimited sets & sentences — from $2.99/mo</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/90" />
          </Link>
        )}

        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-bold text-slate-900">Your sets</h2>
          {sets.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {sets.data?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
              <ListChecks className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-700">No custom sets yet</p>
              <p className="mt-1 text-xs text-slate-500">Create one above to get started.</p>
            </div>
          )}
          <div className="space-y-3">
            {sets.data?.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm">
                <Link
                  to="/custom/$setId"
                  params={{ setId: s.id }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-900">{s.title}</div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{s.description ?? "Custom set"}</p>
                  </div>
                </Link>
                <button
                  onClick={() => setConfirmDelete(s)}
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Delete set"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new set</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Set name (e.g. Travel basics)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={!title.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this set?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" and all its sentences will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UsagePill({ usage }: { usage: UsageInfo }) {
  const sLabel = usage.sentencesLimit === null
    ? `${usage.sentencesToday} today · Unlimited`
    : `${usage.sentencesToday}/${usage.sentencesLimit} sentences today`;
  const setLabel = usage.setsLimit === null
    ? `${usage.setsUsed} sets · Unlimited`
    : `${usage.setsUsed}/${usage.setsLimit} sets`;
  return (
    <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center gap-2 text-xs">
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold backdrop-blur",
        usage.isPro ? "bg-amber-300/30 text-amber-50" : "bg-white/20 text-white",
      )}>
        {usage.isPro ? <Crown className="h-3.5 w-3.5" /> : null}
        {usage.isPro ? "Pro" : "Free plan"}
      </span>
      <span className="rounded-full bg-white/15 px-3 py-1 text-white/90 backdrop-blur">{sLabel}</span>
      <span className="rounded-full bg-white/15 px-3 py-1 text-white/90 backdrop-blur">{setLabel}</span>
    </div>
  );
}
