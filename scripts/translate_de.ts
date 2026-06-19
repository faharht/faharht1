#!/usr/bin/env bun
/**
 * One-shot script: adds a `de` field (German translation) to every sentence in
 * src/data/sentences/*.json that is missing one. Uses Lovable AI Gateway.
 *
 * Idempotent / resumable: rerunning only fills in sentences still missing `de`.
 *
 * Run with: bun run scripts/translate_de.ts
 * Requires: LOVABLE_API_KEY in env.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = "src/data/sentences";
const BATCH = 40;
const CONCURRENCY = 1;
const REQUEST_DELAY_MS = 500;
const MODEL = "google/gemini-3-flash-preview";
const API = "https://ai.gateway.lovable.dev/v1/chat/completions";

const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) {
  console.error("LOVABLE_API_KEY missing");
  process.exit(1);
}

interface Sentence {
  id: string;
  ru: string;
  ruStressed?: string;
  translit?: string;
  en: string;
  de?: string;
}

async function translateBatch(items: { en: string; ru: string }[]): Promise<string[]> {
  const numbered = items.map((it, i) => `${i + 1}. EN: ${it.en}\n   RU: ${it.ru}`).join("\n");
  const prompt =
    "You translate English meanings of Russian sentences into natural German. " +
    "The Russian source is provided only as context. Translate the English meaning into German. " +
    "Preserve punctuation and any parenthetical tags like (formal), (informal), (plural). " +
    "Keep it concise and natural. Return ONLY a JSON object of the form " +
    '{"de":["...","..."]} with exactly one German string per input, in order. No commentary.\n\n' +
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
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { de?: unknown };
  if (!Array.isArray(parsed.de)) throw new Error("Bad response: no de[]");
  const arr = parsed.de as unknown[];
  if (arr.length !== items.length) {
    throw new Error(`Length mismatch: got ${arr.length}, want ${items.length}`);
  }
  return arr.map((x) => String(x));
}

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 8): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      const msg = (e as Error).message;
      const isRate = msg.includes("429");
      const wait = isRate ? 5000 * (i + 1) : 1500 * (i + 1);
      console.warn(`  retry ${label} (${i + 1}/${tries}) in ${wait}ms: ${msg.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function pool<T>(items: T[], n: number, work: (t: T, i: number) => Promise<void>) {
  const queue = items.map((it, i) => ({ it, i }));
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (queue.length) {
        const next = queue.shift()!;
        await work(next.it, next.i);
      }
    }),
  );
}

async function processFile(file: string) {
  const path = join(DATA_DIR, file);
  const raw = await readFile(path, "utf8");
  const sentences = JSON.parse(raw) as Sentence[];

  const missingIdx = sentences.flatMap((s, i) => (s.de && s.de.trim() ? [] : [i]));
  if (missingIdx.length === 0) {
    console.log(`✓ ${file} — already complete`);
    return;
  }
  console.log(`→ ${file} — ${missingIdx.length} missing (of ${sentences.length})`);

  const batches: number[][] = [];
  for (let i = 0; i < missingIdx.length; i += BATCH) {
    batches.push(missingIdx.slice(i, i + BATCH));
  }

  let done = 0;
  await pool(batches, CONCURRENCY, async (idxs, bi) => {
    const inputs = idxs.map((i) => ({ en: sentences[i].en, ru: sentences[i].ru }));
    const out = await withRetry(() => translateBatch(inputs), `${file} batch ${bi}`);
    for (let j = 0; j < idxs.length; j++) {
      sentences[idxs[j]].de = out[j];
    }
    done += idxs.length;
    if (done % 90 < BATCH) console.log(`  ${file}: ${done}/${missingIdx.length}`);
    // Persist incrementally so a crash mid-file keeps progress.
    await writeFile(path, JSON.stringify(sentences, null, 2) + "\n", "utf8");
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
  });

  await writeFile(path, JSON.stringify(sentences, null, 2) + "\n", "utf8");
  console.log(`✓ ${file} — wrote ${missingIdx.length} translations`);
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json")).sort();
console.log(`Found ${files.length} sentence files`);
for (const f of files) {
  try { await processFile(f); }
  catch (e) { console.error(`✗ ${f}:`, (e as Error).message); }
}
console.log("Done.");
