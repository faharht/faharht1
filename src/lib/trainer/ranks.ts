export interface Rank {
  id: string;
  label: string;
  min: number;
  max: number;
  color: string; // tailwind classes for badge bg/text
  bar: string; // tailwind class for progress bar fill
}

export const RANKS: Rank[] = [
  { id: "novice",      label: "Novice",      min: 0,      max: 999,      color: "bg-slate-100 text-slate-700",   bar: "bg-slate-400" },
  { id: "apprentice",  label: "Apprentice",  min: 1000,   max: 4999,     color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  { id: "adept",       label: "Adept",       min: 5000,   max: 9999,     color: "bg-sky-100 text-sky-700",       bar: "bg-sky-500" },
  { id: "expert",      label: "Expert",      min: 10000,  max: 24999,    color: "bg-violet-100 text-violet-700", bar: "bg-violet-500" },
  { id: "master",      label: "Master",      min: 25000,  max: 99999,    color: "bg-amber-100 text-amber-700",   bar: "bg-amber-500" },
  { id: "grandmaster", label: "Grandmaster", min: 100000, max: Infinity, color: "bg-rose-100 text-rose-700",     bar: "bg-rose-500" },
];

export function getRank(reps: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (reps >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function getProgressToNext(reps: number): {
  current: Rank;
  next: Rank | null;
  pct: number; // 0-100 within current band
  toNext: number; // reps remaining to next rank (0 if top)
} {
  const current = getRank(reps);
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  if (!next) return { current, next: null, pct: 100, toNext: 0 };
  const span = next.min - current.min;
  const pct = Math.min(100, Math.max(0, ((reps - current.min) / span) * 100));
  return { current, next, pct, toNext: Math.max(0, next.min - reps) };
}
