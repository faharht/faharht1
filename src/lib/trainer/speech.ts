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

function makeUtterance(text: string, rate: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ru-RU";
  const voice = getRussianVoice();
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1;
  return u;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!hasSpeech()) return;
  // Strip combining stress marks — TTS engines mispronounce them.
  const clean = text.replace(/\u0301/g, "");
  const rate = opts.rate ?? 1;

  window.speechSynthesis.cancel();

  // Single-utterance path when no per-word callback is needed.
  if (!opts.onBoundary) {
    const u = makeUtterance(clean, rate);
    u.onend = () => opts.onEnd?.();
    u.onerror = () => opts.onError?.();
    window.speechSynthesis.speak(u);
    return;
  }

  // Per-word path: queue one utterance per word so `onstart` fires exactly
  // when the engine begins each word — frame-accurate highlight sync that
  // doesn't depend on flaky `onboundary` support.
  const words: Array<{ text: string; start: number; length: number }> = [];
  const re = /\p{L}+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    words.push({ text: m[0], start: m.index, length: m[0].length });
  }

  if (words.length === 0) {
    const u = makeUtterance(clean, rate);
    u.onend = () => opts.onEnd?.();
    u.onerror = () => opts.onError?.();
    window.speechSynthesis.speak(u);
    return;
  }

  let errored = false;
  words.forEach((w, i) => {
    const u = makeUtterance(w.text, rate);
    u.onstart = () => {
      opts.onBoundary?.(w.start, w.length);
    };
    if (i === words.length - 1) {
      u.onend = () => {
        if (!errored) opts.onEnd?.();
      };
    }
    u.onerror = () => {
      if (errored) return;
      errored = true;
      window.speechSynthesis.cancel();
      opts.onError?.();
    };
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking(): void {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();
}
