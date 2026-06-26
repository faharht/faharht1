import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  level: z.enum(["A1", "A2", "B1", "B2"]).default("A1"),
  uiLang: z.enum(["en", "pl", "de"]).default("en"),
  topic: z.string().trim().max(80).optional(),
});

const Sentence = z.object({
  ru: z.string(),
  ru_stressed: z.string(),
  translation: z.string(),
});

const Result = z.object({
  title: z.string(),
  sentences: z.array(Sentence).min(4).max(10),
});

export type StoryResult = z.infer<typeof Result>;

export const generateStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const sys = `Write a SHORT original Russian story (5-7 sentences) appropriate for a CEFR ${data.level} learner. Use natural, simple vocabulary for that level. Return JSON: title (Russian, short), sentences (array of {ru, ru_stressed, translation}). "ru_stressed" must add the combining acute accent (U+0301) on the stressed vowel of every multi-syllable word. "translation" is ${data.uiLang} translation. No commentary.`;
    const user = data.topic ? `Topic: ${data.topic}` : `Pick any everyday topic.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                sentences: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      ru: { type: "string" },
                      ru_stressed: { type: "string" },
                      translation: { type: "string" },
                    },
                    required: ["ru", "ru_stressed", "translation"],
                  },
                },
              },
              required: ["title", "sentences"],
            },
          },
        },
      }),
    });
    if (resp.status === 429) throw new Error("RATE_LIMITED");
    if (resp.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!resp.ok) throw new Error(`AI error ${resp.status}`);
    const j = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = j.choices?.[0]?.message?.content ?? "";
    return Result.parse(JSON.parse(raw));
  });
