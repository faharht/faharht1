import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Play, Plus, Trash2, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getCustomSet,
  getMyUsage,
  addCustomSentence,
  deleteCustomSentence,
} from "@/lib/customSets.functions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { listIdForCustomSet } from "@/lib/trainer/sentences";

export const Route = createFileRoute("/custom/$setId")({
  head: () => ({
    meta: [{ title: "Edit set — RussianFlow" }],
  }),
  component: SetEditor,
});

function SetEditor() {
  const { setId } = Route.useParams();
  const qc = useQueryClient();
  const getSet = useServerFn(getCustomSet);
  const usageFn = useServerFn(getMyUsage);
  const addFn = useServerFn(addCustomSentence);
  const delFn = useServerFn(deleteCustomSentence);

  const setQ = useQuery({
    queryKey: ["customSet", setId, "full"],
    queryFn: () => getSet({ data: { id: setId } }),
  });
  const usage = useQuery({ queryKey: ["customUsage"], queryFn: () => usageFn() });

  const [text, setText] = useState("");
  const [batchMode, setBatchMode] = useState(false);

  const addMut = useMutation({
    mutationFn: async (sentence: string) => addFn({ data: { setId, text: sentence } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customSet", setId, "full"] });
      qc.invalidateQueries({ queryKey: ["customUsage"] });
      qc.invalidateQueries({ queryKey: ["sentences", listIdForCustomSet(setId)] });
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customSet", setId, "full"] });
      qc.invalidateQueries({ queryKey: ["sentences", listIdForCustomSet(setId)] });
      toast.success("Sentence removed");
    },
  });

  const handleAdd = async () => {
    const lines = batchMode
      ? text.split("\n").map((l) => l.trim()).filter(Boolean)
      : [text.trim()].filter(Boolean);
    if (!lines.length) return;
    let added = 0;
    let stopped = false;
    for (const line of lines) {
      try {
        await addMut.mutateAsync(line);
        added += 1;
      } catch (e) {
        const msg = (e as Error).message ?? "";
        if (msg.includes("QUOTA_EXCEEDED")) {
          toast.error("Daily limit reached. Upgrade to Pro for unlimited.");
          stopped = true;
          break;
        }
        if (msg.includes("RATE_LIMITED")) {
          toast.error("Translation service is busy, try again in a moment.");
          stopped = true;
          break;
        }
        if (msg.includes("CREDITS_EXHAUSTED")) {
          toast.error("Translation service is temporarily unavailable.");
          stopped = true;
          break;
        }
        toast.error("Could not add sentence");
        stopped = true;
        break;
      }
    }
    if (added > 0) {
      setText("");
      toast.success(`Added ${added} sentence${added > 1 ? "s" : ""}`);
    }
    if (stopped && added === 0) {
      // already toasted
    }
  };

  const set = setQ.data?.set;
  const sentences = setQ.data?.sentences ?? [];

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 pb-6 pt-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Link to="/custom" className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-white/70">Custom set</div>
            <h1 className="truncate text-xl font-bold">{set?.title ?? "Loading…"}</h1>
          </div>
          {sentences.length > 0 && (
            <Link
              to="/list/$listId"
              params={{ listId: listIdForCustomSet(setId) }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur"
            >
              <Play className="h-3.5 w-3.5" />
              Train
            </Link>
          )}
        </div>
        {usage.data && (
          <p className="mx-auto mt-4 max-w-2xl text-xs text-white/85">
            {usage.data.isPro
              ? `${sentences.length} sentences · Pro (unlimited)`
              : `${usage.data.sentencesToday}/${usage.data.sentencesLimit} sentences added today · ${sentences.length} in this set`}
          </p>
        )}
      </header>

      <main className="mx-auto -mt-4 max-w-2xl space-y-4 px-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">
              {batchMode ? "Batch add (one per line)" : "Add a sentence"}
            </label>
            <button
              type="button"
              onClick={() => setBatchMode((b) => !b)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              {batchMode ? "Single mode" : "Batch mode"}
            </button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              batchMode
                ? "I love you\nThe weather is nice\nWhere is the metro?"
                : "Write in any language — auto-translated to Russian"
            }
            rows={batchMode ? 5 : 3}
            maxLength={batchMode ? 5000 : 500}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Translated to RU (with stress + transliteration), EN, DE, PL.
            </p>
            <Button onClick={handleAdd} disabled={!text.trim() || addMut.isPending}>
              {addMut.isPending ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Translating…</>
              ) : (
                <><Plus className="mr-1 h-4 w-4" />Add</>
              )}
            </Button>
          </div>
          {usage.data && !usage.data.isPro && usage.data.sentencesToday >= (usage.data.sentencesLimit ?? 5) && (
            <Link
              to="/pricing"
              className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Crown className="h-3.5 w-3.5" />
              Daily limit reached — upgrade to Pro for unlimited
            </Link>
          )}
        </div>

        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-slate-900">
            Sentences ({sentences.length})
          </h2>
          {sentences.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No sentences yet — add your first above.
            </div>
          )}
          <div className="space-y-2">
            {sentences.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-base font-semibold text-slate-900">{s.ru_stressed || s.ru}</p>
                    <p className="text-xs text-slate-500">{s.translit}</p>
                    <p className="text-sm text-slate-700">{s.en}</p>
                    {s.de && <p className="text-xs text-slate-500">🇩🇪 {s.de}</p>}
                    {s.pl && <p className="text-xs text-slate-500">🇵🇱 {s.pl}</p>}
                    {s.source_text && s.source_text !== s.en && (
                      <p className="mt-1 text-[11px] italic text-slate-400">
                        Source: {s.source_text}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => delMut.mutate(s.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Delete sentence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
