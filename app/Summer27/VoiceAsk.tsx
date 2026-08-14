"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDateInput } from "./summer27-data";
import { useS27Session } from "./use-s27-session";
import { mergeIntent, parseVoiceFallback, type VoiceIntent } from "./voice-intent";
import { applyVoiceCancel, resolveVoice, type VoiceResult } from "./voice-resolve";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechSupported() {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

function makeRecognizer(): SpeechRec | null {
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRec }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.continuous = false;
  return rec;
}

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}

export default function VoiceAsk() {
  const session = useS27Session();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "listen" | "think" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const canTalk = speechSupported();

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  async function runTranscript(text: string) {
    const said = text.trim();
    if (!said) {
      setError("I didn’t catch that.");
      setPhase("idle");
      return;
    }
    setTranscript(said);
    setPhase("think");
    setError(null);
    const fallback = parseVoiceFallback(said);
    let intent: VoiceIntent = fallback;
    try {
      const now = new Date();
      const res = await fetch("/api/summer27/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: said,
          today: formatDateInput(now),
          weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
        }),
      });
      const data = (await res.json()) as { intent?: Partial<VoiceIntent> | null };
      if (data.intent) intent = mergeIntent(data.intent, fallback);
    } catch {
      intent = fallback;
    }
    const next = resolveVoice(intent, session);
    setResult(next);
    setPhase("done");
    speak(next.spoken);
  }

  function confirmCancel() {
    if (!result?.cancel) return;
    const next = applyVoiceCancel(result.cancel);
    setResult(next);
    speak(next.spoken);
  }

  function startListen() {
    setOpen(true);
    setResult(null);
    setError(null);
    setTranscript("");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    if (phase === "listen") {
      recRef.current?.stop();
      setPhase("idle");
      return;
    }
    const rec = makeRecognizer();
    if (!rec) {
      setPhase("idle");
      return;
    }
    recRef.current = rec;
    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript || "";
      rec.stop();
      void runTranscript(text);
    };
    rec.onerror = () => {
      setPhase("idle");
      setError("Mic didn’t work — type it below.");
    };
    rec.onend = () => {
      setPhase((p) => (p === "listen" ? "idle" : p));
    };
    try {
      rec.start();
      setPhase("listen");
    } catch {
      setPhase("idle");
      setError("Mic didn’t start — type it below.");
    }
  }

  function close() {
    recRef.current?.stop();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setOpen(false);
    setPhase("idle");
  }

  return (
    <>
      <button
        type="button"
        onClick={startListen}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-[12px] font-medium text-white hover:bg-white/20"
      >
        <span aria-hidden>🎙️</span>
        Ask
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1a1a1a]/35" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-4 py-3.5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Ask the club</p>
                <p className="mt-0.5 text-[16px] font-semibold tracking-tight">
                  {phase === "listen" ? "Listening…" : phase === "think" ? "Checking…" : "Say what you need"}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e8e5df] text-[16px] text-[#6b665e]"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <p className="text-[13px] leading-relaxed text-[#6b665e]">
                Courts, clinics, your day, cancel, lessons, stringing, events, play, prices — or “put Emma in Tuesday juniors.”
              </p>
              {canTalk && (
                <button
                  type="button"
                  onClick={startListen}
                  className={`w-full rounded-xl py-3 text-[13px] font-medium ${
                    phase === "listen" ? "bg-[#991b1b] text-white" : "bg-[#1a1a1a] text-white"
                  }`}
                >
                  {phase === "listen" ? "Listening — tap to stop" : "Tap to talk"}
                </button>
              )}
              {transcript && <p className="text-[13px] text-[#1a1a1a]">“{transcript}”</p>}
              {error && <p className="text-[13px] text-[#991b1b]">{error}</p>}
              {result && (
                <div className="rounded-xl bg-[#faf9f7] px-3 py-3">
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#1a1a1a]">{result.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.cancel && (
                      <button
                        type="button"
                        onClick={confirmCancel}
                        className="rounded-full bg-[#991b1b] px-3.5 py-2 text-[12px] font-medium text-white"
                      >
                        Confirm cancel
                      </button>
                    )}
                    {result.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={close}
                        className="rounded-full bg-[#1a1a1a] px-3.5 py-2 text-[12px] font-medium text-white"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runTranscript(typed);
                  setTyped("");
                }}
                className="flex gap-2"
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={canTalk ? "Or type it" : "Type what you need"}
                  className="min-w-0 flex-1 rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[14px]"
                />
                <button type="submit" className="rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[13px] font-medium">
                  Go
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
