/** Shared Web Speech helpers. Do not call getUserMedia here — it double-starts the mic and plays a click. */

export type SpeechRecResult = { isFinal: boolean; 0?: { transcript: string } };
export type SpeechRecEvent = { results: ArrayLike<SpeechRecResult> };
export type SpeechRecError = { error?: string };

export type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: SpeechRecError) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export const VOICE_SILENCE_MS = 1500;

export function speechSupported() {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function makeRecognizer(): SpeechRec | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRec }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  return rec;
}

export function transcriptFrom(ev: SpeechRecEvent) {
  let finalText = "";
  let interim = "";
  for (let i = 0; i < ev.results.length; i++) {
    const row = ev.results[i];
    const t = row?.[0]?.transcript || "";
    if (row.isFinal) finalText += t;
    else interim += t;
  }
  return { finalText: finalText.trim(), heard: (finalText || interim).trim() };
}

export function errorMessageForSpeech(code: string) {
  if (code === "no-speech") return "I didn’t catch that — tap and try again.";
  if (code === "not-allowed") return "Allow the microphone, then tap again.";
  if (code === "audio-capture") return "No microphone found.";
  return "Mic didn’t work — type it below.";
}
