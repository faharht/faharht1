import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Sparkles, Trophy, Repeat, Star, Heart, Flame, Target, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrainerStore, todayKey } from "@/lib/trainer/store";
import { BANDS, type LevelId } from "@/lib/trainer/levels";
import { getProgressToNext } from "@/lib/trainer/ranks";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Russian Sentence Trainer" },
      {
        name: "description",
        content: "Your practice stats and account. Sign in to save progress across devices.",
      },
    ],
  }),
  component: ProfilePage,
});

type SessionUser = { id: string; email: string | null } | null;

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const progress = useTrainerStore((s) => s.progress);
  const favorites = useTrainerStore((s) => s.favorites);
  const dailyGoal = useTrainerStore((s) => s.dailyGoal);
  const dailyHistory = useTrainerStore((s) => s.dailyHistory);
  const currentStreak = useTrainerStore((s) => s.currentStreak);
  const longestStreak = useTrainerStore((s) => s.longestStreak);
  const lastActiveDate = useTrainerStore((s) => s.lastActiveDate);
  const setDailyGoal = useTrainerStore((s) => s.setDailyGoal);


  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? null } : null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    let reps = 0;
    let practiced = 0;
    let mastered = 0;
    const perLevel: Record<LevelId, { reps: number; practiced: number }> = {
      A1: { reps: 0, practiced: 0 },
      A2: { reps: 0, practiced: 0 },
      B1: { reps: 0, practiced: 0 },
      B2: { reps: 0, practiced: 0 },
    };
    for (const [id, p] of Object.entries(progress)) {
      if (!p) continue;
      reps += p.reps;
      if (p.reps > 0) practiced += 1;
      if (p.stars >= 5) mastered += 1;
      const level = (id.slice(0, 2).toUpperCase() as LevelId) || null;
      if (level && perLevel[level]) {
        perLevel[level].reps += p.reps;
        if (p.reps > 0) perLevel[level].practiced += 1;
      }
    }
    const favCount = Object.values(favorites).filter(Boolean).length;
    return { reps, practiced, mastered, favCount, perLevel };
  }, [progress, favorites]);

  const today = todayKey();
  const todayReps = dailyHistory[today] ?? 0;
  const goalPct = Math.min(100, Math.round((todayReps / Math.max(1, dailyGoal)) * 100));
  // Derive a streak that decays visually if today isn't yesterday/today
  const effectiveStreak = useMemo(() => {
    if (!lastActiveDate) return 0;
    if (lastActiveDate === today) return currentStreak;
    // yesterday?
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const y2 = dt.getFullYear();
    const m2 = String(dt.getMonth() + 1).padStart(2, "0");
    const d2 = String(dt.getDate()).padStart(2, "0");
    if (lastActiveDate === `${y2}-${m2}-${d2}`) return currentStreak;
    return 0;
  }, [lastActiveDate, currentStreak, today]);

  const last14: { date: string; reps: number }[] = useMemo(() => {
    const out: { date: string; reps: number }[] = [];
    const [y, m, d] = today.split("-").map(Number);
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      out.push({ date: key, reps: dailyHistory[key] ?? 0 });
    }
    return out;
  }, [today, dailyHistory]);

  const rankProgress = getProgressToNext(stats.reps);



  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="mt-1 text-xs text-white/80">
            Your reps, mastered sentences, and favorites.
          </p>
        </header>

        {/* Account card */}
        <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          {loading ? (
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-violet-100 text-violet-700 font-semibold">
                {(user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">Signed in</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-violet-600" />
                You're in guest mode
              </div>
              <p className="text-xs text-muted-foreground">
                Your reps and progress are saved on this device only. Sign in to keep them
                across devices.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                  className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Create account
                </button>
                <span className="ml-auto self-center text-[11px] text-muted-foreground">
                  Continuing as guest
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Today goal */}
        <TodayCard
          todayReps={todayReps}
          dailyGoal={dailyGoal}
          goalPct={goalPct}
          onSave={setDailyGoal}
        />

        {/* Streak */}
        <StreakCard
          currentStreak={effectiveStreak}
          longestStreak={longestStreak}
          last14={last14}
          dailyGoal={dailyGoal}
          today={today}
        />

        {/* Rank */}
        <RankCard reps={stats.reps} progress={rankProgress} />

        {/* Stats card */}
        <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">

          <h2 className="text-sm font-semibold text-foreground">Your stats</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Repeat} label="Reps" value={stats.reps} tint="violet" />
            <StatTile icon={Star} label="Practiced" value={stats.practiced} tint="amber" />
            <StatTile icon={Trophy} label="Mastered" value={stats.mastered} tint="emerald" />
            <StatTile icon={Heart} label="Favorites" value={stats.favCount} tint="rose" />
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              By level
            </h3>
            {(["A1", "A2", "B1", "B2"] as LevelId[]).map((lvl) => {
              const s = stats.perLevel[lvl];
              return (
                <div
                  key={lvl}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-foreground">{lvl}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.reps} reps · {s.practiced} practiced
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-dashed border-border/60 bg-card/60 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Want to keep practicing?{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">
              Browse lists →
            </Link>
          </p>
        </section>

        {/* Suppress unused-import warning when BANDS isn't referenced */}
        <span className="hidden">{BANDS.length}</span>
      </main>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: "violet" | "amber" | "emerald" | "rose";
}) {
  const tints = {
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
      <div className={cn("grid h-8 w-8 place-items-center rounded-lg", tints[tint])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-xl font-bold text-foreground">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function TodayCard({
  todayReps,
  dailyGoal,
  goalPct,
  onSave,
}: {
  todayReps: number;
  dailyGoal: number;
  goalPct: number;
  onSave: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(dailyGoal);
  useEffect(() => setDraft(dailyGoal), [dailyGoal]);

  // Ring math
  const size = 88;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (goalPct / 100) * c;

  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${c}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center leading-tight">
              <div className="text-lg font-bold text-foreground">{todayReps}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/ {dailyGoal}</div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Today's goal
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {todayReps >= dailyGoal
              ? "Goal reached — nice."
              : `${dailyGoal - todayReps} reps to go`}
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="mt-2 inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted"
            >
              <Pencil className="h-3 w-3" /> Edit goal
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={500}
                value={draft}
                onChange={(e) => setDraft(Number(e.target.value))}
                className="h-7 w-20 rounded-md border border-border/60 bg-background px-2 text-xs outline-none ring-primary/30 focus:ring-2"
              />
              <button
                onClick={() => {
                  onSave(draft);
                  setEditing(false);
                }}
                className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"
                aria-label="Save"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setDraft(dailyGoal);
                  setEditing(false);
                }}
                className="grid h-7 w-7 place-items-center rounded-md border border-border/60 bg-background"
                aria-label="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StreakCard({
  currentStreak,
  longestStreak,
  last14,
  dailyGoal,
  today,
}: {
  currentStreak: number;
  longestStreak: number;
  last14: { date: string; reps: number }[];
  dailyGoal: number;
  today: string;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-100 text-rose-600">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-foreground">
              {currentStreak} <span className="text-sm font-medium text-muted-foreground">day{currentStreak === 1 ? "" : "s"}</span>
            </div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Current streak</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">{longestStreak}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Longest</div>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-1">
        {last14.map((d) => {
          const isToday = d.date === today;
          const hit = d.reps >= dailyGoal && dailyGoal > 0;
          const some = d.reps > 0 && !hit;
          return (
            <div
              key={d.date}
              title={`${d.date} · ${d.reps} reps`}
              className={cn(
                "h-6 flex-1 rounded-sm",
                hit
                  ? "bg-rose-500"
                  : some
                    ? "bg-rose-200"
                    : "bg-muted",
                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card",
              )}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>14 days ago</span>
        <span>Today</span>
      </div>
    </section>
  );
}

function RankCard({
  reps,
  progress,
}: {
  reps: number;
  progress: ReturnType<typeof getProgressToNext>;
}) {
  const { current, next, pct, toNext } = progress;
  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Rank</div>
            <div className="text-lg font-bold text-foreground">{current.label}</div>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", current.color)}>
          {reps.toLocaleString()} reps
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", current.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">
        {next
          ? `${toNext.toLocaleString()} reps to ${next.label}`
          : "Top rank reached. Keep going!"}
      </div>
    </section>
  );
}

