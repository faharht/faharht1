import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  text: z.string().trim().min(1).max(500),
  sourceLang: z.string().trim().min(2).max(20).optional(),
});

const ResultSchema = z.object({
  ru: z.string(),
  ru_stressed: z.string(),
  translit: z.string(),
  en: z.string(),
  pl: z.string(),
  de: z.string(),
  detected_source_lang: z.string().optional().nullable(),
});

export type TranslationResult = z.infer<typeof ResultSchema>;

const SYSTEM_PROMPT = `You translate a single sentence into Russian and three other languages for a language-learning app.

Return JSON with these fields:
- ru: natural Russian translation (no stress marks, no transliteration)
- ru_stressed: same Russian sentence with primary stress marked using the combining acute accent (U+0301) on the stressed vowel of every multi-syllable word. Use ё where ё is required (do not mark stress on ё). Single-syllable words have no mark.
- translit: scholarly Latin transliteration of the Russian (close to BGN/PCGN: ya, yu, yo, zh, sh, shch, ts, ch, kh, ʹ for ь, ʺ for ъ, e/ye as appropriate)
- en: idiomatic English translation
- pl: idiomatic Polish translation
- de: idiomatic German translation
- detected_source_lang: ISO 639-1 code of the input language, or null

If the input is already Russian, keep ru/ru_stressed faithful to the original and translate to en/pl/de. Always output one sentence per field. No commentary.`;

export const translateSentence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Quota check before spending tokens
    const { data: canAdd, error: rpcErr } = await context.supabase.rpc("can_add_sentence", {
      _user_id: context.userId,
    });
    if (rpcErr) throw new Error("Failed to check quota");
    if (!canAdd) {
      const err = new Error("QUOTA_EXCEEDED");
      (err as Error & { code?: string }).code = "QUOTA_EXCEEDED";
      throw err;
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const userPrompt = data.sourceLang
      ? `Source language: ${data.sourceLang}\nSentence: ${data.text}`
      : `Sentence: ${data.text}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                ru: { type: "string" },
                ru_stressed: { type: "string" },
                translit: { type: "string" },
                en: { type: "string" },
                pl: { type: "string" },
                de: { type: "string" },
                detected_source_lang: { type: ["string", "null"] },
              },
              required: ["ru", "ru_stressed", "translit", "en", "pl", "de", "detected_source_lang"],
            },
          },
        },
      }),
    });

    if (resp.status === 429) {
      const err = new Error("RATE_LIMITED");
      (err as Error & { code?: string }).code = "RATE_LIMITED";
      throw err;
    }
    if (resp.status === 402) {
      const err = new Error("CREDITS_EXHAUSTED");
      (err as Error & { code?: string }).code = "CREDITS_EXHAUSTED";
      throw err;
    }
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`AI gateway error ${resp.status}: ${body.slice(0, 200)}`);
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }
    return ResultSchema.parse(parsed);
  });
