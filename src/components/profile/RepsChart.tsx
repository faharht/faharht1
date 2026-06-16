import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayKey } from "@/lib/trainer/store";

type Range = 14 | 30;

export function RepsChart({
  dailyHistory,
  dailyGoal,
}: {
  dailyHistory: Record<string, number>;
  dailyGoal: number;
}) {
  const [range, setRange] = useState<Range>(14);
  const today = todayKey();

  const days = useMemo(() => {
    const out: { date: string; reps: number; d: Date }[] = [];
    const [y, m, d] = today.split("-").map(Number);
    for (let i = range - 1; i >= 0; i--) {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() - i);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      out.push({ date: key, reps: dailyHistory[key] ?? 0, d: dt });
    }
    return out;
  }, [range, today, dailyHistory]);

  const maxReps = Math.max(dailyGoal, ...days.map((d) => d.reps), 1);
  const total = days.reduce((a, b) => a + b.reps, 0);
  const avg = Math.round(total / days.length);
  const hitDays = days.filter((d) => d.reps >= dailyGoal && dailyGoal > 0).length;

  const goalLineTop = 100 - (dailyGoal / maxReps) * 100;
  const weekday = (d: Date) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const tickEvery = range === 14 ? 2 : 5;

  return (
    <section className="mt-5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-100 text-violet-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Daily reps</div>
            <div className="text-[11px] text-muted-foreground">
              {total.toLocaleString()} total · avg {avg}/day · {hitDays} goal days
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 rounded-lg bg-muted p-0.5 text-[11px] font-semibold">
          {([14, 30] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "h-7 rounded-md px-2 transition",
                range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 h-32 w-full">
        {/* goal line */}
        {dailyGoal > 0 && dailyGoal <= maxReps && (
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-primary/60"
            style={{ top: `${goalLineTop}%` }}
          >
            <span className="absolute -top-3.5 right-0 rounded bg-primary/10 px-1 text-[9px] font-semibold text-primary">
              goal {dailyGoal}
            </span>
          </div>
        )}
        <div className="flex h-full items-end gap-[3px]">
          {days.map((day) => {
            const pct = (day.reps / maxReps) * 100;
            const hit = day.reps >= dailyGoal && dailyGoal > 0;
            const some = day.reps > 0 && !hit;
            const isToday = day.date === today;
            return (
              <div
                key={day.date}
                className="group relative flex h-full flex-1 items-end"
                title={`${weekday(day.d)} ${day.d.getDate()} · ${day.reps} reps`}
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all",
                    hit
                      ? "bg-primary"
                      : some
                        ? "bg-primary/30"
                        : "bg-muted",
                    isToday && "ring-1 ring-primary",
                  )}
                  style={{ height: `${Math.max(pct, day.reps > 0 ? 4 : 2)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-1 text-[10px] font-semibold text-background group-hover:block">
                  {day.reps} reps
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-[3px]">
        {days.map((day, i) => (
          <div key={day.date} className="flex-1 text-center text-[9px] text-muted-foreground">
            {i % tickEvery === 0 || i === days.length - 1 ? day.d.getDate() : ""}
          </div>
        ))}
      </div>
    </section>
  );
}
