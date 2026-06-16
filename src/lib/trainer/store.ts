import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SentenceProgress, TrainerSettings } from "./types";

interface TrainerState {
  settings: TrainerSettings;
  // Map sentenceId -> progress
  progress: Record<string, SentenceProgress>;
  favorites: Record<string, boolean>;
  // Daily goal & streak
  dailyGoal: number;
  dailyHistory: Record<string, number>; // YYYY-MM-DD -> reps that day
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // last date that hit the goal
  setSettings: (patch: Partial<TrainerSettings>) => void;
  setStars: (sentenceId: string, stars: number) => void;
  bumpReps: (sentenceId: string, by?: number) => { goalReachedNow: boolean };
  toggleFavorite: (sentenceId: string) => void;
  setDailyGoal: (n: number) => void;
}

const defaultSettings: TrainerSettings = {
  reps: 1,
  pauseSeconds: 0.5,
  speed: 1,
  textSize: "lg",
  showTransliteration: true,
};

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey(today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return todayKey(dt);
}

function trimHistory(h: Record<string, number>, keep = 120): Record<string, number> {
  const keys = Object.keys(h).sort();
  if (keys.length <= keep) return h;
  const drop = keys.slice(0, keys.length - keep);
  const next = { ...h };
  for (const k of drop) delete next[k];
  return next;
}

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      progress: {},
      favorites: {},
      dailyGoal: 20,
      dailyHistory: {},
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setDailyGoal: (n) =>
        set(() => ({ dailyGoal: Math.max(1, Math.min(500, Math.round(n))) })),
      toggleFavorite: (sentenceId) =>
        set((s) => {
          const next = { ...s.favorites };
          if (next[sentenceId]) delete next[sentenceId];
          else next[sentenceId] = true;
          return { favorites: next };
        }),
      setStars: (sentenceId, stars) =>
        set((s) => {
          const prev = s.progress[sentenceId] ?? { stars: 0, reps: 0 };
          return {
            progress: {
              ...s.progress,
              [sentenceId]: { ...prev, stars, lastPracticedAt: Date.now() },
            },
          };
        }),
      bumpReps: (sentenceId, by = 1) => {
        const today = todayKey();
        const s = get();
        const prevP = s.progress[sentenceId] ?? { stars: 0, reps: 0 };
        const prevToday = s.dailyHistory[today] ?? 0;
        const newToday = prevToday + by;
        const goal = s.dailyGoal;
        const goalReachedNow = prevToday < goal && newToday >= goal;

        // Compute streak update if goal reached today and not yet credited.
        let currentStreak = s.currentStreak;
        let longestStreak = s.longestStreak;
        let lastActiveDate = s.lastActiveDate;
        if (goalReachedNow) {
          if (lastActiveDate === today) {
            // already counted (shouldn't happen — goalReachedNow guards)
          } else if (lastActiveDate === yesterdayKey(today)) {
            currentStreak = currentStreak + 1;
          } else {
            currentStreak = 1;
          }
          lastActiveDate = today;
          longestStreak = Math.max(longestStreak, currentStreak);
        }

        // If lastActiveDate is older than yesterday AND not today, streak should
        // visually be 0 — we lazily reset on next bump that doesn't hit goal too.
        if (!goalReachedNow && lastActiveDate && lastActiveDate !== today) {
          if (lastActiveDate !== yesterdayKey(today)) {
            // gap of 2+ days → broken
            currentStreak = 0;
          }
        }

        set({
          progress: {
            ...s.progress,
            [sentenceId]: {
              ...prevP,
              reps: prevP.reps + by,
              lastPracticedAt: Date.now(),
            },
          },
          dailyHistory: trimHistory({ ...s.dailyHistory, [today]: newToday }),
          currentStreak,
          longestStreak,
          lastActiveDate,
        });
        return { goalReachedNow };
      },
    }),
    { name: "ru-trainer:v1" },
  ),
);

export function summarizeList(
  progress: Record<string, SentenceProgress>,
  ids: string[],
) {
  let practiced = 0;
  let reps = 0;
  let mastered = 0;
  for (const id of ids) {
    const p = progress[id];
    if (!p) continue;
    if (p.reps > 0) practiced += 1;
    reps += p.reps;
    if (p.stars >= 5) mastered += 1;
  }
  return { practiced, reps, mastered };
}

export const TEXT_SIZE_CLASS: Record<TrainerSettings["textSize"], string> = {
  xs: "text-base",
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};
