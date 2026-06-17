## Goal

1. Make the highlighted word match exactly when each Russian word is actually spoken.
2. Auto-scroll the playing sentence into view so the user never has to scroll during playback.

## Approach

### 1. Per-word utterance playback (precise sync)

The current sync issue is fundamental: `SpeechSynthesisUtterance.onboundary` is unreliable across browsers/voices, and our fallback estimates timing from a hard-coded `CHARS_PER_SEC`. Russian word durations vary too much for that estimate to feel "exact."

Switch `speak()` in `src/lib/trainer/speech.ts` to queue **one utterance per word** when an `onBoundary` callback is provided:

- Split the cleaned text into word tokens with their original `charIndex` (via `\p{L}+` regex, identical to the highlighter's logic so indices line up).
- For each word, create its own `SpeechSynthesisUtterance` and queue them sequentially with `speechSynthesis.speak`.
- Use that utterance's `onstart` to fire `onBoundary(charIndex, length)` — this fires the moment the engine actually begins that word, giving frame-accurate highlight sync regardless of voice/engine.
- Fire the original `onEnd` only after the last word's `onend`.
- Track all queued utterances so `stopSpeaking()` / cancel paths clear them; remove the old fallback-timer machinery (no longer needed).
- Punctuation/spacing is preserved by speaking each word alone — slight prosody loss is acceptable for the sync win; rate/voice settings still apply.

If `onBoundary` is not provided (e.g., `playWord(single word)`), keep the single-utterance path unchanged.

### 2. Auto-scroll to currently playing sentence

In `src/routes/list.$listId.tsx`, add an effect that watches `currentIdx`. When it changes to a non-null value, look up the sentence id (`visibleSentences[currentIdx].id`), find `#s-${id}`, and call `scrollIntoView({ behavior: "smooth", block: "center" })`. Reuses the same id pattern already used by the search-focus effect.

Guard against scrolling when the element is already comfortably in view (compare `getBoundingClientRect()` against viewport with a margin) so manual scrolling isn't fought during a single sentence's playback — only re-centers when the new sentence is off-screen or near edges.

## Files

- `src/lib/trainer/speech.ts` — rewrite `speak()` to queue per-word utterances when `onBoundary` is supplied; drop the boundary/fallback estimator code.
- `src/routes/list.$listId.tsx` — add an effect on `currentIdx` that smooth-scrolls the active sentence into view when off-screen.

## Out of scope

- No UI/styling changes to the highlight itself.
- No changes to grammar matching, settings, or the now-playing bar.
