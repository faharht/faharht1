import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, Crown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { tutorChat } from "@/lib/tutor.functions";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrainerStore } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/tutor")({
  ssr: false,
  head: () => ({
    meta: [{ title: "AI Tutor — RussianFlow" }],
  }),
  component: TutorPage,
});

function TutorPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery(sessionUserQueryOptions);
  const sub = useSubscription(user?.id ?? null);
  const isPro = !!sub.data?.isPro;
  const lang = useTrainerStore((s) => s.settings.appLanguage);
  const chatFn = useServerFn(tutorChat);
  const [level, setLevel] = useState<"A1" | "A2" | "B1" | "B2">("A1");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Привет! Давай попрактикуемся.\n(EN) Hi! Let's practice." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  if (!user) {
    return (
      <Gate
        title="Sign in to use the AI tutor"
        cta="Sign in"
        onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
      />
    );
  }
  if (!isPro) {
    return (
      <Gate
        title="AI tutor is a Pro feature"
        body="Chat with a Russian tutor that corrects your mistakes and adapts to your level."
        cta="Upgrade to Pro"
        icon={<Crown className="h-6 w-6 text-amber-500" />}
        onClick={() => navigate({ to: "/pricing" })}
      />
    );
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const r = await chatFn({ data: { level, uiLang: lang, messages: next } });
      setMessages([...next, { role: "assistant", content: r.reply }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : "Try again"}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = ["Привет!", "Как дела?", "Расскажи о себе", "Помоги с грамматикой"];

  return (
    <div
      className="flex flex-col bg-gradient-to-b from-slate-50 to-slate-100"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <header className="shrink-0 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <Link
            to="/"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 text-sm font-bold sm:text-base">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">AI tutor</span>
            </h1>
            <p className="truncate text-[11px] text-white/75 sm:text-xs">
              Russian conversation practice
            </p>
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as "A1" | "A2" | "B1" | "B2")}
            className="shrink-0 rounded-full bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white outline-none ring-0 hover:bg-white/30"
            aria-label="Level"
          >
            <option className="text-slate-900" value="A1">A1</option>
            <option className="text-slate-900" value="A2">A2</option>
            <option className="text-slate-900" value="B1">B1</option>
            <option className="text-slate-900" value="B2">B2</option>
          </select>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-3 py-4 sm:gap-3 sm:px-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[80%]",
                  m.role === "user"
                    ? "rounded-br-md bg-blue-600 text-white"
                    : "rounded-bl-md bg-white text-slate-900 ring-1 ring-slate-200/60",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Tutor is thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </main>

      {/* Composer */}
      <div
        className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {messages.length <= 1 && (
          <div className="mx-auto max-w-2xl overflow-x-auto px-3 pt-2 sm:px-4">
            <div className="flex gap-1.5 pb-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  lang="ru"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-end gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Напиши по-русски…"
            rows={1}
            lang="ru"
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-snug outline-none focus:border-blue-400 focus:bg-white"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Gate({
  title,
  body,
  cta,
  onClick,
  icon,
}: {
  title: string;
  body?: string;
  cta: string;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-base font-bold">AI tutor</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-10">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          {icon && <div className="mb-3 flex justify-center">{icon}</div>}
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {body && <p className="mt-2 text-sm text-slate-500">{body}</p>}
          <button
            onClick={onClick}
            className="mt-5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {cta}
          </button>
        </div>
      </main>
    </div>
  );
}
