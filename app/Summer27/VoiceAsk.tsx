"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BOOKING_HOURS,
  COURTS,
  clinicTimeLabel,
  clinicsSuspendedOnDate,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  parseDateInput,
  type ClinicDef,
  type CourtId,
} from "./summer27-data";
import { getLiveClinics, getLiveEvents, getProgramBlock } from "./schedule";
import { KEYS, courtBookingKey, loadList, loadRecord, type S27ClinicBooking, type S27CourtBooking } from "./storage";
import { mergeIntent, parseVoiceFallback, type VoiceIntent } from "./voice-intent";

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

type ActionLink = { href: string; label: string };

type Result = {
  spoken: string;
  detail: string;
  links: ActionLink[];
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

function hoursFor(intent: VoiceIntent): number[] {
  if (typeof intent.hour === "number" && BOOKING_HOURS.includes(intent.hour)) return [intent.hour];
  if (intent.timeOfDay === "morning") return BOOKING_HOURS.filter((h) => h < 12);
  if (intent.timeOfDay === "afternoon") return BOOKING_HOURS.filter((h) => h >= 12 && h < 17);
  if (intent.timeOfDay === "evening") return BOOKING_HOURS.filter((h) => h >= 17);
  return BOOKING_HOURS;
}

function courtsFor(intent: VoiceIntent) {
  if (intent.courtId) return COURTS.filter((c) => c.id === intent.courtId);
  return [...COURTS];
}

function courtOpen(date: string, courtId: CourtId, hour: number, bookings: Record<string, S27CourtBooking>) {
  if (!BOOKING_HOURS.includes(hour)) return false;
  if (getProgramBlock(date, courtId, hour)) return false;
  const existing = bookings[courtBookingKey(date, courtId, hour)];
  return existing?.paymentStatus !== "paid";
}

function clinicHintMatch(clinic: ClinicDef, hint: string | null) {
  if (!hint) return true;
  const h = hint.toLowerCase();
  const blob = `${clinic.name} ${clinic.level} ${clinic.id} ${clinic.kind}`.toLowerCase();
  const keys = ["101", "cardio", "point play", "ladies", "juniors", "junior", "high performance", "weeknight", "beginner"];
  const hits = keys.filter((k) => h.includes(k));
  if (hits.length === 0) return true;
  return hits.some((k) => blob.includes(k));
}

function nextClinicDates(clinic: ClinicDef, from: Date, count = 2): string[] {
  const events = getLiveEvents();
  const out: string[] = [];
  for (let i = 0; i < 21 && out.length < count; i++) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(from.getDate() + i);
    if (!clinic.days.includes(d.getDay())) continue;
    const iso = formatDateInput(d);
    if (clinicsSuspendedOnDate(iso, events)) continue;
    out.push(iso);
  }
  return out;
}

