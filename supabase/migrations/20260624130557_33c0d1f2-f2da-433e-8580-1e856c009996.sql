CREATE TABLE public.sentences (
  id text PRIMARY KEY,
  list_id text NOT NULL,
  ru text NOT NULL,
  ru_stressed text NOT NULL,
  translit text NOT NULL,
  en text NOT NULL,
  pl text,
  de text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sentences_list_id_sort_idx ON public.sentences (list_id, sort_order);
GRANT SELECT ON public.sentences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sentences TO authenticated;
GRANT ALL ON public.sentences TO service_role;
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sentences are publicly readable" ON public.sentences FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert sentences" ON public.sentences FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sentences" ON public.sentences FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sentences" ON public.sentences FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER sentences_set_updated_at BEFORE UPDATE ON public.sentences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();