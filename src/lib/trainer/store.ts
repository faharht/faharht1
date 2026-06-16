import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SentenceProgress, TrainerSettings } from "./types";

interface TrainerState {
  settings: TrainerSettings;
  // Map sentenceId -> progress
  progress: Record<string, SentenceProgress>;
  favorites: Record<string, boolean>;
  setSettings: (patch: Partial<TrainerSettings>) => void;
  setStars: (sentenceId: string, stars: number) => void;
  bumpReps: (sentenceId: string, by?: number) => void;
  toggleFavorite: (sentenceId: string) => void;
}

const defaultSettings: TrainerSettings = {
  reps: 1,
  pauseSeconds: 0.5,
  speed: 1,
  textSize: "lg",
  showTransliteration: true,
};

export const useTrainerStore = create<TrainerState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      progress: {},
      favorites: {},
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
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
      bumpReps: (sentenceId, by = 1) =>
        set((s) => {
          const prev = s.progress[sentenceId] ?? { stars: 0, reps: 0 };
          return {
            progress: {
              ...s.progress,
              [sentenceId]: {
                ...prev,
                reps: prev.reps + by,
                lastPracticedAt: Date.now(),
              },
            },
          };
        }),
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
