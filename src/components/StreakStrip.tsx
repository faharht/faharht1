import { useMemo } from "react";
import { Flame } from "lucide-react";
import { useT } from "@/lib/i18n/useT";
import { useTrainerStore, todayKey } from "@/lib/trainer/store";
import { cn } from "@/lib/utils";

export function StreakStrip() {
  const { t } = useT();

  const dailyHistory = useTrainerStore((s) => s.dailyHistory);
  const currentStreak = useTrainerStore((s) => s.currentStreak);
  const longestStreak = useTrainerStore((s) => s.longestStreak);
  const lastActiveDate = useTrainerStore((s) => s.lastActiveDate);
  const dailyGoal = useTrainerStore((s) => s.dailyGoal);
  const challenge = useTrainerStore((s) => s.challenge);

  const effectiveGoal = challenge?.goal ?? dailyGoal;
  const todayStr = todayKey();

  const last14 = useMemo(() => {
    const out: { date: string; reps: number }[] = [];
    const [y, m, d] = todayStr.split("-").map(Number);
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      out.push({ date: key, reps: dailyHistory[key] ?? 0 });
    }
    return out;
  }, [todayStr, dailyHistory]);

  const effectiveStreak = useMemo(() => {
    if (!lastActiveDate) return 0;
    if (lastActiveDate === todayStr) return currentStreak;
    const [y, m, d] = todayStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return lastActiveDate === key ? currentStreak : 0;
  }, [lastActiveDate, currentStreak, todayStr]);

  return (
    <section className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-500">
            <Flame className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold leading-none text-slate-900">
              {effectiveStreak}{" "}
              <span className="text-xs font-medium text-slate-500">
                {effectiveStreak === 1 ? t("profile.day") : t("profile.days")}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t("profile.currentStreak")}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-slate-900">{longestStreak}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t("profile.longest")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1">
        {last14.map((d) => {
          const isToday = d.date === todayStr;
          const hit = d.reps >= effectiveGoal && effectiveGoal > 0;
          const some = d.reps > 0 && !hit;
          return (
            <div
              key={d.date}
              title={`${d.date} · ${d.reps}`}
              className={cn(
                "h-5 flex-1 rounded-md",
                hit ? "bg-blue-500" : some ? "bg-blue-200" : "bg-slate-100",
                isToday && "ring-2 ring-indigo-500 ring-offset-1 ring-offset-white",
              )}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>{t("profile.14daysAgo")}</span>
        <span>{t("common.today")}</span>
      </div>
    </section>
  );
}
