import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Message = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(2000),
});

const ChatInput = z.object({
  level: z.enum(["A1", "A2", "B1", "B2"]).default("A1"),
  uiLang: z.enum(["en", "pl", "de"]).default("en"),
  messages: z.array(Message).min(1).max(40),
});

const WordInput = z.object({
  word: z.string().trim().min(1).max(80),
  context: z.string().trim().max(400).optional(),
  uiLang: z.enum(["en", "pl", "de"]).default("en"),
});

const WordResult = z.object({
  lemma: z.string(),
  translation: z.string(),
  pos: z.string(),
  form: z.string(),
  example: z.string(),
});

async function callAI(systemPrompt: string, userPrompt: string, jsonSchema?: object) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const body: Record<string, unknown> = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
  if (jsonSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: { name: "out", strict: true, schema: jsonSchema },
    };
  }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) throw new Error("RATE_LIMITED");
  if (resp.status === 402) throw new Error("CREDITS_EXHAUSTED");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`AI error ${resp.status}: ${t.slice(0, 200)}`);
  }
  const j = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return j.choices?.[0]?.message?.content ?? "";
}

export const tutorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ChatInput.parse(i))
  .handler(async ({ data }) => {
    const sys = `You are a friendly Russian tutor for a ${data.level} learner. Reply in simple Russian (level ${data.level}), then on a NEW line give a short ${data.uiLang} translation prefixed with "(${data.uiLang.toUpperCase()})". Keep responses to 1-3 short sentences. If the user makes a mistake, briefly correct it in ${data.uiLang} before continuing the conversation. Stay encouraging.`;
    const userPrompt = data.messages
      .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
      .join("\n");
    const reply = await callAI(sys, userPrompt);
    return { reply };
  });

export const translateWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => WordInput.parse(i))
  .handler(async ({ data }) => {
    const sys = `Given a Russian word (possibly inflected) and optional sentence context, return JSON: lemma (dictionary form), translation (one short ${data.uiLang} gloss), pos (noun/verb/adj/adv/prep/conj/pron/part/interj), form (e.g. "nom sg", "gen pl", "past 3sg"), example (a short Russian example sentence using the lemma).`;
    const userPrompt = `Word: ${data.word}${data.context ? `\nContext: ${data.context}` : ""}`;
    const raw = await callAI(sys, userPrompt, {
      type: "object",
      additionalProperties: false,
      properties: {
        lemma: { type: "string" },
        translation: { type: "string" },
        pos: { type: "string" },
        form: { type: "string" },
        example: { type: "string" },
      },
      required: ["lemma", "translation", "pos", "form", "example"],
    });
    return WordResult.parse(JSON.parse(raw));
  });

const ConjInput = z.object({
  infinitive: z.string().min(1).max(60),
});

const SUPPORTED_LANGS = [
  "auto", "en", "ru", "de", "fr", "es", "it", "pt", "nl", "pl",
  "uk", "be", "bg", "cs", "sk", "sr", "hr", "tr", "ar", "zh", "ja", "ko",
] as const;

const TranslateInput = z.object({
  text: z.string().trim().min(1).max(80),
  source: z.enum(SUPPORTED_LANGS).default("auto"),
});

export const translateToRussian = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TranslateInput.parse(i))
  .handler(async ({ data }) => {
    const url = `https://ru-api-free.onrender.com/translate?text=${encodeURIComponent(data.text)}&source=${data.source}&target=ru`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Translate failed: ${res.status}`);
    const json = (await res.json()) as {
      verb?: string;
      translation?: string;
      aspect?: string;
      tenses?: {
        present?: Record<string, string>;
        past?: Record<string, string>;
        future?: Record<string, string>;
      };
    };
    return json;
  });


const ConjResult = z.object({
  infinitive: z.string(),
  aspect: z.string(),
  present: z.object({
    ya: z.string(),
    ty: z.string(),
    on: z.string(),
    my: z.string(),
    vy: z.string(),
    oni: z.string(),
  }),
  past: z.object({ m: z.string(), f: z.string(), n: z.string(), pl: z.string() }),
  imperative: z.object({ sg: z.string(), pl: z.string() }),
});

export const conjugateVerb = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ConjInput.parse(i))
  .handler(async ({ data }) => {
    const { conjugate: localConjugate } = await import("@/lib/conjugator");
    const verb = data.infinitive.trim().toLowerCase();
    const url = `https://ru-api-free.onrender.com/conjugate?verb=${encodeURIComponent(verb)}`;
    let api: any = null;
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) api = await res.json();
    } catch {
      // fall through to local fallback
    }

    if (api && api.tenses) {
      const t = api.tenses;
      const aspect: "imperfective" | "perfective" =
        api.aspect === "perfective" ? "perfective" : "imperfective";
      const presentSrc = aspect === "perfective" ? t.present : t.present;
      const local = localConjugate(verb);
      return ConjResult.parse({
        infinitive: api.verb ?? verb,
        aspect,
        present: {
          ya: presentSrc?.["я"] ?? local.present.ya,
          ty: presentSrc?.["ты"] ?? local.present.ty,
          on: presentSrc?.["он/она/оно"] ?? presentSrc?.["он"] ?? local.present.on,
          my: presentSrc?.["мы"] ?? local.present.my,
          vy: presentSrc?.["вы"] ?? local.present.vy,
          oni: presentSrc?.["они"] ?? local.present.oni,
        },
        past: {
          m: t.past?.["мужской"] ?? local.past.m,
          f: t.past?.["женский"] ?? local.past.f,
          n: t.past?.["средний"] ?? local.past.n,
          pl: t.past?.["множественное"] ?? local.past.pl,
        },
        imperative: { sg: local.imperative.sg, pl: local.imperative.pl },
      });
    }

    // Fallback: fully local rule-based conjugator (no AI credits used).
    const local = localConjugate(verb);
    return ConjResult.parse(local);
  });
