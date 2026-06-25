import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import type { Database } from "@/integrations/supabase/types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function logEvent(userId: string | null, paddleSubId: string | null, type: string, payload: any) {
  try {
    await getSupabase().from("subscription_events").insert({
      user_id: userId,
      paddle_subscription_id: paddleSubId,
      event_type: type,
      payload,
    });
  } catch (e) {
    console.error("logEvent failed", e);
  }
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData for subscription", id);
    await logEvent(null, id, "subscription.created.missing_user", data);
    return;
  }
  const item = items?.[0];
  // Prefer human-readable IDs from importMeta; fall back to raw IDs so the
  // user still gets Pro even if the product/price wasn't imported via the
  // create_product / create_price tools.
  const priceId = item?.price?.importMeta?.externalId ?? item?.price?.id ?? "unknown";
  const productId = item?.product?.importMeta?.externalId ?? item?.product?.id ?? "unknown";
  if (!item?.price?.importMeta?.externalId) {
    console.warn("subscription.created: missing importMeta.externalId, using raw id", { priceId, productId });
  }

  const { error } = await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );
  if (error) console.error("subscription upsert failed", error);
  await logEvent(userId, id, "subscription.created", { status, priceId, productId, env });
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange } = data;
  const { data: row } = await getSupabase()
    .from("subscriptions")
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env)
    .select("user_id")
    .maybeSingle();
  await logEvent(row?.user_id ?? null, id, "subscription.updated", { status, scheduledChange });
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { data: row } = await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env)
    .select("user_id")
    .maybeSingle();
  await logEvent(row?.user_id ?? null, data.id, "subscription.canceled", {});
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
