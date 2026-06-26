import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Sparkles, Crown } from "lucide-react";
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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!user) {
    return (
      <Gate title="Sign in to use the AI tutor" cta="Sign in" onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })} />
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
      setMessages([...next, { role: "assistant", content: `(error) ${e instanceof Error ? e.message : "Try again"}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/20" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold"><Sparkles className="h-4 w-4" /> AI tutor</h1>
            <p className="text-xs text-white/75">Russian conversation practice</p>
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as "A1" | "A2" | "B1" | "B2")}
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white outline-none"
          >
            <option className="text-slate-900" value="A1">A1</option>
            <option className="text-slate-900" value="A2">A2</option>
            <option className="text-slate-900" value="B1">B1</option>
            <option className="text-slate-900" value="B2">B2</option>
          </select>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-blue-600 text-white" : "bg-white text-slate-900 shadow-sm",
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && <div className="text-xs text-slate-400">Tutor is thinking…</div>}
          <div ref={endRef} />
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Напиши по-русски…"
            className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            lang="ru"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-white disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Gate({ title, body, cta, onClick, icon }: { title: string; body?: string; cta: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/20" aria-label="Back">
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
          <button onClick={onClick} className="mt-5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            {cta}
          </button>
        </div>
      </main>
    </div>
  );
}
