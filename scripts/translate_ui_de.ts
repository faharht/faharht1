#!/usr/bin/env bun
/**
 * Reads src/lib/i18n/strings.ts, extracts every entry that has `en` but no `de`,
 * asks the Lovable AI Gateway to translate each English string into German
 * (preserving placeholder tokens like {n}, {date}, etc.), and patches the file
 * in place by inserting a `de: "..."` value next to each `pl` value.
 *
 * Idempotent: rerunning only fills entries still missing `de`.
 */
import { readFile, writeFile } from "node:fs/promises";

const FILE = "src/lib/i18n/strings.ts";
const MODEL = "google/gemini-3-flash-preview";
const API = "https://ai.gateway.lovable.dev/v1/chat/completions";
const BATCH = 40;

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("LOVABLE_API_KEY missing"); process.exit(1); }

async function translateBatch(items: string[]): Promise<string[]> {
  const numbered = items.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const prompt =
    "Translate each English UI string into natural, concise German suitable for a mobile app UI. " +
    "Preserve every placeholder token exactly as-is (e.g. {n}, {date}, {pct}, {total}, {avg}, {hit}, {next}, {level}, {part}, {done}, {t}, {w}, {reps}, {practiced}). " +
    "Preserve punctuation, emoji, casing style (e.g. ALL CAPS stays ALL CAPS), and arrows like →. " +
    'Return ONLY a JSON object {"de":["...","..."]} with one German string per input, in order. No commentary.\n\n' +
    numbered;
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": KEY!,
      "X-Lovable-AIG-SDK": "raw-script",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}") as { de?: unknown };
  if (!Array.isArray(parsed.de)) throw new Error("bad: no de[]");
  if (parsed.de.length !== items.length) throw new Error(`length: got ${parsed.de.length}, want ${items.length}`);
  return parsed.de.map((x) => String(x));
}

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 6): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const msg = (e as Error).message;
      const wait = msg.includes("429") ? 5000 * (i + 1) : 1500 * (i + 1);
      console.warn(`retry ${label} in ${wait}ms: ${msg.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// Parse lines like:
//   "key":            { en: "English",  pl: "Polish" },
//   "key": { en: "English", pl: "Polish", de: "German" },
// We add a de field next to pl when missing.
const src = await readFile(FILE, "utf8");
const lines = src.split("\n");

interface Entry { lineIdx: number; en: string; raw: string; }
const entries: Entry[] = [];

// Match an entry line that has both en: "..." and pl: "..." but no de:
// Use non-greedy matching, support escaped quotes.
const RE = /^(\s*"[^"]+":\s*\{\s*en:\s*"((?:[^"\\]|\\.)*)",\s*pl:\s*"((?:[^"\\]|\\.)*)"\s*\},?\s*(?:\/\/.*)?)\s*$/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(" de:") || line.includes(",de:")) continue;
  const m = RE.exec(line);
  if (!m) continue;
  const en = JSON.parse(`"${m[2]}"`);
  entries.push({ lineIdx: i, en, raw: m[1] });
}

console.log(`Missing de translations: ${entries.length}`);
if (entries.length === 0) { console.log("done."); process.exit(0); }

// Batch and translate
for (let start = 0; start < entries.length; start += BATCH) {
  const slice = entries.slice(start, start + BATCH);
  const out = await withRetry(
    () => translateBatch(slice.map((e) => e.en)),
    `batch ${start / BATCH + 1}`,
  );
  for (let i = 0; i < slice.length; i++) {
    const e = slice[i];
    const de = out[i].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    // Insert de: "..." before the closing }
    const orig = lines[e.lineIdx];
    // Replace `pl: "..."` followed by ` }` with `pl: "...", de: "..." }`
    const replaced = orig.replace(
      /(pl:\s*"(?:[^"\\]|\\.)*")(\s*\})/,
      `$1, de: "${de}"$2`,
    );
    lines[e.lineIdx] = replaced;
  }
  await writeFile(FILE, lines.join("\n"), "utf8");
  console.log(`  wrote ${Math.min(start + BATCH, entries.length)}/${entries.length}`);
  await new Promise((r) => setTimeout(r, 500));
}

console.log("Done.");
