
## 1. Mobile-optimized playback, stress marks & word highlights

All changes scoped to `src/routes/list.$listId.tsx`, `src/lib/trainer/speech.ts`, and one new helper.

### Stress-mark rendering
- New helper `src/lib/trainer/stress.tsx` that splits a `ruStressed` sentence into tokens (words + punctuation/whitespace) and, per word, splits the syllable carrying the combining acute `\u0301` so the stressed vowel can be rendered with a distinct style.
- In `ListenCard`, replace the single `<p>` for Russian with a `<p>` of `<WordToken>` spans. Stressed vowel gets `text-primary font-extrabold underline-offset-4` so the accent is unmistakable on a phone screen (the bare combining acute is currently nearly invisible at small sizes).
- Transliteration stays a single line below, but with `break-words` so it never overflows on narrow screens.

### Word-by-word highlights during playback
- Extend `speak()` in `speech.ts` to accept `onBoundary?: (charIndex: number, charLength: number) => void` and wire it to `utterance.onboundary` (only fires for `name === 'word'`).
- `ListenCard` precomputes word char ranges from the cleaned (no-acute) Russian text. While playing, the active word index is highlighted with `bg-primary/15 rounded-md`.
- Fallback for browsers that don't fire `onboundary` (notably iOS Safari): estimate per-word duration from character count and total utterance time, advance with `setTimeout`. We detect support by listening for the first boundary within 400 ms; if none arrives, switch to the estimator for the rest of the utterance.

### Tappable words
- Each `WordToken` is a `<button>` (inline, no chrome) with a 32 px min tap height via `py-1`. Tapping speaks just that word at the current rate; this works in both normal and Listen modes (after reveal).
- Single tap = play word. No long-press, to keep it discoverable.

### Touch-friendly controls
- Top play bar: keep the 44 px play button, but stack into two rows on widths `<480px`: row 1 = play + reps, row 2 = mode toggles. Use `grid grid-cols-[auto_1fr_auto]` per the responsive-layout rules; toggles wrap with `flex-wrap gap-2`.
- Toolbar icon buttons grow from `h-9 w-9` to `h-10 w-10` (40 px) and gain `gap-2` so they don't crowd. Stats row keeps four columns but the today/practiced/reps/mastered labels use `text-[10px]` only ≥`sm`; below that they switch to icons-with-tooltip so the numbers stay legible.
- In-card controls (play / favorite / stars) move into a single `flex flex-wrap` row with `min-w-0` truncation on the English line, fixing the current cramped layout on the 571 px viewport.
- Star row: hit area expands to `h-8 w-8` per star (currently `p-0.5` around a 16 px icon — under the 44 px guideline).
- Add a thin **sticky bottom now-playing bar** (only visible while `playingAll || currentIdx !== null`) showing `#idx`, the current English gloss truncated, and a large Stop button. Keeps controls reachable without scrolling on long lists.

No business-logic changes: settings, store, sentence data, and routing stay intact.

## 2. Grammar notes per list

### Data
- New folder `src/data/grammar/` with one TS module per list id (only the ones that have notes to start; missing = no notes button). Each exports a structured object:

```ts
export interface GrammarNote {
  title: string;          // e.g. "Present tense of -ить verbs"
  body: string;           // 1–3 short paragraphs (markdown-lite: **bold**, _italic_)
  examples?: Array<{ ru: string; en: string; note?: string }>;
}
export interface GrammarPack {
  listId: string;
  intro?: string;         // short overview shown at top of the sheet
  notes: GrammarNote[];
}
```

- New `src/lib/trainer/grammar.ts` exposes `getGrammar(listId): GrammarPack | undefined` with a static map of imports (tree-shaken, no dynamic IO).
- Seed packs for the lists that already have themed content:
  - `a1-part-1` Greetings & pronouns (ты vs вы, dropped copula).
  - `a1-part-3` Present-tense verb endings (-е- / -и- conjugations).
  - `a2-part-1` Past-tense formation (-л/-ла/-ло/-ли).
  - `a2-part-3` Future: imperfective `буду + inf.` vs perfective.
  - `b1-part-2` Conditionals with `бы`.
  - `top-300-verbs` Aspect pairs overview.
  - Others can be added later without code changes.

### UI
- In `list.$listId.tsx`, the existing **Hints** toolbar button (`MessageCircle`) becomes the grammar trigger; rename label to "Grammar notes". It's disabled when `getGrammar(meta.id)` is undefined, with `title="No notes for this list yet"`.
- New `GrammarSheet` component (same file, mirrors `SettingsSheet`): a `Sheet side="bottom"` containing the intro, then each note rendered as a card with title, body (rendered via a tiny `renderInline()` helper that handles `**bold**` and `_italic_`), and an example list. Each Russian example has a small `Volume2` play button reusing `speak()`.

### A11y / minor
- Notes sheet uses `max-h-[88vh] overflow-y-auto` like settings.
- Russian text gets `lang="ru"` for screen readers.

## Out of scope
- Persisting "read" state for notes, AI-generated grammar, or editing notes in-app.
- New levels/lists or backend storage.

## Technical notes
- No new deps. `onboundary` and `speechSynthesis` are already in use.
- iOS Safari word-boundary fallback adds ~30 lines; isolated in `speech.ts` so the component code stays simple.
- All new colors reuse existing tokens (`primary`, `muted`, `border`); no hardcoded hex.
