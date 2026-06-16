# Fix: Grammar notes matching unrelated sentences

## The bug

On `/list/a1-part-1` the **Personal pronouns** note lists "Конечно. / Of course." It shouldn't — that sentence has no pronoun in it.

Root cause is in `resolveMatches()` in `src/routes/list.$listId.tsx` (line ~982):

```ts
const hay = (s.ru + " " + s.en).toLowerCase();
if (needles.some((n) => hay.includes(n.toLowerCase()))) { ... }
```

Combined with the overlay in `src/lib/trainer/grammar.ts` for `a1-part-1`:

```ts
{ contains: ["я", "ты", "он", "она", "мы", "вы", "они"] }
```

`includes()` does raw substring matching, so single Cyrillic letters/short pronouns match inside any longer word:

- "Кон**он**ечно" — `Конечно` contains `он` → matched as a pronoun
- "До свидани**я**" → matches `я`
- "**Of** course" → also matches `вы`? no — but `я` matches Russian word endings everywhere

The same class of bug exists in other packs that depend on substring matching (e.g. b1-part-2 already works around it by using `" бы "` with spaces, b2-part-1 keys on suffixes like "ющий" which is fine, b2-part-4 uses `" что "` / `" ли "` with spaces — fragile).

## Fix

Switch `resolveMatches()` from `String.includes` to **whole-word matching** using a Unicode-aware regex.

### Changes

**`src/routes/list.$listId.tsx` — `resolveMatches()`**

Replace the substring check with a per-needle regex:

```ts
function makeNeedleRegex(needle: string): RegExp {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
  // If the needle already contains a space, treat it as a phrase (no \b around spaces).
  // Use Unicode letter class so Cyrillic counts as a "word" character.
  return new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "iu");
}

// inside the loop:
const hay = s.ru + " " + s.en;
if (needles.some((n) => makeNeedleRegex(n).test(hay))) { ... }
```

This treats every needle as a whole token bounded by non-letter characters (punctuation, spaces, string edges). Cyrillic letters are recognized via `\p{L}` with the `u` flag, so `он` will no longer match inside `Конечно`, and `я` will no longer match inside `свидания` / `меня`.

Suffix-style needles in `b2-part-1` (`"ющий"`, `"вший"`, `"нный"`…) still work because the lookbehind only rejects a letter **before** the needle; the needle itself contains the preceding letters of the participle ending, and what comes before in the word is fine — wait, that breaks suffixes. We need an exception.

### Suffix handling

For `b2-part-1` we explicitly want suffix matches. Two options:

1. Treat needles that **start with a Cyrillic letter that is a common suffix linker** as suffixes — too fuzzy.
2. **Cleanest**: extend the overlay schema to allow `{ endsWith: [...] }` and keep `contains` strictly whole-word.

Plan: add a new optional field to `match`:

```ts
match?: { contains?: string[]; endsWith?: string[] };
```

- `contains` → whole-word match (new behavior).
- `endsWith` → matches if any token in the sentence ends with the needle (used for participle/gerund suffixes).

Then update `b2-part-1` and `b2-part-2` overlays in `grammar.ts` to use `endsWith` for suffixes:

```ts
"b2-part-1": {
  tags: ["participles"],
  matches: [
    { endsWith: ["ющий", "ущий", "ящий", "ащий", "ющая", "ющее", "ющие"] },
    { endsWith: ["вший", "вшая", "вшее", "вшие"] },
    { endsWith: ["нный", "нная", "нное", "нные", "тый", "тая", "тое", "тые"] },
  ],
},
"b2-part-2": {
  tags: ["gerunds"],
  matches: [
    { endsWith: ["ая", "яя"], contains: ["читая", "говоря", "идя", "глядя", "слушая"] },
    { endsWith: ["ав", "ив", "ыв"], contains: ["прочитав", "сказав", "сделав", "закончив"] },
  ],
},
```

(Conservative: keep the existing `contains` entries for b2-part-2 since broad suffix matches like "ая"/"яя" would also catch adjectives. We can keep just `contains` there if safer — final call during implementation.)

`endsWith` is implemented as:

```ts
const tokenEndsWith = (text: string, suffix: string) =>
  new RegExp(`[\\p{L}]*${suffix}(?![\\p{L}])`, "iu").test(text);
```

### Verification

After the change, for `a1-part-1` Personal pronouns the matched sentences should include only:

- "А у тебя?" — `тебя` is a pronoun form, but `ты` is no longer a substring match. We need it to still appear. **Solution**: add the inflected forms to the needles for that note, e.g. `["я", "ты", "он", "она", "оно", "мы", "вы", "они", "меня", "тебя", "его", "её", "нас", "вас", "их", "мне", "тебе", "ему", "ей", "нам", "вам", "им"]`. All are real standalone pronoun tokens, so whole-word matching is correct and "Конечно" stops being matched.

Update the `a1-part-1` Personal pronouns overlay needle list accordingly.

### Files touched

- `src/routes/list.$listId.tsx` — replace substring check with regex helpers; add `endsWith` handling.
- `src/lib/trainer/grammar.ts` —
  - extend `GrammarNote.match` type with `endsWith?: string[]`.
  - expand `a1-part-1` pronouns needle list to include inflected pronoun forms.
  - migrate `b2-part-1` (and selectively `b2-part-2`) overlay entries to use `endsWith` for suffix-based rules.

### Out of scope

- No data files under `src/data/grammar/*` change.
- No UI / styling changes; the "FROM THIS LIST" section keeps the same shape and 5-row cap.
- Other packs already use phrase-style needles (`"У меня"`, `"если"`, `"больше"`) — those are whole words and behave identically or better under the new matcher; no edits needed.
