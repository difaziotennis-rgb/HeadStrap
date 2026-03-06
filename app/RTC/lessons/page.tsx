"use client";

import { useEffect, useMemo, useState } from "react";
import { rtcCoaches } from "../rtc-data";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
} from "../member-session";

const LESSON_SLOTS = [
  "Mon 8:00 AM",
  "Mon 4:00 PM",
  "Tue 7:00 AM",
  "Tue 5:00 PM",
  "Wed 9:00 AM",
  "Thu 6:00 PM",
  "Fri 10:00 AM",
  "Sat 9:00 AM",
];

const LESSON_STORAGE_KEY = "rtc_lesson_requests_v1";

type LessonRequest = {
  id: string;
  coachName: string;
  slot: string;
  duration: string;
  focus: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  isMember: boolean;
  memberNumber?: string;
  notes: string;
  createdAt: string;
};

export default function RTCLessonsPage() {
  const [coachName, setCoachName] = useState(rtcCoaches[0]?.name || "");
  const [selectedSlot, setSelectedSlot] = useState(LESSON_SLOTS[0]);
  const [duration, setDuration] = useState("60");
  const [playerFocus, setPlayerFocus] = useState("Matchplay");
  const [memberSession, setMemberSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [lastRequest, setLastRequest] = useState<LessonRequest | null>(null);
  const isMember = !!memberSession;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LESSON_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LessonRequest[];
      setRequests(parsed);
    } catch {
      // Ignore bad local data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function applySession() {
      setMemberSession(parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY)));
    }
    applySession();
    window.addEventListener(MEMBER_SESSION_EVENT, applySession);
    return () => window.removeEventListener(MEMBER_SESSION_EVENT, applySession);
  }, []);

  const selectedCoach = useMemo(
    () => rtcCoaches.find((coach) => coach.name === coachName) ?? rtcCoaches[0],
    [coachName]
  );

  const effectiveRate = useMemo(() => {
    const raw = Number((selectedCoach?.rate || "").replace(/[^\d.]/g, ""));
    if (!raw || Number.isNaN(raw)) return "TBD";
    if (!isMember) return `$${raw}`;
    return `$${Math.max(raw - 10, 0)}`;
  }, [isMember, selectedCoach]);

  function submitLessonRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isMember && (!name.trim() || !email.trim())) {
      setMsg("Please add your name and email to reserve your lesson request.");
      return;
    }
    const request: LessonRequest = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      coachName: selectedCoach?.name || coachName,
      slot: selectedSlot,
      duration,
      focus: playerFocus,
      clientName: isMember
        ? memberSession?.memberName || `Member #${memberSession?.memberNumber || "RTC"}`
        : name.trim(),
      clientEmail: isMember ? memberSession?.memberEmail || "" : email.trim(),
      clientPhone: phone.trim(),
      isMember,
      memberNumber: isMember ? memberSession?.memberNumber || "" : "",
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [request, ...requests].slice(0, 12);
    setRequests(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LESSON_STORAGE_KEY, JSON.stringify(next));
    }

    setLastRequest(request);
    setMsg(`Lesson booked with ${selectedCoach?.name} for ${selectedSlot}.`);
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Private Lessons</h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          Select a coach, pick a time, and reserve your lesson.
        </p>
        <div className="mt-3 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3 text-[12px] text-[#6b665e]">
          {requests.length} recent lesson request{requests.length === 1 ? "" : "s"} submitted through this page.
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Choose Your Coach</p>
              <div className="mt-3 grid gap-2">
                {rtcCoaches.map((coach) => {
                  const active = coach.name === coachName;
                  return (
                    <button
                      key={coach.name}
                      type="button"
                      onClick={() => setCoachName(coach.name)}
                      className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                        active
                          ? "border-[#1a1a1a] bg-white"
                          : "border-[#e2ddd3] bg-[#faf9f7] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{coach.role}</p>
                          <p className="mt-0.5 text-[16px] font-semibold">{coach.name}</p>
                        </div>
                        <p className="text-[12px] font-medium text-[#2d5016]">{coach.rate}</p>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#6b665e]">{coach.bio}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#ece8e2] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Preferred Time</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LESSON_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${
                      selectedSlot === slot
                        ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                        : "border-[#d9d5cf] hover:bg-[#faf9f7]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={submitLessonRequest} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Complete Booking Request</p>
            <div className="mt-3 grid gap-2">
              {!isMember && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                </>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                >
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
                <select
                  value={playerFocus}
                  onChange={(e) => setPlayerFocus(e.target.value)}
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                >
                  <option>Matchplay</option>
                  <option>Technique</option>
                  <option>Serve + Return</option>
                  <option>Junior Development</option>
                </select>
              </div>
              {isMember && (
                <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                  Booking as Member #{memberSession?.memberNumber}. Only optional notes are needed.
                </p>
              )}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything we should know before your lesson?"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              <p>
                <span className="text-[#7a756d]">Coach:</span> <strong>{selectedCoach?.name}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Requested time:</span> <strong>{selectedSlot}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Estimated rate:</span>{" "}
                <strong>{effectiveRate} / hour</strong>
              </p>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Reserve Lesson
            </button>

            <p className="mt-3 text-[11px] text-[#8a8477]">
              Payment options for non-Derek coaches are not yet configured and will be finalized during confirmation.
            </p>
            {msg && <p className="mt-2 text-[12px] text-[#2d5016]">{msg}</p>}
            {lastRequest && (
              <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                <p className="font-medium">Concierge Confirmation</p>
                <p className="text-[#6b665e]">
                  {lastRequest.coachName} · {lastRequest.slot} · {lastRequest.duration} min
                </p>
                <a
                  href="mailto:difaziotennis@gmail.com?subject=RTC%20Lesson%20Booking%20Update"
                  className="mt-2 inline-block rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                >
                  Modify Lesson Request
                </a>
              </div>
            )}
          </form>
        </div>

        {requests.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Upcoming Lesson Bookings</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {requests.slice(0, 6).map((request) => (
                <div key={request.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                  <p className="font-medium">{request.coachName}</p>
                  <p className="text-[#6b665e]">{request.slot} · {request.duration} min · {request.focus}</p>
                  <p className="text-[#8a8477]">{request.clientName}</p>
                  {request.memberNumber && <p className="text-[#8a8477]">Member #{request.memberNumber}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
