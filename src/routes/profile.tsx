import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Sparkles, Trophy, Repeat, Star, Heart, Target, Award, CalendarCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useTrainerStore,
  todayKey,
  CHALLENGE_LENGTH_DAYS,
  BADGE_META,
  type ChallengeGoal,
  type BadgeId,
} from "@/lib/trainer/store";
import { useDayTick } from "@/lib/trainer/useDayTick";
import { BANDS, type LevelId } from "@/lib/trainer/levels";
import { getProgressToNext } from "@/lib/trainer/ranks";
import { RepsChart } from "@/components/profile/RepsChart";
import { ChangeGoalDialog } from "@/components/profile/ChangeGoalDialog";
import { cn } from "@/lib/utils";
import { useT, localeToBCP47 } from "@/lib/i18n/useT";
import type { StringKey } from "@/lib/i18n/strings";
import { UserSuggestions } from "@/components/Suggestions";
import { AvatarUploader } from "@/components/AvatarUploader";
import { sessionUserQueryOptions, profileQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { Crown, CreditCard } from "lucide-react";


export const Route = createFileRoute("/profile")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { checkout?: string } => ({
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Profile — RussianFlow" },
      {
        name: "description",
        content: "Your practice stats and account. Sign in to save progress across devices.",
      },
    ],
  }),
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionUserQueryOptions);
    if (user) {
      context.queryClient.prefetchQuery(profileQueryOptions(user.id));
    }
  },
  component: ProfilePage,
});


