import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Keyboard, Volume2, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sentencesQueryOptions, isCustomListId } from "@/lib/trainer/sentences";
import { findList } from "@/lib/trainer/levels";
import { useTrainerStore } from "@/lib/trainer/store";
import { hasSpeech, speak, stopSpeaking } from "@/lib/trainer/speech";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const FREE_TYPING_PER_LIST = 5;

export const Route = createFileRoute("/typing/$listId")({
  ssr: false,
  loader: ({ params }) => {
    const meta = isCustomListId(params.listId) ? null : findList(params.listId);
    return { listId: params.listId, title: meta?.title ?? "Typing drill" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Typing — ${loaderData?.title} — RussianFlow` }],
  }),
  component: TypingPage,
});

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function TypingPage() {
  const navigate = useNavigate();
  const { listId, title } = Route.useLoaderData();
  const { data: user } = useQuery(sessionUserQueryOptions);
  const sub = useSubscription(user?.id ?? null);
  const isPro = !!sub.data?.isPro;
  const settings = useTrainerStore((s) => s.settings);
  const bumpReps = useTrainerStore((s) => s.bumpReps);
  const { data: sentences = [] } = useQuery(sentencesQueryOptions(listId));

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"idle" | "ok" | "bad">("idle");

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => { setInput(""); setResult("idle"); }, [idx]);

  const limit = isPro ? sentences.length : Math.min(sentences.length, FREE_TYPING_PER_LIST);
  const current = sentences[idx];

  const trText = (s: { en: string; pl?: string; de?: string }) =>
    settings.appLanguage === "pl" && s.pl ? s.pl : settings.appLanguage === "de" && s.de ? s.de : s.en;

  const check = () => {
    if (!current) return;
    const ok = normalize(input) === normalize(current.ru);
    setResult(ok ? "ok" : "bad");
    if (ok) bumpReps(current.id, 1);
  };

  const next = () => {
    if (idx + 1 < limit) setIdx(idx + 1);
    else setIdx(limit); // finished
  };

  const lockedAhead = !isPro && idx >= FREE_TYPING_PER_LIST;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/list/$listId" params={{ listId }} className="grid h-10 w-10 place-items-center rounded-full bg-white/20" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold"><Keyboard className="h-4 w-4" /> Typing drill</h1>
            <p className="truncate text-xs text-white/75">{title}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {!isPro && (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <Lock className="h-4 w-4 shrink-0" />
            <span className="flex-1">Free plan: {FREE_TYPING_PER_LIST} sentences per set. Upgrade for unlimited.</span>
            <button onClick={() => navigate({ to: "/pricing" })} className="rounded-full bg-amber-600 px-3 py-1 text-[11px] font-bold text-white">
              Upgrade
            </button>
          </div>
        )}

        {lockedAhead ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">Free limit reached</p>
            <button onClick={() => navigate({ to: "/pricing" })} className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Upgrade to Pro
            </button>
          </div>
        ) : current ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold text-slate-400">{idx + 1} / {limit}</div>
            <p className="mt-3 text-sm text-slate-600">Translate to Russian:</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{trText(current)}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => hasSpeech() && speak(current.ru, { rate: settings.speed })}
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 text-blue-700"
                aria-label="Play"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <span className="text-[11px] text-slate-400">Hint — listen first</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              lang="ru"
              placeholder="Type in Russian…"
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-base text-slate-900 outline-none focus:border-blue-400"
            />
            {result === "ok" && (
              <p className="mt-2 text-sm font-semibold text-emerald-600">✓ Correct!</p>
            )}
            {result === "bad" && (
              <div className="mt-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                <div className="font-semibold">Not quite. Expected:</div>
                <div className="mt-1 text-slate-900" lang="ru">{current.ru}</div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {result === "idle" ? (
                <button onClick={check} disabled={!input.trim()} className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-40">
                  Check
                </button>
              ) : (
                <button onClick={next} className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-bold text-white">
                  Next →
                </button>
              )}
            </div>
          </div>
        ) : sentences.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading sentences…</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-base font-bold text-slate-900">Done! 🎉</p>
            <Link to="/list/$listId" params={{ listId }} className="mt-4 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Back to set
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
