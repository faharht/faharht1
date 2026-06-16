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

// Approximate Russian TTS speed in characters per second at rate=1.
// Tuned lower (was 14) so word-highlight scheduling matches actual audio
// pacing more closely on engines that do not emit native boundary events.
const CHARS_PER_SEC = 12;
// Small inter-word gap (ms) at rate=1 to account for natural pauses.
const WORD_GAP_MS = 70;

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!hasSpeech()) return;
  // Strip combining stress marks — TTS engines mispronounce them.
  const clean = text.replace(/\u0301/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "ru-RU";
  const voice = getRussianVoice();
  if (voice) u.voice = voice;
  const rate = opts.rate ?? 1;
  u.rate = rate;
  u.pitch = 1;

  // Word-boundary support varies. We attach onboundary, and also start a
  // fallback timer that drives word advancement if no boundary fires within
  // ~250ms (notably iOS Safari, some Chromium voices).
  let boundaryFired = false;
  let fallbackTimers: ReturnType<typeof setTimeout>[] = [];
  let startedAt = 0; // ms timestamp when audio actually began

  // Precompute word ranges & cumulative offsets in the cleaned text.
  const words: Array<{ start: number; length: number; offsetMs: number }> = [];
  if (opts.onBoundary) {
    const re = /\p{L}+/gu;
    let m: RegExpExecArray | null;
    let cursor = 0;
    while ((m = re.exec(clean))) {
      words.push({ start: m.index, length: m[0].length, offsetMs: cursor });
      const durMs = (m[0].length / CHARS_PER_SEC) * 1000 / rate + WORD_GAP_MS / rate;
      cursor += durMs;
    }
  }

  if (opts.onBoundary) {
    u.onboundary = (ev) => {
      if (ev.name && ev.name !== "word") return;
      boundaryFired = true;
      opts.onBoundary!(ev.charIndex, (ev as unknown as { charLength?: number }).charLength ?? 0);
    };

    const scheduleFallback = () => {
      if (boundaryFired || words.length === 0) return;
      const now = Date.now();
      const elapsed = startedAt > 0 ? now - startedAt : 0;
      // Find the word currently being spoken; fire it immediately so the
      // highlight catches up instantly the moment fallback engages.
      let currentIdx = 0;
      for (let i = 0; i < words.length; i++) {
        if (words[i].offsetMs <= elapsed) currentIdx = i;
        else break;
      }
      opts.onBoundary!(words[currentIdx].start, words[currentIdx].length);
      // Schedule the rest relative to the original audio start anchor.
      for (let i = currentIdx + 1; i < words.length; i++) {
        const delay = Math.max(0, words[i].offsetMs - (Date.now() - startedAt));
        fallbackTimers.push(
          setTimeout(() => {
            if (boundaryFired) return;
            opts.onBoundary!(words[i].start, words[i].length);
          }, delay),
        );
      }
    };

    // Probe after 250ms; if native boundary already fired, skip fallback.
    fallbackTimers.push(
      setTimeout(() => {
        if (!boundaryFired) scheduleFallback();
      }, 250),
    );
  }

  const clearFallback = () => {
    for (const t of fallbackTimers) clearTimeout(t);
    fallbackTimers = [];
  };

  u.onstart = () => {
    startedAt = Date.now();
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
  // Anchor immediately as a safety net in case onstart doesn't fire promptly.
  startedAt = Date.now();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();
}