function ProfilePage() {
  useDayTick();
  const { t } = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user = null, isLoading: loading } = useQuery(sessionUserQueryOptions);
  const { data: sub } = useSubscription(user?.id ?? null);
  const isPro = !!sub?.isPro;
  const subscription = sub?.subscription ?? null;
  const search = Route.useSearch();
  const [goalDialog, setGoalDialog] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  // Show a one-time toast/banner after returning from a successful checkout.
  useEffect(() => {
    if (search.checkout === "success") {
      toast.success("Welcome to Pro! Your subscription is being activated.");
      // Clear the param so it doesn't re-trigger on navigation.
      navigate({ to: "/profile", search: {}, replace: true });
    }
  }, [search.checkout, navigate]);

  async function openBillingPortal() {
    setBillingBusy(true);
    try {
      const { getCustomerPortalUrl } = await import("@/lib/billing.functions");
      const res = await getCustomerPortalUrl();
      const url = res.url ?? res.subscriptionUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.error("Could not open billing portal");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setBillingBusy(false);
    }
  }



  const progress = useTrainerStore((s) => s.progress);
  const favorites = useTrainerStore((s) => s.favorites);
  const dailyGoal = useTrainerStore((s) => s.dailyGoal);
  const dailyHistory = useTrainerStore((s) => s.dailyHistory);
  const currentStreak = useTrainerStore((s) => s.currentStreak);
  const longestStreak = useTrainerStore((s) => s.longestStreak);
  const lastActiveDate = useTrainerStore((s) => s.lastActiveDate);
  const challenge = useTrainerStore((s) => s.challenge);
  const badges = useTrainerStore((s) => s.badges);
  const startChallenge = useTrainerStore((s) => s.startChallenge);
  const resetChallengeWithNewGoal = useTrainerStore((s) => s.resetChallengeWithNewGoal);
  // dayCounter subscription keeps this component refreshed across midnight
  useTrainerStore((s) => s.dayCounter);

  const effectiveGoal = challenge?.goal ?? dailyGoal;

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    // Force refresh on mount in case a stale null is cached from before session restore
    queryClient.invalidateQueries({ queryKey: ["sessionUser"] });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "INITIAL_SESSION" ||
        event === "TOKEN_REFRESHED"
      ) {
        queryClient.invalidateQueries({ queryKey: ["sessionUser"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);


  async function handleResendVerification() {
    if (!user?.email) return;
    setResendState("sending");
    setResendError(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setResendState("error");
      setResendError(error.message);
    } else {
      setResendState("sent");
    }
  }

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
  const goalPct = Math.min(100, Math.round((todayReps / Math.max(1, effectiveGoal)) * 100));

  const effectiveStreak = useMemo(() => {
    if (!lastActiveDate) return 0;
    if (lastActiveDate === today) return currentStreak;
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
    // Flush any pending trainer-state push synchronously before the session is dropped,
    // so progress saved seconds before logout isn't lost.
    const { flushCloudPush } = await import("@/lib/trainer/sync");
    const user = queryClient.getQueryData<{ id: string } | null>(["sessionUser"]);
    if (user?.id) {
      await flushCloudPush(useTrainerStore.getState(), user.id);
    }
    await supabase.auth.signOut();
    queryClient.setQueryData(["sessionUser"], null);
  }


  function handleGoalConfirm(goal: ChallengeGoal) {
    if (challenge) resetChallengeWithNewGoal(goal);
    else startChallenge(goal);
    setGoalDialog(false);
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-2xl px-4 pt-6">
        <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-6 text-white shadow-md">
          <h1 className="text-lg font-semibold">{t("profile.title")}</h1>
          <p className="mt-1 text-xs text-white/80">{t("profile.subtitle")}</p>
        </header>

        {/* Account card */}
        <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          {loading ? (
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AvatarUploader userId={user.id} email={user.email} fallbackChar={(user.email ?? "?").slice(0, 1)} isPro={isPro} />
                <button
                  onClick={handleSignOut}
                  className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("profile.signOut")}
                </button>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
                <div className="text-sm font-semibold text-foreground">{t("profile.signedIn")}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
              {!user.emailConfirmed && user.email && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                  <div className="text-xs font-semibold text-amber-900">Email not verified</div>
                  <p className="mt-0.5 text-[11px] text-amber-800">
                    Check your inbox (and spam) for a verification link, or resend it.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendState === "sending" || resendState === "sent"}
                      className="inline-flex h-8 items-center rounded-md bg-amber-600 px-3 text-[11px] font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                    >
                      {resendState === "sending"
                        ? "Sending…"
                        : resendState === "sent"
                          ? "Sent ✓"
                          : "Resend verification email"}
                    </button>
                    {resendState === "error" && resendError && (
                      <span className="text-[11px] text-red-700">{resendError}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-violet-600" />
                {t("profile.guestMode")}
              </div>
              <p className="text-xs text-muted-foreground">{t("profile.guestHint")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                  className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t("profile.signIn")}
                </button>
                <button
                  onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                  className="inline-flex h-9 items-center rounded-md border border-border/60 bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {t("profile.createAccount")}
                </button>
                <span className="ml-auto self-center text-[11px] text-muted-foreground">
                  {t("profile.continuingGuest")}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Pick challenge banner */}
        {!challenge && (
          <section className="mt-5 rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {t("profile.startChallenge")}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("profile.startChalDesc")}
                </p>
              </div>
              <button
                onClick={() => setGoalDialog(true)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t("profile.pickGoal")}
              </button>
            </div>
          </section>
        )}

        {/* Today goal */}
        <TodayCard
          todayReps={todayReps}
          dailyGoal={effectiveGoal}
          goalPct={goalPct}
          onChange={() => setGoalDialog(true)}
        />

        {/* Challenge progress */}
        {challenge && (
          <ChallengeCard challenge={challenge} />
        )}




        {/* Daily reps chart */}
        <RepsChart dailyHistory={dailyHistory} dailyGoal={effectiveGoal} />

        {/* Rank */}
        <RankCard reps={stats.reps} progress={rankProgress} />

        {/* Badges */}
        <BadgesCard badges={badges} />

        {/* Stats card */}
        <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">{t("profile.stats")}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon={Repeat} label={t("profile.reps")} value={stats.reps} tint="violet" />
            <StatTile icon={Star} label={t("profile.practiced")} value={stats.practiced} tint="amber" />
            <StatTile icon={Trophy} label={t("profile.mastered")} value={stats.mastered} tint="emerald" />
            <StatTile icon={Heart} label={t("profile.favorites")} value={stats.favCount} tint="rose" />
          </div>

          <div className="mt-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("profile.byLevel")}
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
                    {t("profile.levelLine", { reps: s.reps, practiced: s.practiced })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-dashed border-border/60 bg-card/60 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("profile.keepPracticing")}{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">
              {t("home.browseLists")}
            </Link>
          </p>
        </section>

        {/* Suggestions — chat with the admin */}
        <UserSuggestions />

        <span className="hidden">{BANDS.length}</span>
      </main>

      {goalDialog && (
        <ChangeGoalDialog
          currentGoal={challenge?.goal ?? null}
          onConfirm={handleGoalConfirm}
          onClose={() => setGoalDialog(false)}
        />
      )}
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
  onChange,
}: {
  todayReps: number;
  dailyGoal: number;
  goalPct: number;
  onChange: () => void;
}) {
  const { t } = useT();
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
            {t("profile.todayGoal")}
          </div>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {todayReps >= dailyGoal
              ? t("profile.goalReached")
              : t("profile.goalToGo", { n: dailyGoal - todayReps })}
          </div>
          <button
            onClick={onChange}
            className="mt-2 inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background px-2 text-[11px] font-medium text-foreground hover:bg-muted"
          >
            {t("profile.changeGoal")}
          </button>
        </div>
      </div>
    </section>
  );
}

function ChallengeCard({
  challenge,
}: {
  challenge: NonNullable<ReturnType<typeof useTrainerStore.getState>["challenge"]>;
}) {
  const { t, formatDate } = useT();
  const done = challenge.daysCompleted;
  const total = CHALLENGE_LENGTH_DAYS;
  const pct = Math.min(100, (done / total) * 100);
  const complete = !!challenge.finishedOn;
  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {t("profile.challengeOf", { n: challenge.goal })}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {complete ? t("profile.completed") : t("profile.daysOf", { done, total })}
            </div>
          </div>
        </div>
        {complete && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            {t("profile.badgeEarned")}
          </span>
        )}
      </div>
      <div className="mt-3 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn("h-2 flex-1 rounded-full", i < done ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">
        {t("profile.startedOn", { date: formatDate(challenge.startedOn), pct: Math.round(pct) })}
      </div>
    </section>
  );
}

function BadgesCard({ badges }: { badges: Partial<Record<BadgeId, string>> }) {
  const { t, formatDate } = useT();
  const ids = Object.keys(BADGE_META) as BadgeId[];
  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{t("profile.badges")}</div>
          <div className="text-[11px] text-muted-foreground">{t("profile.badgesHint")}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ids.map((id) => {
          const meta = BADGE_META[id];
          const earnedOn = badges[id];
          return (
            <div
              key={id}
              className={cn(
                "rounded-xl border p-3 text-center",
                earnedOn
                  ? cn("border-transparent", meta.color, "ring-2", meta.ring)
                  : "border-border/60 bg-background/60 opacity-50",
              )}
            >
              <Award className={cn("mx-auto h-6 w-6", earnedOn ? "" : "text-muted-foreground")} />
              <div className="mt-1 text-xs font-bold">{t("profile.badgePerDay", { n: meta.goal })}</div>
              <div className="text-[10px] uppercase tracking-wide opacity-80">
                {earnedOn ? formatDate(earnedOn) : t("common.locked")}
              </div>
            </div>
          );
        })}
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
  const { t, locale } = useT();
  const { current, next, pct, toNext } = progress;
  const rankKey = (id: string): StringKey => `rank.${id}` as StringKey;
  const fmtNum = (n: number) => n.toLocaleString(localeToBCP47(locale));
  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("rank.label")}</div>
            <div className="text-lg font-bold text-foreground">{t(rankKey(current.id))}</div>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", current.color)}>
          {fmtNum(reps)} {t("rank.repsSuffix")}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-all", current.bar)} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground">
        {next ? t("rank.toNext", { n: fmtNum(toNext), next: t(rankKey(next.id)) }) : t("rank.top")}
      </div>
    </section>
  );
}
