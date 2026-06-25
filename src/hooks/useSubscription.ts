import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export type Subscription = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  environment: string;
};

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function useSubscription(userId: string | null) {
  return useQuery({
    queryKey: ["subscription", userId, getPaddleEnvironment()],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,price_id,current_period_end,environment")
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
        (sub.status === "canceled" && periodOk)
      );
      return { subscription: sub, isPro };
    },
  });
}
