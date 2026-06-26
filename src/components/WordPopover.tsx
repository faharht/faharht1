import { useEffect, useRef, useState } from "react";
import { Loader2, X, Volume2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { translateWord } from "@/lib/tutor.functions";
import { speak } from "@/lib/trainer/speech";

type Lang = "en" | "pl" | "de";

export function WordPopover({
  word,
  context,
  uiLang,
  onClose,
}: {
  word: string;
  context?: string;
  uiLang: Lang;
  onClose: () => void;
}) {
  const lookup = useServerFn(translateWord);
  const [state, setState] = useState<{
    loading: boolean;
    data?: { lemma: string; translation: string; pos: string; form: string; example: string };
    error?: string;
  }>({ loading: true });
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    lookup({ data: { word, context, uiLang } })
      .then((d) => {
        if (!cancelled) setState({ loading: false, data: d });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ loading: false, error: e.message || "Lookup failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [word, context, uiLang, lookup]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div
        ref={ref}
        className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Word lookup
            </div>
            <div lang="ru" className="text-lg font-bold text-slate-900">
              {word}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {state.loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up…
          </div>
        )}
        {state.error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{state.error}</div>
        )}
        {state.data && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span lang="ru" className="text-base font-semibold text-blue-700">
                {state.data.lemma}
              </span>
              <button
                onClick={() => speak(state.data!.lemma)}
                className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                aria-label="Play lemma"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                {state.data.pos}
              </span>
              {state.data.form && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {state.data.form}
                </span>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
              {state.data.translation}
            </div>
            {state.data.example && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Example
                </div>
                <p lang="ru" className="mt-0.5 text-slate-700">
                  {state.data.example}
                </p>
              </div>
            )}
          </div>
        )}
        <p className="mt-3 text-[10px] text-slate-400">
          Tip: long-press any Russian word to look it up.
        </p>
      </div>
    </div>
  );
}
