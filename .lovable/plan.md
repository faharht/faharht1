## 1. Fix the malformed grammar examples (the "type errors" in the screenshot)

The grammar generator leaked raw JSON delimiters into 4 `ru` fields. The screenshot shows `Книга, написанная им, стала бестселлером."},{en:` — that's the literal stored value, not a render bug.

Found via grep:

| File | Bad fragment in `ru` |
| --- | --- |
| `src/data/grammar/a2-part-4.ts` | `Мне холодно.配合},{en:` |
| `src/data/grammar/b2-part-1.ts` | `Женщина, сидящая у окна, — моя сестра.连},{en:` |
| `src/data/grammar/b2-part-1.ts` | `Книга, написанная им, стала бестселлером."},{en:` |
| `src/data/grammar/b2-part-1.ts` | `Студенты, закончившие тест, могут идти."},{en:` |

Fix: strip the trailing junk (`"},{en:`, `连`, `配合`) from each `ru` value by hand-editing those 4 lines. No script — too small. Also add a tiny validator step to `scripts/expand_grammar.py` (`re.search(r'[\u4e00-\u9fff]|"\},|\{en:|\{ru:'`) so future regenerations reject items with leaked delimiters or stray CJK characters.

## 2. Search + filters on the home page

The home page (`src/routes/index.tsx`) becomes searchable. URL state via `validateSearch`, so filters survive refresh and are linkable.

### Search bar

A sticky bar under the hero, mobile-first:
- Text input (`Search lists, topics, grammar...`).
- Level chips: `A1 · A2 · B1 · B2` (multi-select, toggle on tap, deselect all = show all).
- Grammar tag chips: derived once from the `GrammarPack.tags` (see §3). Horizontally scrollable on mobile, multi-select.
- "Clear" link appears when any filter is active.

### URL shape

```ts
validateSearch(s) => ({
  q: string,                   // text query
  levels: Array<"A1"|"A2"|"B1"|"B2">,
  tags: string[],              // grammar tags
})
```

All optional, defaulted via `fallback(...)` per the TanStack search-params guidance. Filters update with `navigate({ search: prev => ({...}) })`.

### Filter logic

For each list in `BANDS`:
- **Level**: include if `levels.length === 0 || levels.includes(list.level)`.
- **Tags**: include if `tags.length === 0 || pack(list.id)?.tags.some(t => tags.includes(t))`.
- **Text**: case-insensitive match against `list.title + " " + list.description + " " + (pack notes titles)`. Top-300 extras participate too.

When a band ends up empty under the active filter, hide the band header. When everything is empty, show an "No lists match" empty state with a Clear button.

Level accordions auto-expand when any filter is active (so users see results, not collapsed sections).

Out of scope here: full-text sentence search. That's a different UX and would require shipping all 16 JSON files to the client at index time. We can revisit if asked.

## 3. Grammar notes — tags + concrete examples from the list

Goal: each rule shows examples drawn from the list's own sentences, plus a way to jump back to those sentences in the trainer.

### Data shape additions

`src/lib/trainer/grammar.ts`:

```ts
export interface GrammarPack {
  listId: string;
  intro?: string;
  tags?: string[];             // NEW: e.g. ["past tense", "aspect"]
  notes: GrammarNote[];
}
export interface GrammarNote {
  title: string;
  body: string;
  examples?: GrammarExample[];          // hand-authored, unchanged
  matchIds?: string[];                  // NEW: explicit sentence ids in the same list
  match?: { contains?: string[] };      // NEW: fallback — auto-match sentences whose `ru` contains any of these substrings
}
```

Add `tags` + a small `match` block to each existing pack. Tags are chosen from a curated vocabulary so the home-page filter stays tidy:

> present tense · past tense · future tense · aspect · cases · nominative · genitive · dative · accusative · instrumental · prepositional · pronouns · numerals · adjectives · adverbs · prepositions · modals · reflexive · conditionals · participles · gerunds · comparatives · indirect speech · idioms

A pack picks 1–4 of these. Manual edit, not generated.

### Rendering changes in `GrammarSheet` (`src/routes/list.$listId.tsx`)

Each note now renders three sections in order:

1. **Body** (existing).
2. **Examples** (existing hand-authored ones, unchanged).
3. **From this list** (NEW): up to 5 sentences resolved at render time by:
   - `matchIds` lookup against the loaded `sentences` array, then
   - if fewer than 5, fall back to `match.contains` substring matches on `ru` and `en`,
   - de-duped, sorted by original list order.

Each "From this list" row is a button with:
- `Volume2` play icon (reuses `speak()`).
- The Russian (with `WordToken` stress rendering), translit, and English.
- A small `Jump to sentence` link → closes the sheet, scrolls the list card into view, and pulses its border for ~1.2 s.

### Jump-to-sentence behavior

- Add an `id={`s-${sentence.id}`}` ref on each list card in the trainer.
- New `useState<string | null>(focusId)`; setting it triggers `el.scrollIntoView({ behavior: "smooth", block: "center" })` and a temporary `ring-2 ring-primary/60` highlight cleared after 1200 ms via `setTimeout`.
- The grammar sheet closes (`onOpenChange(false)`) before the scroll so the card isn't hidden.

### Edge cases

- Pack with no `tags` / no `match` data: notes still render exactly as today. No regression.
- Pack for a list with no JSON (none today, but defensive): "From this list" section is hidden.
- `extras` lists (`top-300-verbs`) keep their existing pack — they just won't show in grammar-tag filters unless we add tags. I'll add `tags: ["aspect"]` for `top-300-verbs`.

## Out of scope

- Full sentence-level search on the home page.
- Editing grammar notes in-app.
- Persisting search filters per-user (URL state is enough).
- Regenerating any sentences or grammar via AI — only the 4 hand-fixes above.

## Technical notes

- Filter UI uses existing shadcn primitives (`Input`, plain buttons styled like chips). No new deps.
- Tag list lives in a single `GRAMMAR_TAGS` const in `src/lib/trainer/grammar.ts` and is the source of truth for both pack typing and the chip strip.
- `validateSearch` uses `zodValidator` + `fallback` from `@tanstack/zod-adapter` (already in use elsewhere if needed; otherwise added — small dep).
- Scroll-into-view is plain DOM (`document.getElementById`) inside an effect; works in SSR-safe way because the effect only runs client-side.
