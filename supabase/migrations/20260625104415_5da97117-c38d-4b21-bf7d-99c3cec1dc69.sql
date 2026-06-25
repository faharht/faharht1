-- Consolidate subscription handling: drop unused user_subscriptions, fix is_pro

DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- Rewrite private.is_pro: check public.subscriptions only, no hardcoded env,
-- strict status set (active/trialing only; past_due is dunning, not Pro),
-- plus end-of-period grace for canceled subs.
CREATE OR REPLACE FUNCTION private.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status IN ('active', 'trialing')
          AND (current_period_end IS NULL OR current_period_end > now()))
        OR
        (status = 'canceled'
          AND current_period_end IS NOT NULL
          AND current_period_end > now())
      )
  );
$$;

-- Safety-net helper for server-side gating
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, private
AS $$ SELECT private.is_pro(_user_id) $$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- Audit log for admin-visible subscription operations
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_subscription_id text,
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT ALL ON public.subscription_events TO service_role;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription events"
  ON public.subscription_events FOR SELECT
  USING (auth.uid() = user_id);
