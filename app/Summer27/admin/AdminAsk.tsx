"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyAdminDraft,
  parseAdminVoice,
  type AdminDraft,
  type AdminVoiceActions,
  type AdminVoiceData,
} from "../admin-voice";
import {
  errorMessageForSpeech,
  makeRecognizer,
  speechSupported,
  transcriptFrom,
  VOICE_SILENCE_MS,
  type SpeechRec,
} from "../voice-listen";

type Props = {
  data: AdminVoiceData;
  actions: AdminVoiceActions;
  ping: (message: string) => void;
};

export default function AdminAsk({ data, actions, ping }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "listen" | "think" | "confirm">("idle");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState<AdminDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const listeningRef = useRef(false);
  const heardRef = useRef("");
  const genRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canTalk = speechSupported();

  function clearSilence() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function killRec() {
    clearSilence();
    listeningRef.current = false;
    const rec = recRef.current;
    recRef.current = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try {
      rec.abort();
    } catch {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
    }
  }

  function finishListen() {
    clearSilence();
    const leftover = heardRef.current.trim();
    heardRef.current = "";
    listeningRef.current = false;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // already ending
      }
    }
    if (leftover) runTranscript(leftover);
    else setPhase((p) => (p === "listen" ? "idle" : p));
  }

  function armSilence() {
    clearSilence();
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      if (!listeningRef.current) return;
      finishListen();
    }, VOICE_SILENCE_MS);
  }

  useEffect(() => {
    return () => killRec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runTranscript(text: string) {
    const said = text.trim();
    if (!said) {
      setError("I didn’t catch that.");
      setPhase("idle");
      return;
    }
    setTranscript(said);
    setPhase("think");
    setError(null);
    setDraft(parseAdminVoice(said, data));
    setPhase("confirm");
  }

  async function confirm() {
    if (!draft || !draft.mutating) {
      if (draft?.kind === "open_member") {
        actions.openMember(draft.memberNumber);
        ping(`Opened ${draft.title.replace(/^Open /, "")}.`);
      }
      close();
      return;
    }
    setBusy(true);
    try {
      const message = await applyAdminDraft(draft, data, actions);
      if (message) ping(message);
      close();
    } catch {
      setError("Couldn’t apply that. Try again from the desk.");
      setBusy(false);
    }
  }

  function startListen() {
    setOpen(true);
    if (phase === "listen" || listeningRef.current) {
      const leftover = heardRef.current;
      genRef.current += 1;
      killRec();
      if (leftover) runTranscript(leftover);
      else setPhase("idle");
      return;
    }
    genRef.current += 1;
    setDraft(null);
    setError(null);
    setTranscript("");
    heardRef.current = "";
    killRec();

    const rec = makeRecognizer();
    if (!rec) {
      setPhase("idle");
      setError("This browser can’t use the mic — type it below.");
      return;
    }
    recRef.current = rec;
    listeningRef.current = true;
    rec.onresult = (ev) => {
      const { heard } = transcriptFrom(ev);
      if (!heard) return;
      heardRef.current = heard;
      setTranscript(heard);
      armSilence();
    };
    rec.onerror = (ev) => {
      const code = ev.error || "";
      if (code === "aborted") return;
      if (!listeningRef.current) return;
      if (code === "no-speech") {
        if (heardRef.current.trim()) return;
        listeningRef.current = false;
        setPhase("idle");
        setError(errorMessageForSpeech(code));
        return;
      }
      listeningRef.current = false;
      setPhase("idle");
      setError(errorMessageForSpeech(code));
    };
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
      if (!listeningRef.current) return;
      if (heardRef.current.trim() && silenceTimerRef.current) return;
      finishListen();
    };
    try {
      rec.start();
      setPhase("listen");
    } catch {
      listeningRef.current = false;
      recRef.current = null;
      setPhase("idle");
      setError("Mic didn’t start — type it below.");
    }
  }

  function close() {
    genRef.current += 1;
    killRec();
    setOpen(false);
    setPhase("idle");
    setBusy(false);
    setDraft(null);
    setTranscript("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={startListen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#faf9f7]"
      >
        <span aria-hidden>🎙️</span>
        Speak
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
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Director</p>
                <p className="mt-0.5 text-[16px] font-semibold tracking-tight">
                  {phase === "listen" ? "Listening…" : phase === "think" ? "Checking…" : "Speak, then confirm"}
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
                Rain out a day or just 4 to 6, who’s on a court, walk-up clinic or court, cancel, hold, racket ready,
                charge balls/grip, accept a lesson, mark paid, or a note on a member.
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
              {draft && (
                <div className="rounded-xl bg-[#faf9f7] px-3 py-3">
                  <p className="text-[14px] font-medium text-[#1a1a1a]">{draft.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#6b665e]">{draft.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.mutating ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void confirm()}
                          className="rounded-full bg-[#1a1a1a] px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                        >
                          {busy ? "Working…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={close}
                          className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[12px] font-medium text-[#6b665e]"
                        >
                          Don’t
                        </button>
                      </>
                    ) : (
                      <>
                        {draft.kind === "open_member" && (
                          <button
                            type="button"
                            onClick={() => void confirm()}
                            className="rounded-full bg-[#1a1a1a] px-3.5 py-2 text-[12px] font-medium text-white"
                          >
                            Open file
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={close}
                          className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[12px] font-medium text-[#6b665e]"
                        >
                          Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runTranscript(typed);
                  setTyped("");
                }}
                className="flex gap-2"
              >
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={canTalk ? "Or type it" : "Type what you need"}
                  className="min-w-0 flex-1 rounded-xl border border-[#e8e5df] px-3 py-2.5 text-[16px]"
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
