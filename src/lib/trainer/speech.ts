// Lightweight wrapper around the Web Speech API for Russian playback.

export function hasSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getRussianVoice(): SpeechSynthesisVoice | null {
  if (!hasSpeech()) return null;
  const voices = window.speechSynthesis.getVoices();
  const ru = voices.find((v) => v.lang?.toLowerCase().startsWith("ru"));
  return ru ?? null;
}

export interface SpeakOptions {
  rate?: number;
  onEnd?: () => void;
  onError?: () => void;
  // Fires for each spoken word. charIndex is into the CLEANED text (no \u0301).
  onBoundary?: (charIndex: number, charLength: number) => void;
}

// Approximate Russian TTS speed at rate=1, used only for the fallback
// scheduler on engines that don't emit `onboundary` events.
const CHARS_PER_SEC = 13;
const WORD_GAP_MS = 60;

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!hasSpeech()) return;
  // Strip combining stress marks — TTS engines mispronounce them.
  const clean = text.replace(/\u0301/g, "");
  const rate = opts.rate ?? 1;

  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "ru-RU";
  const voice = getRussianVoice();
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1;

  // Precompute word ranges so we can drive a fallback scheduler when the
  // engine does not emit `onboundary` events (notably iOS Safari).
  const words: Array<{ start: number; length: number; offsetMs: number }> = [];
  if (opts.onBoundary) {
    const re = /\p{L}+/gu;
    let m: RegExpExecArray | null;
    let cursor = 0;
    while ((m = re.exec(clean))) {
      words.push({ start: m.index, length: m[0].length, offsetMs: cursor });
      cursor += ((m[0].length / CHARS_PER_SEC) * 1000) / rate + WORD_GAP_MS / rate;
    }
  }

  let boundaryFired = false;
  let fallbackTimers: ReturnType<typeof setTimeout>[] = [];
  let startedAt = 0;
  let lastFiredIdx = -1;

  const fireWord = (i: number) => {
    if (i <= lastFiredIdx) return;
    lastFiredIdx = i;
    opts.onBoundary?.(words[i].start, words[i].length);
  };

  const clearFallback = () => {
    for (const t of fallbackTimers) clearTimeout(t);
    fallbackTimers = [];
  };

  if (opts.onBoundary) {
    u.onboundary = (ev) => {
      if (ev.name && ev.name !== "word") return;
      boundaryFired = true;
      // Map engine charIndex to our precomputed word index for safety.
      const ci = ev.charIndex ?? 0;
      const wi = words.findIndex((w) => ci >= w.start && ci < w.start + w.length);
      if (wi >= 0) fireWord(wi);
      else opts.onBoundary!(ci, (ev as unknown as { charLength?: number }).charLength ?? 0);
    };
  }

  u.onstart = () => {
    startedAt = Date.now();
    // After a short probe, if no native boundary has fired, schedule fallback
    // highlights anchored at the real audio start.
    if (!opts.onBoundary || words.length === 0) return;
    fallbackTimers.push(
      setTimeout(() => {
        if (boundaryFired) return;
        // Catch up immediately to whichever word should be playing now.
        const elapsed = Date.now() - startedAt;
        let cur = 0;
        for (let i = 0; i < words.length; i++) {
          if (words[i].offsetMs <= elapsed) cur = i;
          else break;
        }
        fireWord(cur);
        for (let i = cur + 1; i < words.length; i++) {
          const delay = Math.max(0, words[i].offsetMs - (Date.now() - startedAt));
          fallbackTimers.push(
            setTimeout(() => {
              if (boundaryFired) return;
              fireWord(i);
            }, delay),
          );
        }
      }, 220),
    );
  };
  u.onend = () => {
    clearFallback();
    opts.onEnd?.();
  };
  u.onerror = () => {
    clearFallback();
    opts.onError?.();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();
}
