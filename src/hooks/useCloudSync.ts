import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { supabase } from "@/integrations/supabase/client";
import { useTrainerStore } from "@/lib/trainer/store";
import { mergeTrainerState, pushToCloud } from "@/lib/trainer/sync";

export function useCloudSync() {
  const { data: user } = useQuery(sessionUserQueryOptions);
  const isInitialSyncDone = useRef(false);
  const lastUserId = useRef<string | null>(null);

  // When user logs in or mounts, fetch state and merge once
  useEffect(() => {
    if (!user?.id) {
      isInitialSyncDone.current = false;
      lastUserId.current = null;
      return;
    }
    
    // If the user changed, we need to re-sync
    if (lastUserId.current !== user.id) {
      isInitialSyncDone.current = false;
      lastUserId.current = user.id;
    }

    if (isInitialSyncDone.current) return;
    
    let isMounted = true;
    
    async function initSync() {
      const { data, error } = await supabase
        .from("profiles")
        .select("trainer_state")
        .eq("id", user!.id)
        .maybeSingle();
        
      if (error || !data || !isMounted) return;
      
      const cloudState = data.trainer_state;
      if (cloudState) {
        const localState = useTrainerStore.getState();
        const merged = mergeTrainerState(localState, cloudState);
        if (Object.keys(merged).length > 0) {
          useTrainerStore.setState(merged);
        }
      }
      isInitialSyncDone.current = true;
    }
    
    initSync();
    
    return () => { isMounted = false; };
  }, [user?.id]);

  // Subscribe to changes and push
  useEffect(() => {
    if (!user?.id) return;
    
    const unsubscribe = useTrainerStore.subscribe((state, prevState) => {
      // Don't push until we've completed the initial merge, 
      // to avoid overwriting the cloud with an unmerged local state.
      if (!isInitialSyncDone.current) return;
      
      // Simple optimization: don't push if only dayCounter changed (midnight tick)
      if (state.dayCounter !== prevState.dayCounter && state.currentStreak === prevState.currentStreak) {
        // We still push if currentStreak changed due to tick
        if (state === prevState) return; // though zustand wouldn't trigger this
      }

      pushToCloud(state, user.id);
    });
    
    return () => unsubscribe();
  }, [user?.id]);
}

export function CloudSync() {
  useCloudSync();
  return null;
}
