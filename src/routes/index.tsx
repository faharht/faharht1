import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, BookOpen, ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  BANDS,
  TONE_CLASSES,
  type LevelGroup,
} from "@/lib/trainer/levels";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Russian Sentence Trainer" },
      {
        name: "description",
        content:
          "Learn Russian one sentence at a time — A1 through B2 with audio, transliteration, and stress marks.",
      },
      { property: "og:title", content: "Russian Sentence Trainer" },
      {
        property: "og:description",
        content:
          "Curated Russian sentences with audio, transliteration, and stress marks. A1–B2.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        {/* Hero card */}
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                aria-label="back"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 backdrop-blur"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">Russian Master</h1>
                <p className="text-xs text-white/80">A1 → B2 sentence trainer</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/90">
            Pick a level and a part to start practicing. Tap a sentence for audio and stress
            marks.
          </p>
        </header>

        {BANDS.map((band) => (
          <section key={band.band} className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", band.dotClass)} />
                <h2 className="text-sm font-semibold text-foreground">{band.band}</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {band.levels.reduce((a, l) => a + l.lists.length, 0) +
                  (band.extras?.length ?? 0)}{" "}
                categories
              </span>
            </div>
            <div className="space-y-3">
              {band.levels.map((lvl) => (
                <LevelAccordion key={lvl.id} level={lvl} />
              ))}
              {(band.extras ?? []).map((extra) => (
                <Link
                  key={extra.id}
                  to="/list/$listId"
                  params={{ listId: extra.id }}
                  className={cn(
                    "block rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-sm border-l-4 transition hover:shadow-md",
                    band.band === "Beginner" ? "border-l-emerald-400" : "border-l-amber-400",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        band.band === "Beginner"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {extra.title}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{extra.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

function LevelAccordion({ level }: { level: LevelGroup }) {
  const [open, setOpen] = useState(level.id === "A1");
  const tone = TONE_CLASSES[level.tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full text-white font-bold",
            tone.bg,
          )}
        >
          {level.label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-foreground">{level.label}</div>
          <div className="line-clamp-1 text-sm text-muted-foreground">
            {level.description}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
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
                <span className="text-sm font-semibold text-foreground">{l.title}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {l.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
