#!/usr/bin/env bun
/**
 * Translates grammar packs (intro + notes title/body/examples) into Polish & German.
 * Writes sidecar JSON files to src/data/grammar/_i18n/<listId>.json.
 * Idempotent: rerunning only fills in missing locales.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

const OUT_DIR = "src/data/grammar/_i18n";
const MODEL = "google/gemini-2.5-flash-lite";
const API = "https://ai.gateway.lovable.dev/v1/chat/completions";
const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("LOVABLE_API_KEY missing"); process.exit(1); }

// Import all packs the same way grammar.ts does.
import { a1Part1 } from "@/data/grammar/a1-part-1";
import { a1Part2 } from "@/data/grammar/a1-part-2";
import { a1Part3 } from "@/data/grammar/a1-part-3";
import { a1Part4 } from "@/data/grammar/a1-part-4";
import { a2Part1 } from "@/data/grammar/a2-part-1";
import { a2Part2 } from "@/data/grammar/a2-part-2";
import { a2Part3 } from "@/data/grammar/a2-part-3";
import { a2Part4 } from "@/data/grammar/a2-part-4";
import { b1Part1 } from "@/data/grammar/b1-part-1";
import { b1Part2 } from "@/data/grammar/b1-part-2";
import { b1Part3 } from "@/data/grammar/b1-part-3";
import { b1Part4 } from "@/data/grammar/b1-part-4";
import { b2Part1 } from "@/data/grammar/b2-part-1";
import { b2Part2 } from "@/data/grammar/b2-part-2";
import { b2Part3 } from "@/data/grammar/b2-part-3";
import { b2Part4 } from "@/data/grammar/b2-part-4";
import { top300Verbs } from "@/data/grammar/top-300-verbs";
import type { GrammarPack } from "@/lib/trainer/grammar";

const PACKS: Record<string, GrammarPack> = {
  "a1-part-1": a1Part1, "a1-part-2": a1Part2, "a1-part-3": a1Part3, "a1-part-4": a1Part4,
  "a2-part-1": a2Part1, "a2-part-2": a2Part2, "a2-part-3": a2Part3, "a2-part-4": a2Part4,
  "b1-part-1": b1Part1, "b1-part-2": b1Part2, "b1-part-3": b1Part3, "b1-part-4": b1Part4,
  "b2-part-1": b2Part1, "b2-part-2": b2Part2, "b2-part-3": b2Part3, "b2-part-4": b2Part4,
  "top-300-verbs": top300Verbs,
};

const LANG_NAMES = { pl: "Polish", de: "German" } as const;
type Lang = keyof typeof LANG_NAMES;

interface I18nExample { en?: string; note?: string }
interface I18nNote { title?: string; body?: string; examples?: I18nExample[] }
interface I18nPack { intro?: string; notes?: I18nNote[] }
interface Sidecar { pl?: I18nPack; de?: I18nPack }

async function callAI(prompt: string): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": KEY!, "X-Lovable-AIG-SDK": "raw-script" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "{}";
}

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 8): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const msg = (e as Error).message;
      const wait = msg.includes("429") ? 5000 * (i + 1) : 1500 * (i + 1);
      console.warn(`  retry ${label} (${i+1}/${tries}) in ${wait}ms: ${msg.slice(0,120)}`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw last;
}

async function translatePack(pack: GrammarPack, lang: Lang): Promise<I18nPack> {
  const langName = LANG_NAMES[lang];
  // Build a structured payload the AI will translate verbatim, preserving markdown.
  const payload = {
    intro: pack.intro ?? null,
    notes: pack.notes.map(n => ({
      title: n.title,
      body: n.body,
      examples: (n.examples ?? []).map(ex => ({
        en: ex.en,
        note: ex.note ?? null,
      })),
    })),
  };
  const prompt =
    `Translate the following Russian-language-course grammar content from English into ${langName}. ` +
    `This is teaching content for ${langName} speakers learning Russian, so the explanations and example translations must be in ${langName}. ` +
    `IMPORTANT RULES:\n` +
    `- Translate the English text in: intro, notes[].title, notes[].body, notes[].examples[].en, notes[].examples[].note.\n` +
    `- Keep markdown formatting (**bold**, _italic_) intact and around the same conceptual words.\n` +
    `- Keep grammatical Russian terms (case names, verb forms) translated to the target language tradition (e.g. German "Präpositiv", Polish "miejscownik").\n` +
    `- DO NOT translate the Russian example sentences themselves (the .ru field is not provided here; you only translate English meanings).\n` +
    `- Preserve the JSON structure EXACTLY: same number of notes and examples, same keys.\n` +
    `- Return ONLY a JSON object matching the input shape with translated strings. No commentary.\n\n` +
    `INPUT:\n${JSON.stringify(payload, null, 2)}`;
  const raw = await withRetry(() => callAI(prompt), `${pack.listId}/${lang}`);
  const parsed = JSON.parse(raw) as I18nPack;
  // Sanity-check shape
  if (!Array.isArray(parsed.notes) || parsed.notes.length !== pack.notes.length) {
    throw new Error(`Bad shape: notes length mismatch (got ${parsed.notes?.length}, want ${pack.notes.length})`);
  }
  return parsed;
}

await mkdir(OUT_DIR, { recursive: true });

for (const [listId, pack] of Object.entries(PACKS)) {
  const path = join(OUT_DIR, `${listId}.json`);
  let sidecar: Sidecar = {};
  if (existsSync(path)) {
    try { sidecar = JSON.parse(await readFile(path, "utf8")) as Sidecar; } catch {}
  }
  for (const lang of ["pl", "de"] as Lang[]) {
    if (sidecar[lang] && Array.isArray(sidecar[lang]!.notes) && sidecar[lang]!.notes!.length === pack.notes.length) {
      console.log(`✓ ${listId}/${lang} already done`);
      continue;
    }
    console.log(`→ ${listId}/${lang} translating...`);
    try {
      sidecar[lang] = await translatePack(pack, lang);
      await writeFile(path, JSON.stringify(sidecar, null, 2) + "\n", "utf8");
      console.log(`✓ ${listId}/${lang} wrote`);
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`✗ ${listId}/${lang}:`, (e as Error).message);
    }
  }
}
console.log("Done.");
