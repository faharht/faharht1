import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export type Subscription = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
};

// past_due is dunning — caller chose to revoke immediately.
const ACTIVE = new Set(["active", "trialing"]);

export function useSubscription(userId: string | null) {
  const qc = useQueryClient();
  const key = ["subscription", userId, getPaddleEnvironment()];

  // Realtime: refetch when this user's subscription row changes.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`sub-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["subscription", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return useQuery({
    queryKey: key,
    enabled: !!userId,
    // Poll briefly so freshly-completed checkouts flip to Pro even if the
    // realtime channel didn't deliver before navigation.
    refetchInterval: (q) => {
      const v = q.state.data as { isPro: boolean } | undefined;
      return v?.isPro ? false : 5000;
    },
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,price_id,current_period_end,cancel_at_period_end,environment")
        .eq("user_id", userId)
        .eq("environment", getPaddleEnvironment())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const sub = data as Subscription | null;
      const periodOk = !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
      const isPro = !!sub && (
        (ACTIVE.has(sub.status) && periodOk) ||
        // End-of-period grace for canceled
        (sub.status === "canceled" && periodOk && !!sub.current_period_end)
      );
      return { subscription: sub, isPro };
    },
  });
}
