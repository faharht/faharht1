import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flame, Check, X, Volume2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { speak, hasSpeech, stopSpeaking } from "@/lib/trainer/speech";
import { useTrainerStore } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";

const DAILY_TARGET = 10;

export const Route = createFileRoute("/daily")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Daily Challenge — RussianFlow" },
      { name: "description", content: "10 sentences a day to keep your Russian streak alive." },
    ],
  }),
  component: DailyPage,
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Deterministic per-day seed
function seedFromDate(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffle<T>(arr: T[], seed: number) {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DailyPage() {
  const today = todayKey();
  const seed = seedFromDate(today);
  const settings = useTrainerStore((s) => s.settings);
  const lang = (settings.uiLang ?? "en") as "en" | "pl" | "de";
  const speechReady = hasSpeech();

  const { data: pool, isLoading } = useQuery({
    queryKey: ["daily-pool", today],
    staleTime: 1000 * 60 * 60 * 6,
    queryFn: async () => {
      // Sample a chunk; deterministic shuffle in client keeps it stable per day.
      const { data, error } = await supabase
        .from("sentences")
        .select("id,ru,ru_stressed,translit,en,pl,de")
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const queue = useMemo(() => {
    if (!pool) return [];
    return shuffle(pool, seed).slice(0, DAILY_TARGET);
  }, [pool, seed]);

  const storageKey = `daily:${today}`;
  const [done, setDone] = useState<number>(0);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { done: number; complete: boolean };
        setDone(parsed.done ?? 0);
        setComplete(!!parsed.complete);
        setIdx(Math.min(parsed.done ?? 0, DAILY_TARGET - 1));
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setRevealed(false), [idx]);

  const persist = (d: number, c: boolean) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ done: d, complete: c }));
    } catch {
      /* ignore */
    }
  };

  const grade = (good: boolean) => {
    void good;
    const nextDone = Math.min(done + 1, DAILY_TARGET);
    setDone(nextDone);
    const isComplete = nextDone >= DAILY_TARGET;
    setComplete(isComplete);
    persist(nextDone, isComplete);
    if (!isComplete) setIdx((i) => (i + 1) % queue.length);
  };

  const current = queue[idx];
  const translation = current
    ? (lang === "pl" ? current.pl : lang === "de" ? current.de : current.en) ?? current.en
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" /> Daily Challenge
            </h1>
            <p className="text-xs text-slate-500">{done}/{DAILY_TARGET} done today</p>
          </div>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all"
              style={{ width: `${(done / DAILY_TARGET) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6">
        {isLoading && <p className="text-center text-sm text-slate-500">Loading…</p>}

        {complete && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center shadow-sm">
            <Trophy className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-3 text-xl font-bold text-slate-900">Daily challenge complete!</h2>
            <p className="mt-2 text-sm text-slate-600">Come back tomorrow for a fresh set.</p>
            <Link to="/" className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
              Back to home
            </Link>
          </div>
        )}

        {!complete && current && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">{translation}</p>

            {revealed ? (
              <p className="mt-4 text-xl font-bold text-slate-900 leading-snug" lang="ru">
                {current.ru_stressed || current.ru}
              </p>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="mt-4 w-full rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-6 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Tap to reveal Russian
              </button>
            )}

            {revealed && current.translit && (
              <p className="mt-2 text-sm italic text-slate-500">{current.translit}</p>
            )}

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  stopSpeaking();
                  speak(current.ru);
                }}
                disabled={!speechReady}
                className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-40"
                aria-label="Play"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>

            {revealed && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => grade(false)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-100",
                  )}
                >
                  <X className="h-4 w-4" /> Hard
                </button>
                <button
                  onClick={() => grade(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                >
                  <Check className="h-4 w-4" /> Got it
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
