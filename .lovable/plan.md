## Goal

Bring every A1–B2 part (16 lists total) up to **~150 sentences each**, and ship a themed **grammar pack per part** (16 packs). Extras (`top-300-*`, `basic-verb-conjugations`) are left untouched.

## Current vs target

| Level | Current range | Target |
| --- | --- | --- |
| A1 p1–4 | 103–119 | 150 each |
| A2 p1–4 | 126–134 | 150 each |
| B1 p1–4 | 100–102 | 150 each |
| B2 p1–4 | 50–101 | 150 each |

≈ **800 new sentences** total. Grammar: keep the 6 existing packs, add **10 new ones** (a1 p2/p4, a2 p2/p4, b1 p1/p3/p4, b2 p1/p2/p3/p4 — 10 net new files).

## Approach: AI Gateway at author time

Generation is a one-time build step, **not a runtime feature**. The app code does not change shape.

### New script: `scripts/expand_sentences.py`

- Reads each existing `src/data/sentences/<list>.json` to learn the theme, tone, and already-used phrases.
- For each list under-target, calls Lovable AI Gateway (`google/gemini-3-flash-preview`, structured JSON output via `--schema`) asking for **N additional sentences** that:
  - Match the part's theme (from `levels.ts` `partTheme`).
  - Avoid duplicating any existing `ru` string in that file.
  - Stay inside the CEFR level's grammar/vocabulary budget (passed in the prompt).
  - Each item returns `{ru, ruStressed, translit, en}` — `id` is appended by the script as `<listId>-<n>`.
- Validates every item:
  - Required fields non-empty; `ru` unique within file.
  - `ruStressed` contains the combining acute `\u0301` on at least one vowel per multi-syllable word (regex check).
  - `translit` is ASCII-only.
  - Drop and re-request bad items until quota met or 3 retries.
- Appends to the JSON file, sorted to keep the existing order stable (new items at the end).
- Idempotent: re-running on a list already at ≥150 is a no-op.

Run via the existing `ai-gateway` skill pattern (`python /tmp/lovable_ai.py` under the hood), so `LOVABLE_API_KEY` is read from the sandbox env. Script lives in `scripts/` next to the existing `gen_*.py`.

### New script: `scripts/expand_grammar.py`

- For each of the 10 missing list ids, calls the gateway with a schema matching `GrammarPack` (intro + 2–4 notes, each with title/body/examples).
- Body uses the same markdown-lite (`**bold**`, `_italic_`) the existing `renderInline()` already handles — no UI work.
- Writes `src/data/grammar/<list-id>.ts` exporting a typed `GrammarPack`, then I update `src/lib/trainer/grammar.ts` to register the new imports in the `PACKS` map.
- Topics are pre-seeded per id so we don't ask the model to pick (keeps content aligned with `levels.ts` `partTheme`):
  - a1-p2: noun gender & plurals
  - a1-p4: prepositions of place (в/на + prepositional)
  - a2-p2: accusative for direct objects; modal `хотеть/мочь/должен`
  - a2-p4: dative for feelings (мне холодно/нравится)
  - b1-p1: expressing opinion (думать что / считать); reflexive `-ся`
  - b1-p3: instrumental case basics
  - b1-p4: comparatives & superlatives (лучше, самый)
  - b2-p1: short-form participles
  - b2-p2: gerunds (деепричастия) for simultaneous actions
  - b2-p3: idioms — register notes, no new rules
  - b2-p4: indirect speech (что vs ли)

### Quality controls

- Each prompt includes 3–5 sample rows from the file as **style anchors** (same sentence length, same translit conventions, same en gloss style).
- Temperature 0.4; `response_format` JSON via tool schema so we never have to parse markdown.
- After generation, run `bun x tsc --noEmit` to catch any TS issue in the new `.ts` grammar files.
- Spot-check: print 5 random new rows per list for me to eye-ball before declaring done.

### App code changes

Tiny, mechanical:

1. `src/lib/trainer/grammar.ts` — import & register the 10 new packs.
2. Nothing else. The list view already auto-shows the Grammar button when a pack exists, and `getSentences()` picks up the longer JSON files automatically.

## Out of scope

- New routes, new UI, new levels.
- Extras lists (top-300-*, basic-verb-conjugations).
- Persisting read state, in-app grammar editing, audio assets.
- Spaced-repetition or store changes — the longer lists work with the existing trainer logic.

## Technical notes

- Generation is **author-time only**: scripts run in the dev sandbox and commit JSON/TS. No `LOVABLE_API_KEY` use at runtime, no edge functions, no client AI calls.
- `ai_gateway--create` will be invoked first to ensure the key exists in the sandbox.
- Approximate cost: ~800 short JSON completions on a Flash model — within typical free allowance, but I'll warn if 429/402 surfaces.
- Diffs will be large (JSON append-only + 10 new grammar files + 1 import update); structure stays git-friendly because new items go at the end of each array.
