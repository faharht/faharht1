# Add new vocabulary categories

Add four new lists to the home page: one under Beginner and three under Intermediate, matching the cards in the reference screenshot.

## New lists

| ID | Band | Title | Sentences |
|---|---|---|---|
| `basic-verb-conjugations` | Beginner | Basic Verb Conjugations (Present · Past · Future) | ~180 |
| `top-300-adjectives` | Intermediate | 300 Most Common Adjectives | 300 |
| `top-300-adverbs` | Intermediate | 300 Most Common Adverbs | 300 |
| `top-300-verbs` | Intermediate | 300 Most Common Verbs | 300 |

Each sentence keeps the existing schema: `id`, `ru`, `ruStressed`, `translit`, `en` — so audio (browser TTS), transliteration toggle, masking, and favorites all work automatically.

### Content shape

- **Basic Verb Conjugations** — one list covering ~30 high-frequency verbs (быть, идти, ехать, говорить, делать, читать, писать, есть, пить, видеть, знать, хотеть, мочь, любить, жить, работать, учиться, спать, думать, понимать, etc.) with example sentences in 1st/2nd/3rd person across all three tenses, ~180 total.
- **300 adjectives / adverbs / verbs** — one sentence per target word, with the target word stressed naturally inside a natural everyday sentence. Lists are derived from standard Russian frequency lists.

## Technical details

1. Extend `src/lib/trainer/levels.ts`:
   - Add an optional `extras: ListMeta[]` field to `LevelGroup` (or to `BandGroup`) for cards that sit outside the A1/A2/B1/B2 part grid.
   - Use `iconTone` so the "Basic Verb Conjugations" card gets a green left border (Beginner) and the three "300 Most Common" cards get an amber/orange left border (Intermediate), matching the screenshot.
2. Update `src/routes/index.tsx`:
   - Render the extras as full-width cards directly inside each band, after the level accordions, using the book-icon style shown in the screenshot.
   - Bump the "16 categories" counter to the new total (20).
3. Create four JSON files in `src/data/sentences/`:
   - `basic-verb-conjugations.json`
   - `top-300-adjectives.json`
   - `top-300-adverbs.json`
   - `top-300-verbs.json`
4. Generate content with a Python script under `scripts/` (same pattern as `gen_a2.py` / `gen_b1b2.py`) so the data is reviewable and regeneratable.

No changes to the trainer page, store, or speech engine — the new lists plug into the existing `getSentences(listId)` lookup.

## Out of scope

- Splitting Basic Verb Conjugations into three separate sub-lists (Present / Past / Future). The screenshot shows one card; if you want sub-lists instead, say so and I'll restructure.
- Adding audio files. Audio continues to use the browser speech synthesizer already wired up.
