import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { CHALLENGE_GOALS, type ChallengeGoal, useTrainerStore } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const startChallenge = useTrainerStore((s) => s.startChallenge);
  const [picked, setPicked] = useState<ChallengeGoal>(100);

  function handleStart() {
    startChallenge(picked);
    navigate({ to: "/profile" });
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)] pb-24">
      <main className="mx-auto max-w-md px-4 pt-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Pick your daily challenge
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice this many reps every day for 14 days to earn a badge. You can
          change it later, but your streak will reset.
        </p>

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
                  reps / day
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {g === 100 && "Casual — a few minutes daily."}
                  {g === 500 && "Steady — about 15–20 min."}
                  {g === 1000 && "Serious — 30–40 min."}
                  {g === 2500 && "Hardcore — 1 h+."}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          className="mt-6 h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Start 14-day challenge
        </button>
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="mt-2 h-9 w-full text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      </main>
    </div>
  );
}
