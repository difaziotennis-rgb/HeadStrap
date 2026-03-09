"use client";

import { useEffect, useState } from "react";
import {
  isValidMemberNumber,
  MEMBER_MODE_KEY,
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
  type MemberSession,
} from "./member-session";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const PAYMENT_KEY = "rtc_member_payment_profile_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function dateKeyFromOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

function seedMemberMockData(session: MemberSession) {
  if (typeof window === "undefined") return;
  const memberNumber = session.memberNumber;
  if (!memberNumber) return;

  const existingCourts = safeParse<Record<string, any>>(localStorage.getItem(COURT_KEY), {});
  const existingLessons = safeParse<any[]>(localStorage.getItem(LESSON_KEY), []);
  const existingClinics = safeParse<any[]>(localStorage.getItem(CLINIC_KEY), []);
  const existingEvents = safeParse<any[]>(localStorage.getItem(EVENT_KEY), []);

  const hasMemberData =
    Object.values(existingCourts).some((item: any) => item?.memberNumber === memberNumber) ||
    existingLessons.some((item) => item?.memberNumber === memberNumber) ||
    existingClinics.some((item) => item?.memberNumber === memberNumber) ||
    existingEvents.some((item) => item?.memberNumber === memberNumber);

  if (hasMemberData) return;

  const name = session.memberName || `Member #${memberNumber}`;
  const email = session.memberEmail || "member@rtc.local";
  const nowIso = new Date().toISOString();

  const nextDay = dateKeyFromOffset(1);
  const threeDays = dateKeyFromOffset(3);
  const sevenDays = dateKeyFromOffset(7);
  const pastDay = dateKeyFromOffset(-2);

  const demoBookings: Record<string, any> = {
    [bookingKey(nextDay, "indoor-1", 18)]: {
      id: `demo-court-${memberNumber}-1`,
      date: nextDay,
      hour: 18,
      blockStartHour: 18,
      durationHours: 1,
      courtId: "indoor-1",
      courtName: "Indoor Court",
      type: "indoor",
      clientName: name,
      clientEmail: email,
      clientPhone: "",
      isMember: true,
      memberNumber,
      amount: 62,
      totalAmount: 62,
      discountApplied: 0,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: nowIso,
    },
    [bookingKey(threeDays, "outdoor-2", 9)]: {
      id: `demo-court-${memberNumber}-2`,
      date: threeDays,
      hour: 9,
      blockStartHour: 9,
      durationHours: 1,
      courtId: "outdoor-2",
      courtName: "Court 2",
      type: "outdoor",
      clientName: name,
      clientEmail: email,
      clientPhone: "",
      isMember: true,
      memberNumber,
      amount: 44,
      totalAmount: 44,
      discountApplied: 0,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: nowIso,
    },
    [bookingKey(pastDay, "outdoor-1", 10)]: {
      id: `demo-court-${memberNumber}-3`,
      date: pastDay,
      hour: 10,
      blockStartHour: 10,
      durationHours: 1,
      courtId: "outdoor-1",
      courtName: "Court 1",
      type: "outdoor",
      clientName: name,
      clientEmail: email,
      clientPhone: "",
      isMember: true,
      memberNumber,
      amount: 44,
      totalAmount: 44,
      discountApplied: 0,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: nowIso,
    },
  };

  const demoLessons = [
    {
      id: `demo-lesson-${memberNumber}-1`,
      coachName: "Derek DiFazio",
      slot: "Thu 6:00 PM",
      duration: "60",
      clientName: name,
      clientEmail: email,
      clientPhone: "",
      isMember: true,
      memberNumber,
      notes: "",
      createdAt: nowIso,
    },
    {
      id: `demo-lesson-${memberNumber}-2`,
      coachName: "Jay Behrke",
      slot: "Sat 9:00 AM",
      duration: "60",
      clientName: name,
      clientEmail: email,
      clientPhone: "",
      isMember: true,
      memberNumber,
      notes: "",
      createdAt: nowIso,
    },
  ];

  const demoClinics = [
    {
      id: `demo-clinic-${memberNumber}-1`,
      clinicNames: ["Wednesday Nights with Jay"],
      sessionWindow: "this_week",
      total: 75,
      clientName: name,
      memberNumber,
      createdAt: nowIso,
    },
  ];

  const demoEvents = [
    {
      id: `demo-event-${memberNumber}-1`,
      eventTitle: "Summer White Party",
      eventDateLabel: "July 27",
      guestCount: 2,
      total: 130,
      attendeeName: name,
      memberNumber,
      createdAt: nowIso,
    },
    {
      id: `demo-event-${memberNumber}-2`,
      eventTitle: "1st Inaugural 'Valley Rally' Match",
      eventDateLabel: "August 1",
      guestCount: 1,
      total: 120,
      attendeeName: name,
      memberNumber,
      createdAt: nowIso,
    },
  ];

  localStorage.setItem(COURT_KEY, JSON.stringify({ ...existingCourts, ...demoBookings }));
  localStorage.setItem(LESSON_KEY, JSON.stringify([...demoLessons, ...existingLessons]));
  localStorage.setItem(CLINIC_KEY, JSON.stringify([...demoClinics, ...existingClinics]));
  localStorage.setItem(EVENT_KEY, JSON.stringify([...demoEvents, ...existingEvents]));
  localStorage.setItem(
    PAYMENT_KEY,
    JSON.stringify({
      brand: "Visa",
      last4: "4242",
      expMonth: "08",
      expYear: "28",
      billingZip: "12572",
      autopay: true,
    })
  );
}