function resolve(intent: VoiceIntent): Result {
  const now = new Date();
  const bookings = loadRecord<S27CourtBooking>(KEYS.courts);
  const clinicBookings = loadList<S27ClinicBooking>(KEYS.clinics);
  const clinics = getLiveClinics();

  if (intent.intent === "check_court" || intent.intent === "book_court") {
    const date = intent.date || formatDateInput(now);
    const hours = hoursFor(intent);
    const courts = courtsFor(intent);
    const open: { courtId: CourtId; name: string; hour: number }[] = [];
    for (const hour of hours) {
      for (const court of courts) {
        if (courtOpen(date, court.id, hour, bookings)) {
          open.push({ courtId: court.id, name: court.name, hour });
        }
      }
    }
    const pretty = formatPrettyDate(date);
    if (open.length === 0) {
      return {
        spoken: `Nothing open ${intent.hour != null ? `at ${formatHour(intent.hour)} ` : ""}on ${pretty}.`,
        detail: `No open court time ${intent.hour != null ? `at ${formatHour(intent.hour)} ` : ""}on ${pretty}. Clinics and lessons hold some hours.`,
        links: [{ href: `/Summer27/book?date=${date}`, label: "See the court grid" }],
      };
    }
    const first = open[0];
    const names = [...new Set(open.map((o) => `${o.name} ${formatHour(o.hour)}`))].slice(0, 6);
    const spoken =
      intent.intent === "book_court"
        ? `${first.name} is open at ${formatHour(first.hour)} on ${pretty}. I’ll take you there to confirm.`
        : `Open on ${pretty}: ${names.join(", ")}.`;
    return {
      spoken,
      detail: names.join(" · "),
      links: [
        {
          href: `/Summer27/book?date=${date}&hour=${first.hour}&court=${first.courtId}`,
          label: intent.intent === "book_court" ? `Book ${first.name} ${formatHour(first.hour)}` : `Open ${first.name}`,
        },
        { href: `/Summer27/book?date=${date}`, label: "Full court grid" },
      ],
    };
  }

  if (intent.intent === "check_clinic" || intent.intent === "book_clinic") {
    const date = intent.date;
    let list = clinics.filter((c) => clinicHintMatch(c, intent.clinicHint));
    if (intent.timeOfDay === "morning") list = list.filter((c) => c.startHour < 12);
    if (intent.timeOfDay === "afternoon") list = list.filter((c) => c.startHour >= 12 && c.startHour < 17);
    if (intent.timeOfDay === "evening") list = list.filter((c) => c.startHour >= 17);
    if (date) {
      const day = parseDateInput(date).getDay();
      list = list.filter((c) => c.days.includes(day));
    }
    if (list.length === 0) list = clinics.filter((c) => clinicHintMatch(c, intent.clinicHint));

    const rows: { clinic: ClinicDef; date: string; open: number }[] = [];
    for (const clinic of list) {
      const dates = date ? [date] : nextClinicDates(clinic, now, 1);
      for (const d of dates) {
        if (!clinic.days.includes(parseDateInput(d).getDay())) continue;
        const taken = clinicBookings.filter(
          (b) => b.clinicId === clinic.id && b.date === d && b.paymentStatus === "paid"
        ).length;
        rows.push({ clinic, date: d, open: Math.max(0, clinic.capacity - taken) });
      }
    }
    if (rows.length === 0) {
      return {
        spoken: "I couldn’t match that clinic. You can browse the week on the clinics page.",
        detail: "No matching clinic found.",
        links: [{ href: "/Summer27/clinics", label: "All clinics" }],
      };
    }
    const first = rows[0];
    const lines = rows
      .slice(0, 4)
      .map(
        (r) =>
          `${r.clinic.name} · ${formatPrettyDate(r.date)} ${clinicTimeLabel(r.clinic)} · ${r.open} open`
      );
    const spoken = `${first.clinic.name} on ${formatPrettyDate(first.date)} has ${first.open} ${
      first.open === 1 ? "spot" : "spots"
    } left.`;
    return {
      spoken,
      detail: lines.join("\n"),
      links: [
        {
          href: `/Summer27/clinics?clinic=${encodeURIComponent(first.clinic.id)}&date=${first.date}`,
          label: intent.intent === "book_clinic" ? "Join this clinic" : "View clinic",
        },
        { href: "/Summer27/clinics", label: "All clinics" },
      ],
    };
  }

  return {
    spoken: "Try asking about court time, or a clinic — for example, open courts at 4 tomorrow.",
    detail: "I can check court time, clinic openings, and take you to book.",
    links: [
      { href: "/Summer27/book", label: "Courts" },
      { href: "/Summer27/clinics", label: "Clinics" },
    ],
  };
}

export default function VoiceAsk() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "listen" | "think" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<Result | null>(null);
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
    const next = resolve(intent);
    setResult(next);
    setPhase("done");
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
                “Any courts at 4 tomorrow?” · “Openings for Saturday morning clinic?” · “Book a court at 9am.”
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
