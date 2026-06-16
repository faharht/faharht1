// Tokenize a (optionally stressed) Russian string into words and separators.
// A "word" preserves the combining acute (\u0301) so the consumer can render
// the stressed vowel with emphasis.

export type StressToken =
  | { type: "word"; raw: string; plain: string; wordIndex: number }
  | { type: "sep"; raw: string };

// Match runs of letters (any unicode letter) plus combining marks; everything
// else (spaces, punctuation) becomes a separator.
const WORD_RE = /[\p{L}\u0301]+/gu;

export function tokenizeStressed(text: string): StressToken[] {
  const out: StressToken[] = [];
  let last = 0;
  let wordIndex = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ type: "sep", raw: text.slice(last, start) });
    const raw = m[0];
    out.push({
      type: "word",
      raw,
      plain: raw.replace(/\u0301/g, ""),
      wordIndex: wordIndex++,
    });
    last = start + raw.length;
  }
  if (last < text.length) out.push({ type: "sep", raw: text.slice(last) });
  return out;
}

// Split a single word (with optional \u0301) into [before, stressedVowel, after].
// If no stress mark exists, returns [word, "", ""].
export function splitStressedWord(word: string): [string, string, string] {
  const idx = word.indexOf("\u0301");
  if (idx <= 0) return [word, "", ""];
  // The acute sits AFTER the vowel it stresses.
  const before = word.slice(0, idx - 1);
  const vowel = word[idx - 1] ?? "";
  const after = word.slice(idx + 1);
  return [before, vowel, after];
}
