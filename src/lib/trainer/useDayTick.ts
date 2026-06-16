import { useEffect } from "react";
import { useTrainerStore, todayKey } from "./store";

export function useDayTick() {
  const tickDay = useTrainerStore((s) => s.tickDay);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastDay = todayKey();

    function scheduleNext() {
      const now = new Date();
      const next = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        5,
      );
      const ms = Math.max(1000, next.getTime() - now.getTime());
      timer = setTimeout(() => {
        lastDay = todayKey();
        tickDay();
        scheduleNext();
      }, ms);
    }

    function checkOnFocus() {
      const today = todayKey();
      if (today !== lastDay) {
        lastDay = today;
        tickDay();
      }
    }

    scheduleNext();
    document.addEventListener("visibilitychange", checkOnFocus);
    window.addEventListener("focus", checkOnFocus);
    // initial tick to sync streak decay if user reopens after a gap
    tickDay();

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkOnFocus);
      window.removeEventListener("focus", checkOnFocus);
    };
  }, [tickDay]);
}
