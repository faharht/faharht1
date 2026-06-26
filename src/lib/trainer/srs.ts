import type { SentenceProgress } from "./types";

// SM-2 lite. Each rep moves a sentence to the next interval bucket.
// stars 0-2 = struggling (review sooner), stars 3-5 = solid (longer gaps).
export const SRS_INTERVALS_DAYS = [1, 3, 7, 16, 35, 70];

export interface ReviewCandidate {
  id: string;
  dueAt: number;
  bucket: number;
  stars: number;
  reps: number;
}

export function bucketFor(p: SentenceProgress): number {
  if (p.stars >= 5) return 5;
  if (p.stars >= 4) return 4;
  if (p.stars >= 3) return 3;
  if (p.stars >= 2) return 2;
  if (p.stars >= 1) return 1;
  return 0;
}

export function dueAtFor(p: SentenceProgress): number {
  const last = p.lastPracticedAt ?? 0;
  const days = SRS_INTERVALS_DAYS[bucketFor(p)] ?? 1;
  return last + days * 24 * 60 * 60 * 1000;
}

export function pickDueReviews(
  progress: Record<string, SentenceProgress>,
  limit = 20,
  now = Date.now(),
): ReviewCandidate[] {
  const out: ReviewCandidate[] = [];
  for (const [id, p] of Object.entries(progress)) {
    if (!p.lastPracticedAt) continue;
    const dueAt = dueAtFor(p);
    if (dueAt <= now) {
      out.push({ id, dueAt, bucket: bucketFor(p), stars: p.stars, reps: p.reps });
    }
  }
  out.sort((a, b) => a.dueAt - b.dueAt);
  return out.slice(0, limit);
}

export function reviewSummary(progress: Record<string, SentenceProgress>, now = Date.now()) {
  let due = 0;
  let learning = 0;
  let mastered = 0;
  for (const p of Object.values(progress)) {
    if (!p.lastPracticedAt) continue;
    if (p.stars >= 5) mastered += 1;
    else learning += 1;
    if (dueAtFor(p) <= now) due += 1;
  }
  return { due, learning, mastered };
}
