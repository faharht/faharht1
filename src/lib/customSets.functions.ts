import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { translateSentence } from "@/lib/translate.functions";

export type CustomSet = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  tone: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomSentence = {
  id: string;
  set_id: string;
  user_id: string;
  ru: string;
  ru_stressed: string;
  translit: string;
  en: string;
  pl: string | null;
  de: string | null;
  source_lang: string | null;
  source_text: string | null;
  sort_order: number;
  created_at: string;
};

export type UsageInfo = {
  isPro: boolean;
  sentencesToday: number;
  sentencesLimit: number | null;
  setsUsed: number;
  setsLimit: number | null;
};

export const listMySets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("custom_sets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CustomSet[];
  });

export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsageInfo> => {
    const [{ data: isPro }, { data: usage }, { count: setsUsed }] = await Promise.all([
      context.supabase.rpc("is_pro", { _user_id: context.userId }),
      context.supabase
        .from("daily_usage")
        .select("sentences_added")
        .eq("user_id", context.userId)
        .eq("usage_date", new Date().toISOString().slice(0, 10))
        .maybeSingle(),
      context.supabase
        .from("custom_sets")
        .select("id", { count: "exact", head: true }),
    ]);
    return {
      isPro: isPro === true,
      sentencesToday: usage?.sentences_added ?? 0,
      sentencesLimit: isPro === true ? null : 5,
      setsUsed: setsUsed ?? 0,
      setsLimit: isPro === true ? null : 1,
    };
  });

const CreateSetInput = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).optional(),
  icon: z.string().trim().max(40).optional(),
  tone: z.enum(["amber", "violet", "emerald", "sky", "rose"]).optional(),
});

export const createCustomSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateSetInput.parse(i))
  .handler(async ({ data, context }) => {
    const { data: canCreate, error: rpcErr } = await context.supabase.rpc("can_create_set", {
      _user_id: context.userId,
    });
    if (rpcErr) throw rpcErr;
    if (!canCreate) {
      const err = new Error("SET_LIMIT_REACHED");
      (err as Error & { code?: string }).code = "SET_LIMIT_REACHED";
      throw err;
    }
    const { data: row, error } = await context.supabase
      .from("custom_sets")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description ?? null,
        icon: data.icon ?? null,
        tone: data.tone ?? "sky",
      })
      .select("*")
      .single();
    if (error) throw error;
    return row as CustomSet;
  });

const UpdateSetInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(240).nullable().optional(),
  tone: z.enum(["amber", "violet", "emerald", "sky", "rose"]).optional(),
});

export const updateCustomSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => UpdateSetInput.parse(i))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase
      .from("custom_sets")
      .update(patch)
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const DeleteSetInput = z.object({ id: z.string().uuid() });
export const deleteCustomSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeleteSetInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sets")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const GetSetInput = z.object({ id: z.string().uuid() });
export const getCustomSet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => GetSetInput.parse(i))
  .handler(async ({ data, context }) => {
    const [{ data: set, error: setErr }, { data: sentences, error: sentErr }] = await Promise.all([
      context.supabase.from("custom_sets").select("*").eq("id", data.id).maybeSingle(),
      context.supabase
        .from("custom_sentences")
        .select("*")
        .eq("set_id", data.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);
    if (setErr) throw setErr;
    if (sentErr) throw sentErr;
    if (!set) throw new Error("NOT_FOUND");
    return { set: set as CustomSet, sentences: (sentences ?? []) as CustomSentence[] };
  });

const AddSentenceInput = z.object({
  setId: z.string().uuid(),
  text: z.string().trim().min(1).max(500),
  sourceLang: z.string().trim().min(2).max(20).optional(),
});

export const addCustomSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AddSentenceInput.parse(i))
  .handler(async ({ data, context }) => {
    // Verify the set belongs to the user (RLS would block insert anyway, but we want a clear error)
    const { data: set, error: setErr } = await context.supabase
      .from("custom_sets")
      .select("id")
      .eq("id", data.setId)
      .maybeSingle();
    if (setErr) throw setErr;
    if (!set) throw new Error("SET_NOT_FOUND");

    // Reserve a slot atomically
    const { data: granted, error: slotErr } = await context.supabase.rpc("consume_sentence_slot", {
      _user_id: context.userId,
    });
    if (slotErr) throw slotErr;
    if (!granted) {
      const err = new Error("QUOTA_EXCEEDED");
      (err as Error & { code?: string }).code = "QUOTA_EXCEEDED";
      throw err;
    }

    const translation = await translateSentence({
      data: { text: data.text, sourceLang: data.sourceLang },
    });

    // Determine sort_order = max+1
    const { data: maxRow } = await context.supabase
      .from("custom_sentences")
      .select("sort_order")
      .eq("set_id", data.setId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (maxRow?.sort_order ?? 0) + 1;

    const { data: inserted, error: insErr } = await context.supabase
      .from("custom_sentences")
      .insert({
        set_id: data.setId,
        user_id: context.userId,
        ru: translation.ru,
        ru_stressed: translation.ru_stressed,
        translit: translation.translit,
        en: translation.en,
        pl: translation.pl,
        de: translation.de,
        source_lang: translation.detected_source_lang ?? data.sourceLang ?? null,
        source_text: data.text,
        sort_order: nextOrder,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    return inserted as CustomSentence;
  });

const DeleteSentenceInput = z.object({ id: z.string().uuid() });
export const deleteCustomSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeleteSentenceInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("custom_sentences")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
