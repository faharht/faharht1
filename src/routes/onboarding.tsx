import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { CHALLENGE_GOALS, type ChallengeGoal, useTrainerStore } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Pick your daily challenge — Russian Trainer" },
      { name: "description", content: "Choose a daily reps goal and start your 14-day challenge." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const startChallenge = useTrainerStore((s) => s.startChallenge);
  const [picked, setPicked] = useState<ChallengeGoal>(100);

  function handleStart() {
    startChallenge(picked);
    navigate({ to: "/profile" });
  }

  const hint = (g: ChallengeGoal): string => {
    if (g === 100) return t("onb.casual");
    if (g === 500) return t("onb.steady");
    if (g === 1000) return t("onb.serious");
    return t("onb.hardcore");
  };

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-md px-4 pt-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">{t("onb.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("onb.desc")}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {CHALLENGE_GOALS.map((g) => {
            const active = picked === g;
            return (
              <button
                key={g}
                onClick={() => setPicked(g)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="text-3xl font-bold text-foreground">{g}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("goal.repsPerDay")}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{hint(g)}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          className="mt-6 h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("onb.start")}
        </button>
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="mt-2 h-9 w-full text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("onb.skip")}
        </button>
      </main>
    </div>
  );
}
