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

export function speak(
  text: string,
  opts: { rate?: number; onEnd?: () => void; onError?: () => void } = {},
): void {
  if (!hasSpeech()) return;
  // Strip combining stress marks — TTS engines mispronounce them.
  const clean = text.replace(/\u0301/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "ru-RU";
  const voice = getRussianVoice();
  if (voice) u.voice = voice;
  u.rate = opts.rate ?? 1;
  u.pitch = 1;
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onError?.();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();
}
