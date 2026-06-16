## 1. Daily reps breakdown chart (Profile)

Add a new `RepsChartCard` section on `/profile` below the Streak card.

- Toggle: **14 days** / **30 days** (segmented control, default 14).
- Vertical SVG bar chart, one bar per day.
  - Bar height scales to the max-rep day in the selected range.
  - Bars meeting `dailyGoal` → primary color; partial → muted primary; zero → faint track.
  - Dashed horizontal line marks `dailyGoal`.
  - Hover/tap tooltip: "Mon 12 Jun · 47 reps".
  - X-axis: short weekday + day-of-month every ~5 bars.
- Reads from existing `dailyHistory` (already trimmed to 120 days — enough for 30).

## 2. Automatic daily reset at local midnight

Goal/streak/rank counters already key off `todayKey()` (local date), so the values are *already* correct after midnight — but the Profile page only recomputes on rep events. Fix the visual stale-ness:

- Add a `useDayTick()` hook in `src/lib/trainer/store.ts` that:
  - Computes ms until next local midnight.
  - Sets a `setTimeout` to force a re-render (via a zustand `dayCounter` bump) at midnight, then re-arms.
  - Also re-checks on `visibilitychange` (tab returns after sleep / next day).
- `bumpReps` already handles streak break on gaps — keep that logic. Add a parallel `tickDay()` action that, when called and `lastActiveDate` is older than yesterday, resets `currentStreak` to 0 in state so the UI reflects it without needing a rep.
- Profile and List screens call `useDayTick()` once at mount.

Result: at local midnight the Today ring resets to 0/goal, streak grid shifts, broken streaks visibly drop to 0.

## 3. Goal-challenge system with badge

### Goal options (fixed)
Replace the free-form goal editor with 4 presets: **100 / 500 / 1000 / 2500 reps/day**.

### Pick goal at signup
- After successful `signUp` in `src/routes/auth.tsx`, route to a new `/onboarding` screen (only shown if `challenge` is unset).
- `/onboarding`: 4 cards for the goal options + "Start challenge" button. Sets `challenge` state and redirects to `/profile`.
- Guests skip this — they keep the existing default (20) until they visit Profile and pick one. Profile shows a one-time "Pick your daily challenge" banner if `challenge` is unset.

### State additions (`src/lib/trainer/store.ts`)
```ts
challenge: {
  goal: 100 | 500 | 1000 | 2500;
  startedOn: string;       // YYYY-MM-DD
  daysCompleted: number;   // count of days in [startedOn, today] that hit goal
  finishedOn: string|null; // set when daysCompleted reaches 14
} | null;
badges: { challenge100?: string; challenge500?: string; challenge1000?: string; challenge2500?: string }; // value = ISO date earned
startChallenge(goal): void;
resetChallengeWithNewGoal(goal): void; // wipes streak + restarts challenge
```

- `bumpReps` also updates `challenge.daysCompleted` when today's reps first cross `challenge.goal`. When `daysCompleted` reaches 14, set `finishedOn`, write the matching badge into `badges`, and fire a toast.
- `dailyGoal` getter mirrors `challenge.goal` when challenge is active.

### Changing the goal mid-challenge
Profile shows the current challenge with progress `X / 14 days`. The "Change goal" button opens a confirm modal:
> "Changing your goal will reset your current streak and restart the 14-day challenge from day 1. Continue?"
Confirm → `resetChallengeWithNewGoal(newGoal)`: sets `currentStreak = 0`, `challenge = { goal, startedOn: today, daysCompleted: 0, finishedOn: null }`. Earned badges stay.

### Badge display
- `RankCard` row gets a new "Badges" strip showing earned challenge badges (e.g. "100/day · 14 days" with a small medal icon, colored per tier). Locked badges shown faded with target text.

## Technical Details

**Files created**
- `src/routes/onboarding.tsx` — post-signup goal picker.
- `src/components/profile/RepsChart.tsx` — SVG bar chart with 14/30 toggle.
- `src/components/profile/ChangeGoalDialog.tsx` — confirm-reset modal.
- `src/lib/trainer/useDayTick.ts` — midnight ticker hook.

**Files edited**
- `src/lib/trainer/store.ts` — add `challenge`, `badges`, `startChallenge`, `resetChallengeWithNewGoal`, `tickDay`; extend `bumpReps`; deprecate free `setDailyGoal` (kept internal, no longer exported to UI).
- `src/routes/auth.tsx` — on signup success, navigate to `/onboarding`.
- `src/routes/profile.tsx` — wire `useDayTick`, replace `TodayCard` editor with "Change goal" button, add `RepsChartCard`, add challenge progress + badges strip, banner for guests without a challenge.
- `src/routes/list.$listId.tsx` — call `useDayTick`; on challenge finish toast "Challenge complete! Badge unlocked 🏅".

**Storage**: all client-side in existing zustand `ru-trainer:v1` persist key (no DB schema changes).

## Out of scope
- Cloud sync of challenge/badges across devices.
- Push notifications / midnight reminders.
- Sharing badges externally.
