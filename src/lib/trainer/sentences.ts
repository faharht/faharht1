import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sentence } from "./types";

async function fetchSentences(listId: string): Promise<Sentence[]> {
  const { data, error } = await supabase
    .from("sentences")
    .select("id, ru, ru_stressed, translit, en, pl, de")
    .eq("list_id", listId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    ru: r.ru,
    ruStressed: r.ru_stressed,
    translit: r.translit,
    en: r.en,
    pl: r.pl ?? undefined,
    de: r.de ?? undefined,
  }));
}

export function sentencesQueryOptions(listId: string) {
  return queryOptions({
    queryKey: ["sentences", listId],
    queryFn: () => fetchSentences(listId),
    staleTime: 5 * 60_000,
  });
}
