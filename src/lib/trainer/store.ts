import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SentenceProgress, TrainerSettings } from "./types";

export type ChallengeGoal = 100 | 500 | 1000 | 2500;
export const CHALLENGE_GOALS: ChallengeGoal[] = [100, 500, 1000, 2500];
export const CHALLENGE_LENGTH_DAYS = 14;

export interface Challenge {
  goal: ChallengeGoal;
  startedOn: string; // YYYY-MM-DD
  daysCompleted: number; // hit-goal days within the active challenge
  finishedOn: string | null; // ISO date when completed
}

export type BadgeId = "challenge100" | "challenge500" | "challenge1000" | "challenge2500";

interface TrainerState {
  settings: TrainerSettings;
  progress: Record<string, SentenceProgress>;
  favorites: Record<string, boolean>;
  // Daily goal & streak
  dailyGoal: number;
  dailyHistory: Record<string, number>; // YYYY-MM-DD -> reps that day
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  // Challenge + badges
  challenge: Challenge | null;
  badges: Partial<Record<BadgeId, string>>; // value = ISO date earned
  // Midnight ticker — bump to force re-renders when the day changes
  dayCounter: number;
  setSettings: (patch: Partial<TrainerSettings>) => void;
  setStars: (sentenceId: string, stars: number) => void;
  bumpReps: (sentenceId: string, by?: number) => {
    goalReachedNow: boolean;
    challengeCompletedNow: boolean;
    badgeEarned: BadgeId | null;
  };
  toggleFavorite: (sentenceId: string) => void;
  setDailyGoal: (n: number) => void;
  startChallenge: (goal: ChallengeGoal) => void;
  resetChallengeWithNewGoal: (goal: ChallengeGoal) => void;
  tickDay: () => void;
}

const defaultSettings: TrainerSettings = {
  reps: 1,
  pauseSeconds: 0.5,
  speed: 1,
  textSize: "lg",
  showTransliteration: true,
  appLanguage: "en",
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

function badgeForGoal(goal: ChallengeGoal): BadgeId {
  return (`challenge${goal}` as BadgeId);
}

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      progress: {},
      favorites: {},
      dailyGoal: 100,
      dailyHistory: {},
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      challenge: null,
      badges: {},
      dayCounter: 0,
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setDailyGoal: (n) =>
        set(() => ({ dailyGoal: Math.max(1, Math.min(5000, Math.round(n))) })),
      startChallenge: (goal) =>
        set(() => ({
          challenge: {
            goal,
            startedOn: todayKey(),
            daysCompleted: 0,
            finishedOn: null,
          },
          dailyGoal: goal,
          currentStreak: 0,
          lastActiveDate: null,
        })),
      resetChallengeWithNewGoal: (goal) =>
        set(() => ({
          challenge: {
            goal,
            startedOn: todayKey(),
            daysCompleted: 0,
            finishedOn: null,
          },
          dailyGoal: goal,
          currentStreak: 0,
          lastActiveDate: null,
        })),
      tickDay: () =>
        set((s) => {
          const today = todayKey();
          let currentStreak = s.currentStreak;
          if (s.lastActiveDate && s.lastActiveDate !== today && s.lastActiveDate !== yesterdayKey(today)) {
            currentStreak = 0;
          }
          return { dayCounter: s.dayCounter + 1, currentStreak };
        }),
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
        const goal = s.challenge?.goal ?? s.dailyGoal;
        const goalReachedNow = prevToday < goal && newToday >= goal;

        let currentStreak = s.currentStreak;
        let longestStreak = s.longestStreak;
        let lastActiveDate = s.lastActiveDate;
        let challenge = s.challenge;
        let badges = s.badges;
        let challengeCompletedNow = false;
        let badgeEarned: BadgeId | null = null;

        if (goalReachedNow) {
          if (lastActiveDate === today) {
            // already counted
          } else if (lastActiveDate === yesterdayKey(today)) {
            currentStreak = currentStreak + 1;
          } else {
            currentStreak = 1;
          }
          lastActiveDate = today;
          longestStreak = Math.max(longestStreak, currentStreak);

          if (challenge && !challenge.finishedOn) {
            const daysCompleted = challenge.daysCompleted + 1;
            if (daysCompleted >= CHALLENGE_LENGTH_DAYS) {
              const badgeId = badgeForGoal(challenge.goal);
              challenge = { ...challenge, daysCompleted, finishedOn: today };
              if (!badges[badgeId]) {
                badges = { ...badges, [badgeId]: today };
                badgeEarned = badgeId;
              }
              challengeCompletedNow = true;
            } else {
              challenge = { ...challenge, daysCompleted };
            }
          }
        }

        if (!goalReachedNow && lastActiveDate && lastActiveDate !== today) {
          if (lastActiveDate !== yesterdayKey(today)) {
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
          challenge,
          badges,
        });
        return { goalReachedNow, challengeCompletedNow, badgeEarned };
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

export const BADGE_META: Record<BadgeId, { goal: ChallengeGoal; label: string; color: string; ring: string }> = {
  challenge100: { goal: 100, label: "100/day · 14 days", color: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-300" },
  challenge500: { goal: 500, label: "500/day · 14 days", color: "bg-sky-100 text-sky-700", ring: "ring-sky-300" },
  challenge1000: { goal: 1000, label: "1000/day · 14 days", color: "bg-violet-100 text-violet-700", ring: "ring-violet-300" },
  challenge2500: { goal: 2500, label: "2500/day · 14 days", color: "bg-amber-100 text-amber-700", ring: "ring-amber-300" },
};
