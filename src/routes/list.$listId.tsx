import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Headphones,
  Heart,
  HelpCircle,
  Languages,
  Pause,
  Play,
  Search,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Square,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { findList, TONE_CLASSES, LEVELS } from "@/lib/trainer/levels";
import { getSentences } from "@/lib/trainer/sentences";
import { summarizeList, TEXT_SIZE_CLASS, useTrainerStore } from "@/lib/trainer/store";
import { hasSpeech, speak, stopSpeaking } from "@/lib/trainer/speech";
import { getGrammar, type GrammarPack } from "@/lib/trainer/grammar";
import { splitStressedWord, tokenizeStressed } from "@/lib/trainer/stress";
import type { TextSize } from "@/lib/trainer/types";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/list/$listId")({
  loader: ({ params }) => {
    const meta = findList(params.listId);
    if (!meta) throw notFound();
    return { meta };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.meta.title} — Russian Trainer` },
          {
            name: "description",
            content: `Practice Russian: ${loaderData.meta.description}.`,
          },
        ]
      : [],
  }),
  component: ListPage,
});

function ListPage() {
  const { meta } = Route.useLoaderData();
  const sentences = useMemo(() => getSentences(meta.id), [meta.id]);
  const settings = useTrainerStore((s) => s.settings);
  const progress = useTrainerStore((s) => s.progress);
  const favorites = useTrainerStore((s) => s.favorites);
  const setStars = useTrainerStore((s) => s.setStars);
  const bumpReps = useTrainerStore((s) => s.bumpReps);
  const setSettings = useTrainerStore((s) => s.setSettings);
  const toggleFavorite = useTrainerStore((s) => s.toggleFavorite);

  const ids = useMemo(() => sentences.map((s) => s.id), [sentences]);
  const stats = useMemo(() => summarizeList(progress, ids), [progress, ids]);
  const total = sentences.length;

  const lvl = LEVELS.find((l) => l.id === meta.level)!;
  const tone = TONE_CLASSES[lvl.tone];

  const grammar = useMemo(() => getGrammar(meta.id), [meta.id]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [showTranslit, setShowTranslit] = useState(settings.showTransliteration);
  useEffect(() => setShowTranslit(settings.showTransliteration), [settings.showTransliteration]);

  const [listenMode, setListenMode] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`s-${focusId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setFocusId(null), 1400);
    return () => clearTimeout(t);
  }, [focusId]);


  const visibleSentences = useMemo(() => {
    let list = sentences;
    if (favoritesOnly) list = list.filter((s) => favorites[s.id]);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.ru.toLowerCase().includes(q) ||
          (s.ruStressed?.toLowerCase().includes(q) ?? false) ||
          s.en.toLowerCase().includes(q) ||
          (s.translit?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [sentences, favoritesOnly, favorites, query]);

  const [playingAll, setPlayingAll] = useState(false);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    return () => stopSpeaking();
  }, []);

  const speechReady = mounted && hasSpeech();

  // Map a charIndex (into cleaned ru text) to a word index for highlighting.
  function makeBoundaryHandler(ru: string) {
    const ranges: Array<{ start: number; end: number }> = [];
    const re = /\p{L}+/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(ru))) ranges.push({ start: m.index, end: m.index + m[0].length });
    return (charIndex: number) => {
      const wi = ranges.findIndex((r) => charIndex >= r.start && charIndex < r.end);
      if (wi >= 0) setActiveWord(wi);
    };
  }

  function playOne(idx: number) {
    if (!hasSpeech()) return;
    stopSpeaking();
    setPlayingAll(false);
    cancelRef.current = true;
    setCurrentIdx(idx);
    setActiveWord(null);
    const s = visibleSentences[idx];
    if (!s) return;
    bumpReps(s.id, 1);
    const handler = makeBoundaryHandler(s.ru);
    speak(s.ru, {
      rate: settings.speed,
      onBoundary: handler,
      onEnd: () => {
        setCurrentIdx((c) => (c === idx ? null : c));
        setActiveWord(null);
      },
      onError: () => {
        setCurrentIdx(null);
        setActiveWord(null);
      },
    });
  }

  function playWord(word: string) {
    if (!hasSpeech()) return;
    speak(word, { rate: settings.speed });
  }

  async function playAll() {
    if (!hasSpeech()) return;
    setPlayingAll(true);
    cancelRef.current = false;
    for (let i = 0; i < visibleSentences.length; i++) {
      if (cancelRef.current) break;
      setCurrentIdx(i);
      setActiveWord(null);
      const s = visibleSentences[i];
      const handler = makeBoundaryHandler(s.ru);
      for (let r = 0; r < settings.reps; r++) {
        if (cancelRef.current) break;
        bumpReps(s.id, 1);
        await new Promise<void>((resolve) => {
          speak(s.ru, {
            rate: settings.speed,
            onBoundary: handler,
            onEnd: resolve,
            onError: resolve,
          });
        });
        if (cancelRef.current) break;
        if (settings.pauseSeconds > 0) {
          await new Promise((r2) => setTimeout(r2, settings.pauseSeconds * 1000));
        }
      }
    }
    setPlayingAll(false);
    setCurrentIdx(null);
    setActiveWord(null);
  }

  function stopAll() {
    cancelRef.current = true;
    stopSpeaking();
    setPlayingAll(false);
    setCurrentIdx(null);
    setActiveWord(null);
  }

  const nowPlaying = currentIdx !== null ? visibleSentences[currentIdx] : null;

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-32">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-[oklch(0.96_0.025_180)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">Vocabulary</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.title}</p>
          </div>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 border-t border-border/50 bg-background/60 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>Today</span>
          </div>
          <Stat label="PRACTICED" value={String(stats.practiced)} />
          <Stat label="REPS" value={String(stats.reps)} />
          <Stat label="MASTERED" value={`${stats.mastered}/${total}`} />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4">
        {/* Play bar — stacks on narrow screens */}
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={playingAll ? stopAll : playAll}
              disabled={!sentences.length || !speechReady}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-40"
              aria-label={playingAll ? "Stop" : "Play all"}
            >
              {playingAll ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
            </button>
            <span className="text-sm font-semibold text-foreground">Rep {settings.reps}×</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <IconBtn
                label="Listen mode"
                active={listenMode}
                onClick={() => setListenMode((v) => !v)}
              >
                <Headphones className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={grammar ? "Grammar notes" : "No grammar notes for this list yet"}
                onClick={() => grammar && setGrammarOpen(true)}
                active={grammarOpen}
                disabled={!grammar}
              >
                <BookOpen className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Settings" onClick={() => setSettingsOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <IconBtn label="Help"><HelpCircle className="h-4 w-4" /></IconBtn>
          <IconBtn
            label="Favorites only"
            active={favoritesOnly}
            onClick={() => setFavoritesOnly((v) => !v)}
          >
            <Heart className={cn("h-4 w-4", favoritesOnly && "fill-current")} />
          </IconBtn>
          <button
            onClick={() => {
              const v = !showTranslit;
              setShowTranslit(v);
              setSettings({ showTransliteration: v });
            }}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-2 text-sm text-foreground",
              showTranslit && "bg-primary/10 text-primary border-primary/40",
            )}
            aria-pressed={showTranslit}
          >
            <Languages className="h-4 w-4" />
            <span className={cn("ml-1 h-5 w-9 rounded-full p-0.5 transition", showTranslit ? "bg-primary" : "bg-muted")}>
              <span
                className={cn(
                  "block h-4 w-4 rounded-full bg-white shadow transition",
                  showTranslit ? "translate-x-4" : "translate-x-0",
                )}
              />
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <IconBtn label="Calendar"><CalendarIcon className="h-4 w-4" /></IconBtn>
            <IconBtn
              label="Search"
              active={searchOpen || !!query}
              onClick={() => {
                setSearchOpen((v) => {
                  if (v) setQuery("");
                  return !v;
                });
              }}
            >
              <Search className="h-4 w-4" />
            </IconBtn>
            <IconBtn label="Settings" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-4 w-4" />
            </IconBtn>
          </div>
        </div>

        {searchOpen && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Russian, English, or transliteration…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {listenMode && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
            Listen mode: Russian text is hidden. Tap a card to reveal.
          </div>
        )}

        {!sentences.length && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">Sentences are still cooking…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This list is being generated. Check back in a moment, or pick another list.
            </p>
          </div>
        )}

        {sentences.length > 0 && visibleSentences.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">No matches</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {favoritesOnly
                ? "You haven't favorited any sentences in this list yet."
                : "Try a different search term."}
            </p>
          </div>
        )}

        <ul className="mt-4 space-y-3">
          {visibleSentences.map((s, idx) => {
            const stars = progress[s.id]?.stars ?? 0;
            const fav = !!favorites[s.id];
            const active = currentIdx === idx;
            const focused = focusId === s.id;
            return (
              <ListenCard
                key={s.id}
                idx={idx}
                sentence={s}
                stars={stars}
                fav={fav}
                active={active}
                focused={focused}
                activeWord={active ? activeWord : null}
                listenMode={listenMode}
                showTranslit={showTranslit}
                textSizeClass={TEXT_SIZE_CLASS[settings.textSize]}
                toneBorder={tone.border}
                speechReady={speechReady}
                onPlay={() => playOne(idx)}
                onPlayWord={playWord}
                onStars={(v) => setStars(s.id, v)}
                onToggleFav={() => toggleFavorite(s.id)}
              />
            );
          })}

        </ul>
      </main>

      {/* Sticky now-playing bar */}
      {nowPlaying && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              #{(currentIdx ?? 0) + 1}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{nowPlaying.en}</p>
            <button
              onClick={stopAll}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90"
              aria-label="Stop"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          </div>
        </div>
      )}

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      {grammar && (
        <GrammarSheet
          pack={grammar}
          open={grammarOpen}
          onOpenChange={setGrammarOpen}
          onSpeak={(t) => speak(t, { rate: settings.speed })}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[10px] font-semibold tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-card transition",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed hover:bg-card hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function maskText(text: string): string {
  return text.replace(/\S/g, "*");
}

function ListenCard({
  idx,
  sentence,
  stars,
  fav,
  active,
  focused,
  activeWord,
  listenMode,
  showTranslit,
  textSizeClass,
  toneBorder,
  speechReady,
  onPlay,
  onPlayWord,
  onStars,
  onToggleFav,
}: {
  idx: number;
  sentence: { id: string; ru: string; ruStressed?: string; en: string; translit?: string };
  stars: number;
  fav: boolean;
  active: boolean;
  focused: boolean;
  activeWord: number | null;
  listenMode: boolean;
  showTranslit: boolean;
  textSizeClass: string;
  toneBorder: string;
  speechReady: boolean;
  onPlay: () => void;
  onPlayWord: (word: string) => void;
  onStars: (v: number) => void;
  onToggleFav: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!listenMode) setRevealed(false);
  }, [listenMode]);
  const hideRu = listenMode && !revealed;
  const maskRu = !listenMode && !showTranslit;

  const tokens = useMemo(
    () => tokenizeStressed(sentence.ruStressed || sentence.ru),
    [sentence.ruStressed, sentence.ru],
  );

  return (
    <li
      id={`s-${sentence.id}`}
      className={cn(
        "relative scroll-mt-24 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition border-l-4",
        toneBorder,
        active && "ring-2 ring-primary/40",
        focused && "ring-2 ring-primary/70 shadow-lg",
      )}
    >

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-primary">#{idx + 1}</span>
        <button
          onClick={onPlay}
          disabled={!speechReady}
          className="grid h-10 w-10 place-items-center rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-40"
          aria-label="Play sentence"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleFav}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={fav}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-lg border transition",
            fav
              ? "border-rose-300 bg-rose-50 text-rose-500"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Heart className={cn("h-4 w-4", fav && "fill-current")} />
        </button>
        <div className="ml-auto">
          <StarRow value={stars} onChange={onStars} />
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground/80">{sentence.en}</p>

      {hideRu ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-4 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          Tap to reveal Russian
        </button>
      ) : maskRu ? (
        <p
          className={cn(
            "mt-3 font-semibold leading-snug tracking-widest text-muted-foreground select-none",
            textSizeClass,
          )}
          aria-label="Russian hidden"
        >
          {maskText(sentence.ruStressed || sentence.ru)}
        </p>
      ) : (
        <>
          <p
            className={cn("mt-3 font-semibold leading-relaxed text-foreground break-words", textSizeClass)}
            lang="ru"
          >
            {tokens.map((tok, i) => {
              if (tok.type === "sep") return <span key={i}>{tok.raw}</span>;
              const [before, vowel, after] = splitStressedWord(tok.raw);
              const isActive = activeWord === tok.wordIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayWord(tok.plain);
                  }}
                  disabled={!speechReady}
                  className={cn(
                    "rounded-md px-0.5 py-0.5 transition -my-0.5",
                    "hover:bg-primary/10 active:bg-primary/20",
                    isActive && "bg-primary/20 text-primary",
                  )}
                  aria-label={`Play word ${tok.plain}`}
                >
                  {before}
                  {vowel && (
                    <span className="text-primary underline decoration-primary/60 decoration-2 underline-offset-4">
                      {vowel}
                    </span>
                  )}
                  {after}
                </button>
              );
            })}
          </p>
          {showTranslit && sentence.translit && (
            <p className="mt-2 text-sm italic text-muted-foreground break-words">{sentence.translit}</p>
          )}
        </>
      )}
    </li>
  );
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            onClick={() => onChange(n === value ? n - 1 : n)}
            aria-label={`${n} stars`}
            className="grid h-8 w-8 place-items-center"
          >
            <Star
              className={cn(
                "h-4 w-4 transition",
                filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const settings = useTrainerStore((s) => s.settings);
  const setSettings = useTrainerStore((s) => s.setSettings);

  const reps = [1, 2, 3, 4, 5] as const;
  const pauses = [0, 0.5, 1, 1.5, 2, 2.5] as const;
  const sizes: { key: TextSize; label: string }[] = [
    { key: "xs", label: "A-" },
    { key: "sm", label: "A" },
    { key: "md", label: "A+" },
    { key: "lg", label: "A++" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="flex-row items-start gap-3 space-y-0">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <SettingsIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <SheetTitle>Practice Settings</SheetTitle>
            <SheetDescription>Customize repetitions, pauses, and playback.</SheetDescription>
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Group title="Repetitions per Sentence">
            <Chips
              values={reps as readonly number[]}
              selected={settings.reps}
              onSelect={(v) => setSettings({ reps: v as 1 | 2 | 3 | 4 | 5 })}
              format={(v) => `${v}×`}
            />
          </Group>

          <Group title="Pause Duration">
            <Chips
              values={pauses as readonly number[]}
              selected={settings.pauseSeconds}
              onSelect={(v) =>
                setSettings({ pauseSeconds: v as 0 | 0.5 | 1 | 1.5 | 2 | 2.5 })
              }
              format={(v) => `${v}s`}
            />
          </Group>

          <Group title="Playback Speed">
            <div className="text-sm font-semibold text-primary">{settings.speed}× Normal</div>
            <Slider
              value={[settings.speed]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={(v) => setSettings({ speed: Number(v[0].toFixed(1)) })}
              className="mt-3"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>0.5×</span>
              <span>1×</span>
              <span>1.5×</span>
              <span>2×</span>
            </div>
          </Group>

          <Group title="Text size">
            <div className="flex gap-2">
              {sizes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSettings({ textSize: s.key })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                    settings.textSize === s.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Group>

          <Group title="Transliteration">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Show or hide the pronunciation hint below the Russian text.
              </p>
              <Switch
                checked={settings.showTransliteration}
                onCheckedChange={(v) => setSettings({ showTransliteration: v })}
              />
            </div>
          </Group>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 text-sm font-semibold text-foreground">{title}</div>
      {children}
    </div>
  );
}

function Chips<T extends number>({
  values,
  selected,
  onSelect,
  format,
}: {
  values: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
  format: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={cn(
            "min-w-12 rounded-full border px-4 py-1.5 text-sm font-semibold transition",
            selected === v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {format(v)}
        </button>
      ))}
    </div>
  );
}

// Tiny inline markdown renderer: **bold** and _italic_.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|_([^_]+)_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2]) out.push(<strong key={key++} className="font-semibold text-foreground">{m[2]}</strong>);
    else if (m[3]) out.push(<em key={key++}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function GrammarSheet({
  pack,
  open,
  onOpenChange,
  onSpeak,
}: {
  pack: GrammarPack;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSpeak: (text: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="flex-row items-start gap-3 space-y-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle>Grammar notes</SheetTitle>
            <SheetDescription>Short reference for this list. Tap any example to hear it.</SheetDescription>
          </div>
        </SheetHeader>
        {pack.intro && (
          <p className="mt-4 rounded-2xl border border-border/60 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
            {renderInline(pack.intro)}
          </p>
        )}
        <div className="mt-3 space-y-3">
          {pack.notes.map((note, i) => (
            <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold text-foreground">{note.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {renderInline(note.body)}
              </p>
              {note.examples && note.examples.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {note.examples.map((ex, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/60 p-2"
                    >
                      <button
                        onClick={() => onSpeak(ex.ru)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                        aria-label={`Play ${ex.ru}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p lang="ru" className="text-sm font-semibold text-foreground break-words">
                          {ex.ru}
                        </p>
                        <p className="text-xs text-muted-foreground break-words">{ex.en}</p>
                        {ex.note && (
                          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-primary">{ex.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