export default function MemberAuth() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [open, setOpen] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
    setSession(next);
  }, []);

  function emitSessionChange() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(MEMBER_SESSION_EVENT));
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmedNumber = memberNumber.trim();
    const trimmedEmail = memberEmail.trim();
    const quickTestSignIn = !trimmedNumber && !trimmedEmail;

    if (!quickTestSignIn && !isValidMemberNumber(trimmedNumber)) {
      setMsg("Please enter a valid 3-digit member number.");
      return;
    }
    const next: MemberSession = {
      memberNumber: quickTestSignIn ? "000" : trimmedNumber,
      memberEmail: quickTestSignIn ? "" : trimmedEmail,
      memberName: quickTestSignIn ? "Derek DiFazio" : "",
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(next));
    localStorage.setItem(MEMBER_MODE_KEY, "true");
    seedMemberMockData(next);
    setSession(next);
    setMsg(null);
    setOpen(false);
    emitSessionChange();
  }

  function handleSignOut() {
    localStorage.removeItem(MEMBER_SESSION_KEY);
    localStorage.setItem(MEMBER_MODE_KEY, "false");
    setSession(null);
    setMemberNumber("");
    setMemberEmail("");
    setMsg(null);
    setOpen(false);
    emitSessionChange();
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-md border border-[#dbead3] bg-[#f4faf1] px-2.5 py-1 text-[11px] font-medium text-[#2d5016] sm:inline">
          {session.memberName ? `${session.memberName} · ` : ""}Member #{session.memberNumber}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-[#d9d5cf] px-2.5 py-1.5 text-[11px] font-medium hover:bg-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setMsg(null);
        }}
        className="rounded-md border border-[#d9d5cf] px-2.5 py-1.5 text-[11px] font-medium hover:bg-white"
      >
        Sign In
      </button>
      {open && (
        <form
          onSubmit={handleSignIn}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#e8e5df] bg-white p-3 shadow-[0_16px_34px_rgba(26,26,26,0.16)]"
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Access</p>
          <div className="mt-2 grid gap-2">
            <input
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Member number (3 digits)"
              inputMode="numeric"
              maxLength={3}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
            />
            <input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Email (optional)"
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Stay Signed In
            </button>
            <p className="text-[10px] text-[#8a8477]">
              Leave both fields blank for test sign-in as Derek DiFazio (Member #000).
            </p>
            {msg && <p className="text-[11px] text-[#7f1d1d]">{msg}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
