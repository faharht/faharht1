import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, BookOpen, Layers, ListChecks, ChevronRight, Bell, Flame, Rocket, Sparkles, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BANDS,
  SENTENCE_SETS,
  TONE_CLASSES,
  type LevelGroup,
  type ListMeta,
} from "@/lib/trainer/levels";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";
import type { StringKey } from "@/lib/i18n/strings";
import { StreakStrip } from "@/components/StreakStrip";
import { supabase } from "@/integrations/supabase/client";

function useSentenceCounts() {
  return useQuery({
    queryKey: ["sentence-counts"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase.from("sentences").select("list_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = (row as { list_id: string }).list_id;
        counts[id] = (counts[id] ?? 0) + 1;
      }
      return counts;
    },
  });
}


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RussianFlow" },
      { name: "description", content: "Learn Russian one sentence at a time — A1 through B2 with audio, transliteration, and stress marks." },
      { property: "og:title", content: "RussianFlow" },
      { property: "og:description", content: "Curated Russian sentences with audio, transliteration, and stress marks. A1–B2." },
    ],
  }),
  component: HomePage,
});

type View = "menu" | "levels" | "sets";

function HomePage() {
  const { t } = useT();
  const [view, setView] = useState<View>("menu");

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Blue hero header */}
      <header className="rounded-b-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 pb-10 pt-8 text-white shadow-lg sm:px-5">
        <div className="mx-auto grid max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-bold backdrop-blur">
            RU
          </div>
          <div className="flex min-w-0 flex-col items-center text-center">
            <span className="truncate text-[11px] uppercase tracking-wider text-white/70">{t("home.tagline")}</span>
            <div className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Rocket className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t("home.title")}</span>
            </div>
          </div>
          <button
            aria-label="notifications"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 backdrop-blur"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>


        {/* Daily streak strip */}
        <div className="mx-auto mt-6 max-w-2xl text-slate-900">
          <StreakStrip />
        </div>

      </header>

      <main className="mx-auto -mt-4 max-w-2xl px-4">
        {view === "menu" && (
          <div className="mt-6 space-y-3">
            <MenuCard
              icon={Layers}
              title="Level by level"
              description="A1 through B2 plus extra verb sets"
              onClick={() => setView("levels")}
            />
            <MenuCard
              icon={ListChecks}
              title="Sentence sets"
              description="Themed sentence collections"
              onClick={() => setView("sets")}
            />
            <MenuLinkCard
              icon={Sparkles}
              title="My sets"
              description="Create your own sets — any language → Russian"
              to="/custom"
            />
          </div>
        )}

        {view !== "menu" && (
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setView("menu")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              Back
            </button>
            <span className="text-xs font-medium text-slate-500">
              {view === "levels" ? "Levels" : `${SENTENCE_SETS.length} sets`}
            </span>
          </div>
        )}

        {view === "levels" &&
          BANDS.map((band) => (
            <section key={band.band} className="mt-6">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-900">
                  {t(`band.${band.band}` as StringKey)}
                </h2>
                <span className="text-xs text-slate-500">
                  {band.levels.reduce((a, l) => a + l.lists.length, 0) +
                    (band.extras?.length ?? 0)}{" "}
                  {t("home.categories")}
                </span>
              </div>
              <div className="space-y-3">
                {band.levels.map((lvl) => (
                  <LevelAccordion key={lvl.id} level={lvl} />
                ))}
                {(band.extras ?? []).map((extra) => (
                  <ExtraCard key={extra.id} extra={extra} />
                ))}
              </div>
            </section>
          ))}

        {view === "sets" && (
          <section className="mt-6">
            <h2 className="mb-3 px-1 text-sm font-bold text-slate-900">Sentence sets</h2>
            <div className="space-y-3">
              {SENTENCE_SETS.map((set, i) => (
                <SetCard key={`${set.id}-${i}`} set={set} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MenuCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold text-slate-900">{title}</div>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function MenuLinkCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: "/custom" | "/pricing";
}) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold text-slate-900">{title}</div>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </Link>
  );
}


const SET_DOT: Record<NonNullable<ListMeta["tone"]>, string> = {
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  rose: "bg-rose-500",
};

function SetCard({ set }: { set: ListMeta }) {
  const Icon = set.icon ?? ListChecks;
  const dot = SET_DOT[set.tone ?? "sky"];
  return (
    <Link
      to="/list/$listId"
      params={{ listId: set.id }}
      className="block rounded-2xl bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-white", dot)}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-900">{set.title}</div>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{set.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </Link>
  );
}

function ExtraCard({ extra }: { extra: ListMeta }) {
  const { t } = useT();
  return (
    <Link
      to="/list/$listId"
      params={{ listId: extra.id }}
      className="block rounded-2xl bg-white px-4 py-3.5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
          <BookOpen className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-900">
            {t(extra.titleKey, extra.titleVars)}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t(extra.descriptionKey)}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
    </Link>
  );
}

const LEVEL_OPEN_STORAGE_KEY = "trainer.levelOpen.v1";

function readLevelOpen(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LEVEL_OPEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function LevelAccordion({ level }: { level: LevelGroup }) {
  const { t } = useT();
  const [open, setOpen] = useState<boolean>(level.id === "A1");
  useEffect(() => {
    const stored = readLevelOpen();
    if (level.id in stored) setOpen(stored[level.id]);
  }, [level.id]);
  const tone = TONE_CLASSES[level.tone];

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        const stored = readLevelOpen();
        stored[level.id] = next;
        window.localStorage.setItem(LEVEL_OPEN_STORAGE_KEY, JSON.stringify(stored));
      } catch {
        // ignore
      }
      return next;
    });
  };
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white", tone.bg)}>
          {level.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-900">{level.label} Level</div>
          <div className="line-clamp-1 text-xs text-slate-500">
            {t(level.descriptionKey)}
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-3 sm:grid-cols-2">
          {level.lists.map((l) => (
            <Link
              key={l.id}
              to="/list/$listId"
              params={{ listId: l.id }}
              className="group flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm transition hover:shadow"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-blue-600">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-800">
                  {t(l.titleKey, l.titleVars)}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                  {t(l.descriptionKey)}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
