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
    const sys = `Conjugate the given Russian verb. Return JSON with: infinitive, aspect (imperfective|perfective), present (я/ты/он/мы/вы/они) — for perfective verbs, fill present with the simple-future forms; past (m/f/n/pl); imperative (sg/pl). Use stress marks (combining acute U+0301) on stressed vowels.`;
    const raw = await callAI(sys, `Verb: ${data.infinitive}`, {
      type: "object",
      additionalProperties: false,
      properties: {
        infinitive: { type: "string" },
        aspect: { type: "string" },
        present: {
          type: "object",
          additionalProperties: false,
          properties: {
            ya: { type: "string" },
            ty: { type: "string" },
            on: { type: "string" },
            my: { type: "string" },
            vy: { type: "string" },
            oni: { type: "string" },
          },
          required: ["ya", "ty", "on", "my", "vy", "oni"],
        },
        past: {
          type: "object",
          additionalProperties: false,
          properties: { m: { type: "string" }, f: { type: "string" }, n: { type: "string" }, pl: { type: "string" } },
          required: ["m", "f", "n", "pl"],
        },
        imperative: {
          type: "object",
          additionalProperties: false,
          properties: { sg: { type: "string" }, pl: { type: "string" } },
          required: ["sg", "pl"],
        },
      },
      required: ["infinitive", "aspect", "present", "past", "imperative"],
    });
    return ConjResult.parse(JSON.parse(raw));
  });
