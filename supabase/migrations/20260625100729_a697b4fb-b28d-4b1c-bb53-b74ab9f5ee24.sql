
CREATE SCHEMA IF NOT EXISTS private;

-- Move privileged logic to private schema
CREATE OR REPLACE FUNCTION private.is_pro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND tier = 'pro'
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  )
$$;

CREATE OR REPLACE FUNCTION private.can_add_sentence(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE used integer;
BEGIN
  IF private.is_pro(_user_id) THEN RETURN true; END IF;
  SELECT COALESCE(sentences_added,0) INTO used FROM public.daily_usage
    WHERE user_id = _user_id AND usage_date = (now() AT TIME ZONE 'utc')::date;
  RETURN COALESCE(used,0) < 5;
END; $$;

CREATE OR REPLACE FUNCTION private.can_create_set(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE cnt integer;
BEGIN
  IF private.is_pro(_user_id) THEN RETURN true; END IF;
  SELECT COUNT(*) INTO cnt FROM public.custom_sets WHERE user_id = _user_id;
  RETURN COALESCE(cnt,0) < 1;
END; $$;

CREATE OR REPLACE FUNCTION private.consume_sentence_slot(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE today date := (now() AT TIME ZONE 'utc')::date; used integer;
BEGIN
  IF private.is_pro(_user_id) THEN
    INSERT INTO public.daily_usage (user_id, usage_date, sentences_added)
      VALUES (_user_id, today, 1)
      ON CONFLICT (user_id, usage_date)
      DO UPDATE SET sentences_added = public.daily_usage.sentences_added + 1, updated_at = now();
    RETURN true;
  END IF;
  INSERT INTO public.daily_usage (user_id, usage_date, sentences_added)
    VALUES (_user_id, today, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;
  UPDATE public.daily_usage SET sentences_added = sentences_added + 1, updated_at = now()
    WHERE user_id = _user_id AND usage_date = today AND sentences_added < 5
    RETURNING sentences_added INTO used;
  RETURN used IS NOT NULL;
END; $$;

REVOKE EXECUTE ON FUNCTION private.is_pro(uuid), private.can_add_sentence(uuid), private.can_create_set(uuid), private.consume_sentence_slot(uuid) FROM PUBLIC;

-- Replace public functions with INVOKER-mode wrappers
CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.is_pro(_user_id) $$;

CREATE OR REPLACE FUNCTION public.can_add_sentence(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.can_add_sentence(_user_id) $$;

CREATE OR REPLACE FUNCTION public.can_create_set(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.can_create_set(_user_id) $$;

CREATE OR REPLACE FUNCTION public.consume_sentence_slot(_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.consume_sentence_slot(_user_id) $$;
