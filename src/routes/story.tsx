import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sparkles, Volume2, Loader2 } from "lucide-react";
import { generateStory, type StoryResult } from "@/lib/story.functions";
import { speak, hasSpeech, stopSpeaking } from "@/lib/trainer/speech";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/story")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Story Mode — RussianFlow" },
      { name: "description", content: "AI-generated short Russian stories at your level." },
    ],
  }),
  component: StoryPage,
});

type Level = "A1" | "A2" | "B1" | "B2";

function StoryPage() {
  const gen = useServerFn(generateStory);
  const [level, setLevel] = useState<Level>("A1");
  const [topic, setTopic] = useState("");
  const [story, setStory] = useState<StoryResult | null>(null);
  const speechReady = hasSpeech();

  const mut = useMutation({
    mutationFn: async () =>
      gen({ data: { level, uiLang: "en", topic: topic.trim() || undefined } }),
    onSuccess: (data) => setStory(data),
  });

  const errorMessage = mut.error
    ? (mut.error as Error).message === "CREDITS_EXHAUSTED"
      ? "AI credits exhausted. Please try again later."
      : (mut.error as Error).message === "RATE_LIMITED"
        ? "Too many requests — try again in a moment."
        : "Could not generate a story. Please retry."
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-blue-100">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Story Mode</h1>
            <p className="text-xs text-slate-500">Read a level-matched mini-story</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {(["A1", "A2", "B1", "B2"] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition",
                  level === l
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Optional topic (e.g. coffee shop, weekend, travel)"
            maxLength={80}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <button
            onClick={() => {
              stopSpeaking();
              mut.mutate();
            }}
            disabled={mut.isPending}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60"
          >
            {mut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate story
              </>
            )}
          </button>
          {errorMessage && (
            <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>
          )}
        </section>

        {story && (
          <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900" lang="ru">
                {story.title}
              </h2>
              <button
                onClick={() => {
                  stopSpeaking();
                  speak(story.sentences.map((s) => s.ru).join(" "));
                }}
                disabled={!speechReady}
                className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                aria-label="Play whole story"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
            <ol className="space-y-3">
              {story.sentences.map((s, i) => (
                <li key={i} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-bold text-blue-600">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900" lang="ru">
                        {s.ru_stressed || s.ru}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{s.translation}</p>
                    </div>
                    <button
                      onClick={() => {
                        stopSpeaking();
                        speak(s.ru);
                      }}
                      disabled={!speechReady}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                      aria-label="Play sentence"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}
