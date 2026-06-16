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

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!hasSpeech()) return;
  // Strip combining stress marks — TTS engines mispronounce them.
  const clean = text.replace(/\u0301/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "ru-RU";
  const voice = getRussianVoice();
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 1;
  u.pitch = 1;

  // Word-boundary support varies. We attach onboundary, and also start a
  // fallback timer that drives word advancement if no boundary fires within
  // ~400ms (notably iOS Safari).
  let boundaryFired = false;
  let fallbackTimers: ReturnType<typeof setTimeout>[] = [];

  if (opts.onBoundary) {
    u.onboundary = (ev) => {
      if (ev.name && ev.name !== "word") return;
      boundaryFired = true;
      opts.onBoundary!(ev.charIndex, (ev as unknown as { charLength?: number }).charLength ?? 0);
    };

    // Precompute word ranges in the cleaned text for the fallback estimator.
    const words: Array<{ start: number; length: number }> = [];
    const re = /\p{L}+/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(clean))) {
      words.push({ start: m.index, length: m[0].length });
    }
    const totalChars = words.reduce((a, w) => a + w.length, 0) || 1;
    // Rough estimate: 14 chars/sec at rate=1, scaled by rate.
    const totalMs = (totalChars / 14) * 1000 / (opts.rate ?? 1);
    let elapsed = 0;
    const start = Date.now();
    const startFallback = () => {
      for (const w of words) {
        const t = elapsed;
        fallbackTimers.push(
          setTimeout(() => {
            if (boundaryFired) return; // native took over
            opts.onBoundary!(w.start, w.length);
          }, t),
        );
        elapsed += (w.length / totalChars) * totalMs;
      }
    };
    // Wait 400ms; if native boundary fired, skip fallback entirely.
    fallbackTimers.push(
      setTimeout(() => {
        if (!boundaryFired) {
          // Adjust for already-elapsed time.
          const drift = Date.now() - start;
          elapsed = drift;
          startFallback();
        }
      }, 400),
    );
  }

  const clearFallback = () => {
    for (const t of fallbackTimers) clearTimeout(t);
    fallbackTimers = [];
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
