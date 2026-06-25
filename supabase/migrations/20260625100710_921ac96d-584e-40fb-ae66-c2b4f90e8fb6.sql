
-- Custom sets table
CREATE TABLE public.custom_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  description text CHECK (description IS NULL OR char_length(description) <= 240),
  icon text,
  tone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX custom_sets_user_idx ON public.custom_sets(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sets TO authenticated;
GRANT ALL ON public.custom_sets TO service_role;
ALTER TABLE public.custom_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own sets" ON public.custom_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all sets" ON public.custom_sets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own sets" ON public.custom_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own sets" ON public.custom_sets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own sets" ON public.custom_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER custom_sets_updated_at BEFORE UPDATE ON public.custom_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custom sentences table
CREATE TABLE public.custom_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.custom_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ru text NOT NULL,
  ru_stressed text NOT NULL,
  translit text NOT NULL,
  en text NOT NULL,
  pl text,
  de text,
  source_lang text,
  source_text text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX custom_sentences_set_idx ON public.custom_sentences(set_id, sort_order);
CREATE INDEX custom_sentences_user_idx ON public.custom_sentences(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_sentences TO authenticated;
GRANT ALL ON public.custom_sentences TO service_role;
ALTER TABLE public.custom_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own sentences" ON public.custom_sentences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own sentences" ON public.custom_sentences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own sentences" ON public.custom_sentences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own sentences" ON public.custom_sentences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER custom_sentences_updated_at BEFORE UPDATE ON public.custom_sentences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subscriptions
CREATE TABLE public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  status text NOT NULL DEFAULT 'inactive',
  interval text CHECK (interval IS NULL OR interval IN ('month','year')),
  current_period_end timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own subscription" ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all subscriptions" ON public.user_subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily usage counters
CREATE TABLE public.daily_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  sentences_added integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, usage_date)
);

GRANT SELECT ON public.daily_usage TO authenticated;
GRANT ALL ON public.daily_usage TO service_role;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own usage" ON public.daily_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER daily_usage_updated_at BEFORE UPDATE ON public.daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is user pro?
CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND tier = 'pro'
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_pro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, service_role;

-- Helper: can the user add another sentence today?
CREATE OR REPLACE FUNCTION public.can_add_sentence(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
BEGIN
  IF public.is_pro(_user_id) THEN
    RETURN true;
  END IF;
  SELECT COALESCE(sentences_added, 0) INTO used
    FROM public.daily_usage
    WHERE user_id = _user_id
      AND usage_date = (now() AT TIME ZONE 'utc')::date;
  RETURN COALESCE(used, 0) < 5;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_add_sentence(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_add_sentence(uuid) TO authenticated, service_role;

-- Helper: can the user create another set?
CREATE OR REPLACE FUNCTION public.can_create_set(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  IF public.is_pro(_user_id) THEN
    RETURN true;
  END IF;
  SELECT COUNT(*) INTO cnt FROM public.custom_sets WHERE user_id = _user_id;
  RETURN COALESCE(cnt, 0) < 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_create_set(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_set(uuid) TO authenticated, service_role;

-- Atomic: reserve one sentence slot for today; returns true if granted
CREATE OR REPLACE FUNCTION public.consume_sentence_slot(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  used integer;
BEGIN
  IF public.is_pro(_user_id) THEN
    INSERT INTO public.daily_usage (user_id, usage_date, sentences_added)
      VALUES (_user_id, today, 1)
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET sentences_added = public.daily_usage.sentences_added + 1, updated_at = now();
    RETURN true;
  END IF;

  INSERT INTO public.daily_usage (user_id, usage_date, sentences_added)
    VALUES (_user_id, today, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

  UPDATE public.daily_usage
     SET sentences_added = sentences_added + 1, updated_at = now()
   WHERE user_id = _user_id
     AND usage_date = today
     AND sentences_added < 5
  RETURNING sentences_added INTO used;

  RETURN used IS NOT NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_sentence_slot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_sentence_slot(uuid) TO authenticated, service_role;
