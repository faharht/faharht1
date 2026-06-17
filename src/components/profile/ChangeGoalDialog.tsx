import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { CHALLENGE_GOALS, type ChallengeGoal } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

export function ChangeGoalDialog({
  currentGoal,
  onConfirm,
  onClose,
}: {
  currentGoal: ChallengeGoal | null;
  onConfirm: (goal: ChallengeGoal) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [picked, setPicked] = useState<ChallengeGoal | null>(currentGoal);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {currentGoal ? t("goal.change") : t("goal.pick")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("goal.hint")}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {CHALLENGE_GOALS.map((g) => {
            const active = picked === g;
            return (
              <button
                key={g}
                onClick={() => setPicked(g)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <div className="text-lg font-bold text-foreground">{g}</div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t("goal.repsPerDay")}
                </div>
              </button>
            );
          })}
        </div>

        {currentGoal && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[11px] text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("goal.resetWarn")}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-border bg-background py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {t("common.cancel")}
          </button>
          <button
            disabled={!picked || picked === currentGoal}
            onClick={() => picked && onConfirm(picked)}
            className="flex-1 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {currentGoal ? t("goal.reset") : t("goal.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
