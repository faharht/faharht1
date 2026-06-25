import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Flame,
  Headphones,
  Heart,
  HelpCircle,
  Languages,
  Lock,
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
import { sentencesQueryOptions } from "@/lib/trainer/sentences";
import { useQuery } from "@tanstack/react-query";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { StreakStrip } from "@/components/StreakStrip";

import { summarizeList, TEXT_SIZE_CLASS, useTrainerStore, todayKey } from "@/lib/trainer/store";
import { hasSpeech, speak, stopSpeaking } from "@/lib/trainer/speech";
import { getGrammar, type GrammarPack } from "@/lib/trainer/grammar";
import { toast } from "sonner";
import { useDayTick } from "@/lib/trainer/useDayTick";
import { useT } from "@/lib/i18n/useT";
import { LOCALES } from "@/lib/i18n/strings";

const GUEST_AUDIO_LIMIT = 50;

function useNotifyGoal() {
  const { t } = useT();
  return (result: { goalReachedNow: boolean; challengeCompletedNow?: boolean }) => {
    if (result.goalReachedNow) toast.success(t("toast.goalReached"), { duration: 3500 });
    if (result.challengeCompletedNow) toast.success(t("toast.challengeDone"), { duration: 5000 });
  };
}


import { splitStressedWord, tokenizeStressed } from "@/lib/trainer/stress";
import type { TextSize } from "@/lib/trainer/types";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/list/$listId")({
  loader: ({ params, context }) => {
    const meta = findList(params.listId);
    if (!meta) throw notFound();
    void context.queryClient.prefetchQuery(sentencesQueryOptions(meta.id));
    return { meta };
  },

  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.meta.title} — Russian Trainer` },
          { name: "description", content: `Practice Russian: ${loaderData.meta.description}.` },
        ]
      : [],
  }),
  component: ListPage,
});

function ListPage() {
  useDayTick();
  const { t, locale } = useT();
  const notifyGoal = useNotifyGoal();
  const navigate = useNavigate();
  const { data: sessionUser } = useQuery(sessionUserQueryOptions);
  const isGuest = !sessionUser;

  const { meta } = Route.useLoaderData();
  const { data: sentences = [], isLoading: sentencesLoading } = useQuery(sentencesQueryOptions(meta.id));
  const settings = useTrainerStore((s) => s.settings);
  const progress = useTrainerStore((s) => s.progress);
  const favorites = useTrainerStore((s) => s.favorites);
  const setStars = useTrainerStore((s) => s.setStars);
  const bumpReps = useTrainerStore((s) => s.bumpReps);
  const setSettings = useTrainerStore((s) => s.setSettings);
  const toggleFavorite = useTrainerStore((s) => s.toggleFavorite);
  useTrainerStore((s) => s.dayCounter);

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




  const trText = (s: { en: string; pl?: string; de?: string }) => {
    if (locale === "pl" && s.pl) return s.pl;
    if (locale === "de" && s.de) return s.de;
    return s.en;
  };

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
          (s.pl?.toLowerCase().includes(q) ?? false) ||
          (s.de?.toLowerCase().includes(q) ?? false) ||
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

  // Auto-scroll the currently playing sentence into view when it changes,
  // but only if it's not already comfortably visible.
  useEffect(() => {
    if (currentIdx === null) return;
    const s = visibleSentences[currentIdx];
    if (!s) return;
    const el = document.getElementById(`s-${s.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const margin = 96; // px from edges before we re-center
    const offscreen = rect.top < margin || rect.bottom > vh - margin;
    if (offscreen) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIdx, visibleSentences]);

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
    if (isGuest && idx >= GUEST_AUDIO_LIMIT) {
      toast.info(t("guestLock.toast"));
      navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    stopSpeaking();
    setPlayingAll(false);
    cancelRef.current = true;
    setCurrentIdx(idx);
    setActiveWord(null);
    const s = visibleSentences[idx];
    if (!s) return;
    notifyGoal(bumpReps(s.id, 1));

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

  function playWord(word: string, idx?: number) {
    if (!hasSpeech()) return;
    if (isGuest && typeof idx === "number" && idx >= GUEST_AUDIO_LIMIT) {
      toast.info(t("guestLock.toast"));
      navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    speak(word, { rate: settings.speed });
  }

  async function playAll() {
    if (!hasSpeech()) return;
    setPlayingAll(true);
    cancelRef.current = false;
    const limit = isGuest
      ? Math.min(visibleSentences.length, GUEST_AUDIO_LIMIT)
      : visibleSentences.length;
    for (let i = 0; i < limit; i++) {
      if (cancelRef.current) break;
      setCurrentIdx(i);
      setActiveWord(null);
      const s = visibleSentences[i];
      const handler = makeBoundaryHandler(s.ru);
      for (let r = 0; r < settings.reps; r++) {
        if (cancelRef.current) break;
        notifyGoal(bumpReps(s.id, 1));
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
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">{t("list.vocabulary")}</h1>
            <p className="truncate text-xs text-white/75">{t(meta.titleKey, meta.titleVars)}</p>
          </div>
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-4">
          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3 text-slate-900 shadow-sm">
            <div className="flex flex-col items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <CalendarIcon className="mb-1 h-4 w-4 text-blue-600" />
              <span className="truncate">{t("common.today")}</span>
            </div>
            <Stat label={t("list.stat.practiced")} value={String(stats.practiced)} />
            <Stat label={t("list.stat.reps")} value={String(stats.reps)} />
            <Stat label={t("list.stat.mastered")} value={`${stats.mastered}/${total}`} />
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-2xl px-4">
        {/* Play bar */}
        <div className="mt-4 rounded-2xl bg-white p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={playingAll ? stopAll : playAll}
              disabled={!sentences.length || !speechReady}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
              aria-label={playingAll ? t("list.stop") : t("list.play")}
            >
              {playingAll ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
            </button>
            <span className="text-sm font-semibold text-slate-900">{t("list.rep", { n: settings.reps })}</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <IconBtn
                label={t("list.listenMode")}
                active={listenMode}
                onClick={() => setListenMode((v) => !v)}
              >
                <Headphones className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={grammar ? t("list.grammar") : t("list.grammar.none")}
                onClick={() => grammar && setGrammarOpen(true)}
                active={grammarOpen}
                disabled={!grammar}
              >
                <BookOpen className="h-4 w-4" />
              </IconBtn>
              <IconBtn label={t("list.settings")} onClick={() => setSettingsOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
              </IconBtn>
            </div>
          </div>
        </div>

        {/* Daily streak */}
        <StreakStrip />


        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <IconBtn label={t("list.help")}><HelpCircle className="h-4 w-4" /></IconBtn>
          <IconBtn
            label={t("list.favoritesOnly")}
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
            <IconBtn label={t("list.calendar")}><CalendarIcon className="h-4 w-4" /></IconBtn>
            <IconBtn
              label={t("list.search")}
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
            <IconBtn label={t("list.settings")} onClick={() => setSettingsOpen(true)}>
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
              placeholder={t("list.searchPh")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label={t("list.clearSearch")}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {listenMode && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
            {t("list.listenModeHint")}
          </div>
        )}

        {sentencesLoading && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">{t("common.pleaseWait")}</p>
          </div>
        )}

        {!sentencesLoading && !sentences.length && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">{t("list.empty.cookingTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("list.empty.cookingDesc")}</p>
          </div>
        )}


        {sentences.length > 0 && visibleSentences.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-foreground">{t("list.empty.noMatches")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {favoritesOnly ? t("list.empty.noFavs") : t("list.empty.tryAnother")}
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
                translation={trText(s)}
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
                locked={isGuest && idx >= GUEST_AUDIO_LIMIT}
                onPlay={() => playOne(idx)}
                onPlayWord={(w) => playWord(w, idx)}
                onStars={(v) => setStars(s.id, v)}
                onToggleFav={() => toggleFavorite(s.id)}
                onUnlock={() => navigate({ to: "/auth", search: { mode: "signin" } })}
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
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">{trText(nowPlaying)}</p>
            <button
              onClick={stopAll}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90"
              aria-label={t("list.stop")}
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
          sentences={sentences}
          open={grammarOpen}
          onOpenChange={setGrammarOpen}
          onSpeak={(t) => speak(t, { rate: settings.speed })}
          onJump={(id) => {
            setGrammarOpen(false);
            setFocusId(id);
          }}
        />
      )}

    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <div className="text-lg font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1 truncate text-[10px] font-semibold tracking-wider text-slate-500">
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
        "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
        active
          ? "bg-blue-100 text-blue-600"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
        disabled && "opacity-40 cursor-not-allowed hover:bg-slate-100 hover:text-slate-500",
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
  translation,
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
  locked,
  onPlay,
  onPlayWord,
  onStars,
  onToggleFav,
  onUnlock,
}: {
  idx: number;
  sentence: { id: string; ru: string; ruStressed?: string; en: string; pl?: string; translit?: string };
  translation: string;
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
  locked: boolean;
  onPlay: () => void;
  onPlayWord: (word: string) => void;
  onStars: (v: number) => void;
  onToggleFav: () => void;
  onUnlock: () => void;
}) {
  const { t } = useT();
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
        "relative scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm transition",
        active && "ring-2 ring-blue-400",
        focused && "ring-2 ring-blue-500 shadow-lg",
      )}
    >

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-blue-600">#{idx + 1}</span>
        <button
          onClick={locked ? onUnlock : onPlay}
          disabled={!speechReady}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full transition disabled:opacity-40",
            locked
              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
              : "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm hover:opacity-90",
          )}
          aria-label={locked ? t("guestLock.cardTitle") : t("list.card.playSentence")}
        >
          {locked ? <Lock className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          onClick={onToggleFav}
          aria-label={fav ? t("list.card.removeFav") : t("list.card.addFav")}
          aria-pressed={fav}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full transition",
            fav
              ? "bg-rose-100 text-rose-500"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600",
          )}
        >
          <Heart className={cn("h-4 w-4", fav && "fill-current")} />
        </button>
        <div className="ml-auto">
          <StarRow value={stars} onChange={onStars} />
        </div>
      </div>


      <p className="mt-3 text-sm text-foreground/80">{translation}</p>

      {hideRu ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-3 py-4 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          {t("list.card.tapReveal")}
        </button>
      ) : maskRu ? (
        <p
          className={cn(
            "mt-3 font-semibold leading-snug tracking-widest text-muted-foreground select-none",
            textSizeClass,
          )}
          aria-label={t("list.card.ruHidden")}
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
                    if (locked) onUnlock();
                    else onPlayWord(tok.plain);
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
      {locked && (
        <button
          onClick={onUnlock}
          className="mt-3 flex w-full items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-left text-xs text-amber-900 hover:bg-amber-100"
        >
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">
            <span className="block font-semibold">{t("guestLock.cardTitle")}</span>
            <span className="block text-[11px] text-amber-800/90">{t("guestLock.cardHint")}</span>
          </span>
        </button>
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
  const { t } = useT();
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
            <SheetTitle>{t("settings.title")}</SheetTitle>
            <SheetDescription>{t("settings.desc")}</SheetDescription>
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Group title={t("settings.appLanguage")}>
            <p className="text-xs text-muted-foreground mb-3">{t("settings.appLangHint")}</p>
            <div className="grid grid-cols-3 gap-2">
              {LOCALES.map((opt) => {
                const active = settings.appLanguage === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSettings({ appLanguage: opt.id })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span aria-hidden>{opt.flag}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group title={t("settings.reps")}>
            <Chips
              values={reps as readonly number[]}
              selected={settings.reps}
              onSelect={(v) => setSettings({ reps: v as 1 | 2 | 3 | 4 | 5 })}
              format={(v) => `${v}×`}
            />
          </Group>

          <Group title={t("settings.pause")}>
            <Chips
              values={pauses as readonly number[]}
              selected={settings.pauseSeconds}
              onSelect={(v) =>
                setSettings({ pauseSeconds: v as 0 | 0.5 | 1 | 1.5 | 2 | 2.5 })
              }
              format={(v) => `${v}s`}
            />
          </Group>

          <Group title={t("settings.speed")}>
            <div className="text-sm font-semibold text-primary">
              {t("settings.speedNormal", { n: settings.speed })}
            </div>
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

          <Group title={t("settings.textSize")}>
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

          <Group title={t("settings.translit")}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t("settings.translitHint")}</p>
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
  sentences,
  open,
  onOpenChange,
  onSpeak,
  onJump,
}: {
  pack: GrammarPack;
  sentences: Array<{ id: string; ru: string; ruStressed?: string; en: string; pl?: string; de?: string; translit?: string }>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSpeak: (text: string) => void;
  onJump: (id: string) => void;
}) {
  const { t, locale } = useT();
  const trText = (s: { en: string; pl?: string; de?: string }) => {
    if (locale === "pl" && s.pl) return s.pl;
    if (locale === "de" && s.de) return s.de;
    return s.en;
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="flex-row items-start gap-3 space-y-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle>{t("grammar.title")}</SheetTitle>
            <SheetDescription>{t("grammar.desc")}</SheetDescription>
            {pack.tags && pack.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {pack.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </SheetHeader>
        {(() => {
          const intro = locale === "pl" ? (pack.intro_pl ?? pack.intro)
                      : locale === "de" ? (pack.intro_de ?? pack.intro)
                      : pack.intro;
          return intro ? (
            <p className="mt-4 rounded-2xl border border-border/60 bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
              {renderInline(intro)}
            </p>
          ) : null;
        })()}
        <div className="mt-3 space-y-3">
          {pack.notes.map((note, i) => {
            const matches = resolveMatches(note, sentences);
            const title = locale === "pl" ? (note.title_pl ?? note.title)
                        : locale === "de" ? (note.title_de ?? note.title)
                        : note.title;
            const body = locale === "pl" ? (note.body_pl ?? note.body)
                       : locale === "de" ? (note.body_de ?? note.body)
                       : note.body;
            return (
              <div key={i} className="rounded-2xl border border-border/60 bg-card p-4">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {renderInline(body)}
                </p>
                {note.examples && note.examples.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {note.examples.map((ex, j) => {
                      const exEn = locale === "pl" ? (ex.en_pl ?? ex.en)
                                 : locale === "de" ? (ex.en_de ?? ex.en)
                                 : ex.en;
                      const exNote = locale === "pl" ? (ex.note_pl ?? ex.note)
                                   : locale === "de" ? (ex.note_de ?? ex.note)
                                   : ex.note;
                      return (
                      <li
                        key={j}
                        className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/60 p-2"
                      >
                        <button
                          onClick={() => onSpeak(ex.ru)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                          aria-label={t("grammar.play", { t: ex.ru })}
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p lang="ru" className="text-sm font-semibold text-foreground break-words">
                            {ex.ru}
                          </p>
                          <p className="text-xs text-muted-foreground break-words">{exEn}</p>
                          {exNote && (
                            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-primary">{exNote}</p>
                          )}
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}
                {matches.length > 0 && (
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("grammar.fromList")}
                    </p>
                    <ul className="space-y-2">
                      {matches.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-start gap-2 rounded-lg border border-dashed border-border/60 bg-background/40 p-2"
                        >
                          <button
                            onClick={() => onSpeak(s.ru)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            aria-label={t("grammar.play", { t: s.ru })}
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p lang="ru" className="text-sm font-semibold text-foreground break-words">
                              {s.ru}
                            </p>
                            <p className="text-xs text-muted-foreground break-words">{trText(s)}</p>
                            <button
                              onClick={() => onJump(s.id)}
                              className="mt-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                            >
                              {t("grammar.jump")}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeWholeWordRegex(needle: string): RegExp {
  return new RegExp(`(?<![\\p{L}])${escapeRegex(needle.trim())}(?![\\p{L}])`, "iu");
}

function makeEndsWithRegex(suffix: string): RegExp {
  return new RegExp(`[\\p{L}]*${escapeRegex(suffix.trim())}(?![\\p{L}])`, "iu");
}

function resolveMatches(
  note: GrammarPack["notes"][number],
  sentences: Array<{ id: string; ru: string; en: string }>,
): Array<{ id: string; ru: string; en: string }> {
  const out: Array<{ id: string; ru: string; en: string }> = [];
  const seen = new Set<string>();
  if (note.matchIds) {
    for (const id of note.matchIds) {
      const s = sentences.find((x) => x.id === id);
      if (s && !seen.has(s.id)) {
        out.push(s);
        seen.add(s.id);
      }
    }
  }
  const contains = note.match?.contains ?? [];
  const endsWith = note.match?.endsWith ?? [];
  const containsRx = contains.map(makeWholeWordRegex);
  const endsWithRx = endsWith.map(makeEndsWithRegex);
  if ((containsRx.length > 0 || endsWithRx.length > 0) && out.length < 5) {
    for (const s of sentences) {
      if (out.length >= 5) break;
      if (seen.has(s.id)) continue;
      const hay = s.ru + " " + s.en;
      const hit =
        containsRx.some((rx) => rx.test(hay)) ||
        endsWithRx.some((rx) => rx.test(hay));
      if (hit) {
        out.push(s);
        seen.add(s.id);
      }
    }
  }
  return out.slice(0, 5);
}

