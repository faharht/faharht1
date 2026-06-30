import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BookOpen, Crown, Languages } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { conjugateVerb, translateToRussian } from "@/lib/tutor.functions";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";

const COMMON_VERBS = [
  "быть", "иметь", "делать", "говорить", "знать", "видеть", "хотеть", "идти",
  "работать", "жить", "думать", "понимать", "любить", "читать", "писать", "сказать",
];

const LANGS: { code: string; label: string }[] = [
  { code: "auto", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "pl", label: "Polish" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "uk", label: "Ukrainian" },
  { code: "be", label: "Belarusian" },
  { code: "bg", label: "Bulgarian" },
  { code: "cs", label: "Czech" },
  { code: "sk", label: "Slovak" },
  { code: "sr", label: "Serbian" },
  { code: "hr", label: "Croatian" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

export const Route = createFileRoute("/conjugation")({
  ssr: false,
  head: () => ({ meta: [{ title: "Verb Conjugation — RussianFlow" }] }),
  component: ConjugationPage,
});

function ConjugationPage() {
  const navigate = useNavigate();
  const { data: user } = useQuery(sessionUserQueryOptions);
  const sub = useSubscription(user?.id ?? null);
  const isPro = !!sub.data?.isPro;
  const conjFn = useServerFn(conjugateVerb);
  const trFn = useServerFn(translateToRussian);
  const [verb, setVerb] = useState("делать");
  const [text, setText] = useState("speak");
  const [source, setSource] = useState("en");

  const conjMutation = useMutation({
    mutationFn: (v: string) => conjFn({ data: { infinitive: v } }),
  });
  const trMutation = useMutation({
    mutationFn: (payload: { text: string; source: string }) =>
      trFn({ data: { text: payload.text, source: payload.source as any } }),
    onSuccess: (json) => {
      // If a verb was returned, run the local conjugator endpoint to fill imperative
      if (json?.verb) conjMutation.mutate(json.verb);
    },
  });

  const submitConj = (v: string) => {
    setVerb(v);
    conjMutation.mutate(v);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full bg-white/20" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold"><BookOpen className="h-4 w-4" /> Conjugation</h1>
            <p className="truncate text-xs text-white/75">Look up any Russian verb</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 space-y-4">
        {!user ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600">Sign in to use the conjugation trainer.</p>
            <button onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })} className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Sign in
            </button>
          </div>
        ) : (
          <>
            {/* Translate from any language */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Languages className="h-3.5 w-3.5" /> Translate to Russian
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm outline-none focus:border-blue-400"
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) trMutation.mutate({ text, source }); }}
                  placeholder="Word in your language (e.g. speak)"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                />
                <button
                  onClick={() => trMutation.mutate({ text, source })}
                  disabled={trMutation.isPending || !text.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {trMutation.isPending ? "…" : "Translate"}
                </button>
              </div>

              {trMutation.data && (
                <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm">
                  <div className="text-[11px] font-semibold uppercase text-indigo-700">Russian</div>
                  <div className="text-lg font-bold text-slate-900" lang="ru">
                    {trMutation.data.verb ?? trMutation.data.translation ?? "—"}
                  </div>
                  {trMutation.data.verb && (
                    <button
                      onClick={() => submitConj(trMutation.data!.verb!)}
                      className="mt-1 text-xs font-semibold text-indigo-700 underline"
                    >
                      Show full conjugation ↓
                    </button>
                  )}
                </div>
              )}
              {trMutation.isError && (
                <p className="mt-2 text-xs text-rose-600">{(trMutation.error as Error).message}</p>
              )}
            </div>

            {/* Direct Russian verb lookup */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Russian verb
              </div>
              <div className="flex gap-2">
                <input
                  value={verb}
                  onChange={(e) => setVerb(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitConj(verb); }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  lang="ru"
                  placeholder="Infinitive (e.g. делать)"
                />
                <button
                  onClick={() => submitConj(verb)}
                  disabled={conjMutation.isPending || !verb.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  {conjMutation.isPending ? "…" : "Conjugate"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {COMMON_VERBS.map((v) => (
                  <button key={v} onClick={() => submitConj(v)} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-700" lang="ru">
                    {v}
                  </button>
                ))}
              </div>
              {!isPro && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="flex-1">Free preview. <button onClick={() => navigate({ to: "/pricing" })} className="font-bold underline">Upgrade</button> for unlimited lookups.</span>
                </div>
              )}
            </div>

            {conjMutation.data && (
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900" lang="ru">{conjMutation.data.infinitive}</span>
                  <span className="text-xs font-semibold uppercase text-blue-600">{conjMutation.data.aspect}</span>
                </div>

                <Section title={conjMutation.data.aspect === "perfective" ? "Future" : "Present"}>
                  <Row label="я" value={conjMutation.data.present.ya} />
                  <Row label="ты" value={conjMutation.data.present.ty} />
                  <Row label="он/она" value={conjMutation.data.present.on} />
                  <Row label="мы" value={conjMutation.data.present.my} />
                  <Row label="вы" value={conjMutation.data.present.vy} />
                  <Row label="они" value={conjMutation.data.present.oni} />
                </Section>

                <Section title="Past">
                  <Row label="m" value={conjMutation.data.past.m} />
                  <Row label="f" value={conjMutation.data.past.f} />
                  <Row label="n" value={conjMutation.data.past.n} />
                  <Row label="pl" value={conjMutation.data.past.pl} />
                </Section>

                <Section title="Imperative">
                  <Row label="ты" value={conjMutation.data.imperative.sg} />
                  <Row label="вы" value={conjMutation.data.imperative.pl} />
                </Section>
              </div>
            )}

            {conjMutation.isError && (
              <p className="text-xs text-rose-600">{(conjMutation.error as Error).message}</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="grid grid-cols-2 gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
      <span className="w-12 text-[11px] font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900" lang="ru">{value}</span>
    </div>
  );
}
