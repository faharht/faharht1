## Goal

Add Polish as a second app language alongside English. Users pick the language in Settings; every sentence gains a Polish translation displayed in place of English, and the entire UI is translated when Polish is selected.

## Approach

### 1. Settings: app language

- Extend `TrainerSettings` in `src/lib/trainer/types.ts` with `appLanguage: "en" | "pl"` (default `"en"`).
- Add the field to `defaultSettings` in `src/lib/trainer/store.ts`. Zustand `persist` will keep the choice across reloads; existing users get the default via the standard partial-merge.
- Add a language toggle (segmented EN / PL) inside the existing Settings dialog opened from the list screen.

### 2. Sentence translations (`pl` field)

- Extend the `Sentence` type with `pl: string` (optional, fallback to `en`).
- Write `scripts/translate_pl.ts` (Bun script) that:
  - Reads every JSON under `src/data/sentences/`.
  - For each sentence missing `pl`, calls Lovable AI Gateway (`google/gemini-3-flash-preview`) in batches of ~30 with a strict JSON-array prompt: "translate these English meanings to natural Polish; preserve punctuation and parenthetical tags like (formal)".
  - Validates the response length matches input, retries once on mismatch, writes the augmented JSON back in-place with stable formatting.
  - Resumable: skips sentences that already have `pl`, so a re-run only fills gaps.
- Run the script once; commit results into the same JSON files. No runtime AI calls.
- `LOVABLE_API_KEY` is required server-side for the script. Provision it via `ai_gateway--create` if missing before running.

### 3. UI rendering: prefer selected language

- In `src/routes/list.$listId.tsx` and anywhere a sentence's English is displayed (the now-playing bar, search filter, etc.), read `settings.appLanguage` and use `s.pl ?? s.en` when it's `"pl"`. Search query also matches against the active translation field.

### 4. Full UI translation (i18n dictionary)

- Add `src/lib/i18n/strings.ts` exporting a typed `Strings` object keyed by string id (e.g., `nav.profile`, `list.playAll`, `settings.speed`, `profile.dailyGoal`, `auth.signIn`, `onboarding.welcome`, etc.) with `en` and `pl` values.
- Add `src/lib/i18n/useT.ts` — a tiny hook reading `settings.appLanguage` from the trainer store and returning `t(key)` plus the current locale. No external i18n library (keeps bundle small, no SSR config drift).
- Replace every hard-coded English visible string in:
  - `src/routes/__root.tsx`
  - `src/routes/index.tsx`
  - `src/routes/auth.tsx`
  - `src/routes/onboarding.tsx`
  - `src/routes/profile.tsx`
  - `src/routes/list.$listId.tsx`
  - `src/components/BottomNav.tsx`
  - `src/components/profile/ChangeGoalDialog.tsx`
  - `src/components/profile/RepsChart.tsx`
- Grammar overlay labels in `src/lib/trainer/grammar.ts` (titles, explanations) are user-facing; add a `titlePl`/`explanationPl` field per note and read the active language. Same for level/list metadata in `src/lib/trainer/levels.ts` if titles/descriptions are user-visible.
- Date formatting (streaks, history) uses `toLocaleDateString(locale)` driven by the same setting.

### 5. SEO / `<head>`

- Set `<html lang>` dynamically in `__root.tsx` based on the active language (via `useT()` in the shell component).
- Translate the page `title`/`description` per route's `head()` when feasible (English-only is acceptable for the SEO meta if it complicates loaders; in-app UI is what matters).

## Files

New:
- `scripts/translate_pl.ts` — one-shot translation generator.
- `src/lib/i18n/strings.ts` — full EN/PL dictionary.
- `src/lib/i18n/useT.ts` — `useT()` hook + `formatDate(locale)` helper.

Edited:
- `src/lib/trainer/types.ts` — add `appLanguage`, optional `pl` on `Sentence`.
- `src/lib/trainer/store.ts` — default + persisted setting.
- `src/lib/trainer/grammar.ts` — Polish titles/explanations for notes.
- `src/lib/trainer/levels.ts` — Polish list/level labels if any are shown.
- All sentence JSONs under `src/data/sentences/*.json` — `pl` field added by the script.
- All route/component files listed in section 4 — swap literal strings for `t(...)`.

## Out of scope

- Right-to-left or language packs beyond EN/PL.
- Translating the Russian source (`ru`, `ruStressed`, `translit`) — those stay Russian.
- Translating the published marketing/SEO meta on every route (UI-only is the priority; meta can follow).
