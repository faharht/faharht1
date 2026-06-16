## Daily goal, streak, and rank system

All local-only in the existing zustand store (persisted to this device). No backend changes.

### Data model — extend `src/lib/trainer/store.ts`

Add to `TrainerState`:
- `dailyGoal: number` — default **20** reps/day. User-editable.
- `dailyHistory: Record<string, number>` — keyed by `YYYY-MM-DD` (local time), value = reps that day. Trimmed to last 120 days on each update.
- `currentStreak: number`, `longestStreak: number`, `lastActiveDate: string | null`.
- New actions: `setDailyGoal(n)`, internal `recordRep(date, by)` called from `bumpReps`.

Streak rule: when today's reps cross `dailyGoal` for the first time today, mark today active. On next rep-bump after a day change, if `lastActiveDate === yesterday` → `currentStreak += 1`; if older → reset to 1. `longestStreak = max(longest, current)`.

Lifetime reps = sum of `dailyHistory` values (and also equals `Σ progress[id].reps`, so we can derive from existing data without migration loss).

### Ranks — new `src/lib/trainer/ranks.ts`

```ts
RANKS = [
  { id: "novice",      label: "Novice",       min: 0,       max: 999     },
  { id: "apprentice",  label: "Apprentice",   min: 1000,    max: 4999    },
  { id: "adept",       label: "Adept",        min: 5000,    max: 9999    },
  { id: "expert",      label: "Expert",       min: 10000,   max: 24999   },
  { id: "master",      label: "Master",       min: 25000,   max: 99999   },
  { id: "grandmaster", label: "Grandmaster",  min: 100000,  max: Infinity},
]
```
Each rank gets a color + icon. Helpers: `getRank(reps)`, `getProgressToNext(reps)` → `{ current, next, pct }`.

### UI on `/profile`

Replace the current "Your stats" header area with three new cards above it:

1. **Today** card — large ring showing `todayReps / dailyGoal`, "X reps today · Y to go", small **Edit goal** button → inline number input (5–500).
2. **Streak** card — flame icon, big number `currentStreak`, sub-line "Longest: N", and a 14-day mini-grid of dots (filled = goal met, half = some reps, empty = none).
3. **Rank** card — rank badge (color + label), bar showing progress to next rank, "X / Y reps to {nextLabel}" (or "Top rank reached" for Grandmaster).

Existing Stat tiles (Reps / Practiced / Mastered / Favorites) stay below.

### List training screen (`src/routes/list.$listId.tsx`)

Tiny addition: when a rep bumps and crosses today's goal for the first time, show a one-shot toast "Daily goal reached — streak +1 🔥". (Uses existing toast infra if present; otherwise a simple inline banner — I'll check on implementation.)

### Out of scope (call out if you want them next)

- Cloud sync of streak/history across devices
- Per-list daily goal
- Push/notification reminders
- Rank-up animations / unlockables
