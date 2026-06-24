import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, BookOpen, ArrowLeft, Layers, ListChecks, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Russian Sentence Trainer" },
      { name: "description", content: "Learn Russian one sentence at a time — A1 through B2 with audio, transliteration, and stress marks." },
      { property: "og:title", content: "Russian Sentence Trainer" },
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
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                aria-label={t("common.back")}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{t("home.title")}</h1>
                <p className="text-xs text-white/80">{t("home.tagline")}</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/90">{t("home.intro")}</p>
        </header>

        {view === "menu" && (
          <div className="mt-6 space-y-3">
            <MenuButton
              icon={Layers}
              title="Level by level"
              description="A1 through B2 plus extra verb sets"
              tint="violet"
              onClick={() => setView("levels")}
            />
            <MenuButton
              icon={ListChecks}
              title="Sentence sets"
              description="Themed sentence collections — coming soon"
              tint="amber"
              onClick={() => setView("sets")}
            />
          </div>
        )}

        {view !== "menu" && (
          <div className="mt-5">
            <button
              onClick={() => setView("menu")}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          </div>
        )}

        {view === "levels" &&
          BANDS.map((band) => (
            <section key={band.band} className="mt-6">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", band.dotClass)} />
                  <h2 className="text-sm font-semibold text-foreground">
                    {t(`band.${band.band}` as StringKey)}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">
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
                  <ExtraCard key={extra.id} extra={extra} band={band.band} />
                ))}
              </div>
            </section>
          ))}

        {view === "sets" && (
          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-semibold text-foreground">Sentence sets</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {SENTENCE_SETS.length} sets
              </span>
            </div>
            <div className="space-y-3">
              {SENTENCE_SETS.map((set) => (
                <SetCard key={set.id} set={set} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MenuButton({
  icon: Icon,
  title,
  description,
  tint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tint: "violet" | "amber";
  onClick: () => void;
}) {
  const tints = {
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  } as const;
  const accent = {
    violet: "border-l-violet-400",
    amber: "border-l-amber-400",
  } as const;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border/70 border-l-4 bg-card px-4 py-4 text-left shadow-sm transition hover:shadow-md",
        accent[tint],
      )}
    >
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-lg", tints[tint])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-foreground">{title}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

function ExtraCard({ extra, band }: { extra: ListMeta; band: string }) {
  const { t } = useT();
  return (
    <Link
      to="/list/$listId"
      params={{ listId: extra.id }}
      className={cn(
        "block rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm border-l-4 transition hover:shadow-md",
        band === "Beginner" ? "border-l-emerald-400" : "border-l-amber-400",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg",
            band === "Beginner"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="text-base font-semibold text-foreground">
          {t(extra.titleKey, extra.titleVars)}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t(extra.descriptionKey)}</p>
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
  // Start with SSR-stable default to avoid hydration mismatch; sync from localStorage after mount.
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
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-white font-bold", tone.bg)}>
          {level.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">{level.label}</div>
          <div className="line-clamp-1 text-sm text-muted-foreground">
            {t(level.descriptionKey)}
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
          {level.lists.map((l) => (
            <Link
              key={l.id}
              to="/list/$listId"
              params={{ listId: l.id }}
              className="group rounded-xl border border-border/60 bg-background/60 p-3 transition hover:border-primary/50 hover:shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {t(l.titleKey, l.titleVars)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {t(l.descriptionKey)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
