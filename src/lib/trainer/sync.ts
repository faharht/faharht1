import { supabase } from "@/integrations/supabase/client";
import { useTrainerStore } from "./store";

type TrainerState = ReturnType<typeof useTrainerStore.getState>;

export function mergeTrainerState(local: TrainerState, cloud: any): Partial<TrainerState> {
  if (!cloud || typeof cloud !== "object") return {};

  const merged: Partial<TrainerState> = {};

  // Merge progress
  if (cloud.progress) {
    const newProgress = { ...local.progress };
    for (const [id, p] of Object.entries(cloud.progress as Record<string, any>)) {
      if (!newProgress[id]) {
        newProgress[id] = p;
      } else {
        newProgress[id] = {
          stars: Math.max(newProgress[id].stars || 0, p.stars || 0),
          reps: Math.max(newProgress[id].reps || 0, p.reps || 0),
          lastPracticedAt: Math.max(newProgress[id].lastPracticedAt || 0, p.lastPracticedAt || 0),
        };
      }
    }
    merged.progress = newProgress;
  }

  // Merge dailyHistory
  if (cloud.dailyHistory) {
    const newHistory = { ...local.dailyHistory };
    for (const [day, reps] of Object.entries(cloud.dailyHistory as Record<string, number>)) {
      newHistory[day] = Math.max(newHistory[day] || 0, reps || 0);
    }
    merged.dailyHistory = newHistory;
  }

  // Merge favorites
  if (cloud.favorites) {
    merged.favorites = { ...local.favorites, ...cloud.favorites };
  }

  // Streaks and activity
  let cloudLastActive = cloud.lastActiveDate || null;
  let localLastActive = local.lastActiveDate || null;
  
  if (cloudLastActive && (!localLastActive || cloudLastActive > localLastActive)) {
    merged.lastActiveDate = cloudLastActive;
    merged.currentStreak = cloud.currentStreak || 0;
  } else if (localLastActive && (!cloudLastActive || localLastActive > cloudLastActive)) {
    // local is newer, keep local (which means we don't need to put it in merged to overwrite)
  } else if (cloudLastActive === localLastActive) {
    merged.currentStreak = Math.max(local.currentStreak || 0, cloud.currentStreak || 0);
  }

  merged.longestStreak = Math.max(local.longestStreak || 0, cloud.longestStreak || 0);

  // Daily goal — prefer cloud value when set
  if (typeof cloud.dailyGoal === "number" && cloud.dailyGoal > 0) {
    merged.dailyGoal = cloud.dailyGoal;
  }

  // Settings
  if (cloud.settings) {
    merged.settings = { ...local.settings, ...cloud.settings };
  }

  // Badges
  if (cloud.badges) {
    merged.badges = { ...local.badges, ...cloud.badges };
  }

  // Challenge (naive merge: pick cloud if it has a higher goal or more days, or newer)
  if (cloud.challenge) {
    if (!local.challenge) {
      merged.challenge = cloud.challenge;
    } else {
      const c1 = new Date(cloud.challenge.startedOn).getTime();
      const c2 = new Date(local.challenge.startedOn).getTime();
      if (c1 > c2 || (c1 === c2 && cloud.challenge.daysCompleted > local.challenge.daysCompleted)) {
        merged.challenge = cloud.challenge;
      }
    }
  }

  return merged;
}

let syncTimeout: NodeJS.Timeout | null = null;

export function pushToCloud(state: TrainerState, userId: string) {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(async () => {
    // Only save the state we care about
    const payload = {
      settings: state.settings,
      progress: state.progress,
      favorites: state.favorites,
      dailyGoal: state.dailyGoal,
      dailyHistory: state.dailyHistory,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      lastActiveDate: state.lastActiveDate,
      challenge: state.challenge,
      badges: state.badges,
    };

    try {
      await supabase
        .from("profiles")
        .update({ trainer_state: payload as any })
        .eq("id", userId);
    } catch (err) {
      console.error("Failed to sync trainer state to cloud", err);
    }
  }, 2000); // 2 second debounce
}
