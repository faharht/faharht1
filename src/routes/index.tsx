import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, BookOpen, ArrowLeft, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BANDS,
  TONE_CLASSES,
  type LevelGroup,
  type LevelId,
  type ListMeta,
} from "@/lib/trainer/levels";
import { getGrammar } from "@/lib/trainer/grammar";
import { cn } from "@/lib/utils";


const LEVEL_IDS: LevelId[] = ["A1", "A2", "B1", "B2"];

type SearchState = {
  q: string;
  levels: LevelId[];
};

function asLevelArray(v: unknown): LevelId[] {
  const raw = Array.isArray(v) ? v : typeof v === "string" && v ? v.split(",") : [];
  return raw.filter((x): x is LevelId => LEVEL_IDS.includes(x as LevelId));
}

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): SearchState => ({
    q: typeof s.q === "string" ? s.q : "",
    levels: asLevelArray(s.levels),
  }),
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

function matchesFilters(
  list: ListMeta,
  state: SearchState,
  haystackExtra: string,
): boolean {
  if (state.levels.length > 0 && !state.levels.includes(list.level)) return false;
  if (state.q.trim()) {
    const needle = state.q.trim().toLowerCase();
    const hay = (list.title + " " + list.description + " " + haystackExtra).toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  return true;
}

function listHaystack(listId: string): string {
  const pack = getGrammar(listId);
  if (!pack) return "";
  return [
    pack.intro ?? "",
    ...pack.notes.flatMap((n) => [n.title, n.body]),
  ].join(" ");
}

function HomePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filterActive = search.q.trim().length > 0 || search.levels.length > 0;

  // Precompute haystacks once.
  const haystacks = useMemo(() => {
    const m: Record<string, string> = {};
    for (const band of BANDS) {
      for (const lvl of band.levels)
        for (const l of lvl.lists) m[l.id] = listHaystack(l.id);
      for (const ex of band.extras ?? []) m[ex.id] = listHaystack(ex.id);
    }
    return m;
  }, []);

  // Build filtered bands.
  const filteredBands = useMemo(() => {
    return BANDS.map((band) => ({
      ...band,
      levels: band.levels
        .map((lvl) => ({
          ...lvl,
          lists: lvl.lists.filter((l) => matchesFilters(l, search, haystacks[l.id] ?? "")),
        }))
        .filter((lvl) => lvl.lists.length > 0),
      extras: (band.extras ?? []).filter((ex) =>
        matchesFilters(ex, search, haystacks[ex.id] ?? ""),
      ),
    })).filter((b) => b.levels.length > 0 || b.extras.length > 0);
  }, [search, haystacks]);

  const totalMatches = filteredBands.reduce(
    (a, b) => a + b.extras.length + b.levels.reduce((x, l) => x + l.lists.length, 0),
    0,
  );

  function update(patch: Partial<SearchState>) {
    navigate({
      search: (prev: SearchState) => {
        const next: SearchState = { ...prev, ...patch };
        if (!next.q) next.q = "";
        return next;
      },
      replace: true,
    });
  }

  function toggleLevel(id: LevelId) {
    const exists = search.levels.includes(id);
    update({ levels: exists ? search.levels.filter((x: LevelId) => x !== id) : [...search.levels, id] });
  }

  function clearAll() {
    navigate({ search: { q: "", levels: [] }, replace: true });
  }


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
                <h1 className="text-xl font-bold leading-tight">Vocabulary Builder</h1>
                <p className="text-sm text-white/80">Build your Russian word power</p>
              </div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
              RU
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-white/85">
            <BookOpen className="h-4 w-4" />
            <span>20 categories</span>
          </div>
        </header>

        {/* Search + filters */}
        <section className="sticky top-0 z-20 -mx-4 mt-4 bg-[oklch(0.985_0.008_180)] px-4 pb-3 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              inputMode="search"
              value={search.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search lists, topics, grammar…"
              className="h-11 w-full rounded-xl border border-border/60 bg-card pl-9 pr-10 text-sm shadow-sm outline-none ring-primary/30 focus:ring-2"
              aria-label="Search lists"
            />
            {search.q && (
              <button
                onClick={() => update({ q: "" })}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {LEVEL_IDS.map((id) => {
              const on = search.levels.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleLevel(id)}
                  aria-pressed={on}
                  className={cn(
                    "h-8 rounded-full border px-3 text-xs font-semibold transition",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border/60 bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {id}
                </button>
              );
            })}
            {filterActive && (
              <button
                onClick={clearAll}
                className="ml-auto h-8 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>


          {filterActive && (
            <p className="mt-1 text-xs text-muted-foreground">
              {totalMatches} {totalMatches === 1 ? "list" : "lists"} match
            </p>
          )}
        </section>

        {filteredBands.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/60 p-8 text-center">
            <p className="text-sm text-muted-foreground">No lists match your filters.</p>
            <button
              onClick={clearAll}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Clear filters
            </button>
          </div>
        )}

        {filteredBands.map((band) => (
          <section key={band.band} className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", band.dotClass)} />
                <h2 className="text-sm font-semibold text-foreground">{band.band}</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {band.levels.reduce((a, l) => a + l.lists.length, 0) + band.extras.length}{" "}
                categories
              </span>
            </div>
            <div className="space-y-3">
              {band.levels.map((lvl) => (
                <LevelAccordion key={lvl.id} level={lvl} forceOpen={filterActive} />
              ))}
              {band.extras.map((extra) => (
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
                    <span className="text-base font-semibold text-foreground">{extra.title}</span>
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


function LevelAccordion({
  level,
  forceOpen,
}: {
  level: LevelGroup;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(level.id === "A1");
  const tone = TONE_CLASSES[level.tone];
  const isOpen = forceOpen || open;
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
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
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
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
