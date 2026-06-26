import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Brain, Check, Volume2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useTrainerStore, TEXT_SIZE_CLASS } from "@/lib/trainer/store";
import { pickDueReviews, reviewSummary } from "@/lib/trainer/srs";
import { speak, hasSpeech, stopSpeaking } from "@/lib/trainer/speech";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const FREE_DAILY_REVIEWS = 10;

export const Route = createFileRoute("/review")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Daily Review — RussianFlow" },
      { name: "description", content: "Spaced-repetition review of the sentences you've practiced." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery(sessionUserQueryOptions);
  const sub = useSubscription(user?.id ?? null);
  const isPro = !!sub.data?.isPro;
  const progress = useTrainerStore((s) => s.progress);
  const settings = useTrainerStore((s) => s.settings);
  const bumpReps = useTrainerStore((s) => s.bumpReps);
  const setStars = useTrainerStore((s) => s.setStars);

  const summary = useMemo(() => reviewSummary(progress), [progress]);
  const dueIds = useMemo(() => {
    const cap = isPro ? 200 : FREE_DAILY_REVIEWS;
    return pickDueReviews(progress, cap).map((c) => c.id);
  }, [progress, isPro]);

  const { data: sentencesById } = useQuery({
    queryKey: ["review-sentences", dueIds.join(",")],
    enabled: dueIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sentences")
        .select("id,ru,ru_stressed,translit,en,pl,de,list_id")
        .in("id", dueIds);
      if (error) throw error;
      const map = new Map<string, { id: string; ru: string; en: string; pl?: string; de?: string }>();
      for (const r of data ?? []) {
        const row = r as { id: string; ru: string; en: string; pl?: string | null; de?: string | null };
        map.set(row.id, {
          id: row.id,
          ru: row.ru,
          en: row.en,
          pl: row.pl ?? undefined,
          de: row.de ?? undefined,
        });
      }
      return map;
    },
  });

  const queue = useMemo(
    () => dueIds.map((id) => sentencesById?.get(id)).filter(Boolean) as Array<{ id: string; ru: string; en: string; pl?: string; de?: string }>,
    [dueIds, sentencesById],
  );

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setRevealed(false), [idx]);

  const current = queue[idx];

  const grade = (good: boolean) => {
    if (!current) return;
    bumpReps(current.id, 1);
    const cur = progress[current.id]?.stars ?? 0;
    setStars(current.id, Math.max(0, Math.min(5, cur + (good ? 1 : -1))));
    setDone((d) => d + 1);
    if (idx + 1 < queue.length) setIdx((i) => i + 1);
    else setIdx(queue.length); // finished
  };

  const trText = (s: { en: string; pl?: string; de?: string }) =>
    settings.appLanguage === "pl" && s.pl ? s.pl : settings.appLanguage === "de" && s.de ? s.de : s.en;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/20" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold"><Brain className="h-4 w-4" /> Daily review</h1>
            <p className="truncate text-xs text-white/75">Spaced repetition of sentences you've practiced</p>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
            <Stat label="Due" value={String(summary.due)} />
            <Stat label="Learning" value={String(summary.learning)} />
            <Stat label="Mastered" value={String(summary.mastered)} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {!isPro && summary.due > FREE_DAILY_REVIEWS && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <span className="flex-1">
              Free plan: <b>{FREE_DAILY_REVIEWS}</b> daily reviews. {summary.due - FREE_DAILY_REVIEWS} more waiting — upgrade for unlimited.
            </span>
            <button onClick={() => navigate({ to: "/pricing" })} className="rounded-full bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white">
              Upgrade
            </button>
          </div>
        )}

        {queue.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">All caught up 🎉</p>
            <p className="mt-2 text-sm text-slate-500">
              No sentences are due right now. Practice a set to build your review queue.
            </p>
            <Link to="/" className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Browse sets
            </Link>
          </div>
        )}

        {current && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold text-slate-400">{idx + 1} / {queue.length}</div>
            <p className="mt-3 text-sm text-slate-600">{trText(current)}</p>
            {revealed ? (
              <p className={cn("mt-4 font-semibold text-slate-900", TEXT_SIZE_CLASS[settings.textSize])} lang="ru">
                {current.ru}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-6 text-sm font-semibold text-blue-700"
              >
                Tap to reveal Russian
              </button>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => hasSpeech() && speak(current.ru, { rate: settings.speed })}
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-700"
                aria-label="Play"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => grade(false)}
                  className="flex items-center gap-1.5 rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700"
                >
                  <X className="h-3.5 w-3.5" /> Again
                </button>
                <button
                  onClick={() => grade(true)}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <Check className="h-3.5 w-3.5" /> Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {queue.length > 0 && idx >= queue.length && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">Session complete</p>
            <p className="mt-2 text-sm text-slate-500">Reviewed {done} sentences. See you tomorrow!</p>
            <Link to="/" className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1 text-[10px] font-semibold tracking-wider text-slate-500">{label}</div>
    </div>
  );
}
