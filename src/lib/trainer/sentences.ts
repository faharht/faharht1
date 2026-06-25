import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Sentence } from "./types";

export const CUSTOM_PREFIX = "custom-";

export function isCustomListId(listId: string): boolean {
  return listId.startsWith(CUSTOM_PREFIX);
}

export function customSetIdFromListId(listId: string): string {
  return listId.slice(CUSTOM_PREFIX.length);
}

export function listIdForCustomSet(setId: string): string {
  return `${CUSTOM_PREFIX}${setId}`;
}

async function fetchSentences(listId: string): Promise<Sentence[]> {
  if (isCustomListId(listId)) {
    const setId = customSetIdFromListId(listId);
    const { data, error } = await supabase
      .from("custom_sentences")
      .select("id, ru, ru_stressed, translit, en, pl, de")
      .eq("set_id", setId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
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

export function customSetQueryOptions(setId: string) {
  return queryOptions({
    queryKey: ["customSet", setId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_sets")
        .select("id, title, description, tone")
        .eq("id", setId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}
