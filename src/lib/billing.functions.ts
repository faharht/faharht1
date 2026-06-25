import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

/**
 * Returns a freshly-minted Paddle customer-portal URL for the signed-in
 * user's most recent subscription (used to cancel, change card, view invoices).
 */
export const getCustomerPortalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!sub?.paddle_customer_id) {
      throw new Error("No subscription found. Subscribe first to manage billing.");
    }
    const paddle = getPaddleClient(sub.environment as PaddleEnv);
    const portal = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [],
    );
    return {
      url: portal.urls?.general?.overview ?? null,
      subscriptionUrl: portal.urls?.subscriptions?.[0]?.cancelSubscription ?? null,
    };
  });
