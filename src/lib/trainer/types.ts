export interface Sentence {
  id: string;
  ru: string;
  ruStressed: string;
  translit: string;
  en: string;
  /** Polish translation. Optional; falls back to `en` when missing. */
  pl?: string;
  /** German translation. Optional; falls back to `en` when missing. */
  de?: string;
}

export type TextSize = "xs" | "sm" | "md" | "lg";

export type AppLanguage = "en" | "pl" | "de";

export interface TrainerSettings {
  reps: 1 | 2 | 3 | 4 | 5;
  pauseSeconds: 0 | 0.5 | 1 | 1.5 | 2 | 2.5;
  speed: number; // 0.5 - 2
  textSize: TextSize;
  showTransliteration: boolean;
  appLanguage: AppLanguage;
}

export interface SentenceProgress {
  stars: number; // 0-5
  reps: number; // playback count
  lastPracticedAt?: number;
}
