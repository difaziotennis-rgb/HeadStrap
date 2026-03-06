"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rtcSummerEvents } from "./rtc-data";
import { MEMBER_SESSION_EVENT, MEMBER_SESSION_KEY, parseMemberSession } from "./member-session";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2 | 3;
  courtId: string;
  courtName: string;
  memberNumber?: string;
  paymentStatus?: "pending" | "paid";
};

type LessonRequest = {
  id: string;
  memberNumber?: string;
  createdAt: string;
};

type ClinicBooking = {
  id?: string;
  clinicNames: string[];
  memberNumber?: string;
  createdAt: string;
};

type EventReservation = {
  id: string;
  eventTitle: string;
  guestCount: number;
  memberNumber?: string;
  createdAt: string;
};

type AtmosphereNote = {
  title: string;
  detail: string;
  image: string;
};

const atmosphereNotes: AtmosphereNote[] = [
  {
    title: "Morning calm before first serve",
    detail: "Quiet courts, mountain air, and a clean start to the day in Rhinebeck.",
    image:
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Golden-hour socials",
    detail: "Evening matches flow naturally into terrace conversations and family dinners.",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Weekend family rhythm",
    detail: "Juniors play, parents rally, and the club feels easy, warm, and connected.",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80",
  },
];

const MOCK_PULSE = {
  clinicSignups: 16,
  eventGuests: 34,
  paidCourts: 22,
};

const MOCK_MEMBER_ACTIVITY = {
  lessons: 2,
  clinics: 1,
  events: 1,
};

function toDate(date: string, hour: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hour, 0, 0, 0);
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function nextEventDate(eventDateLabel: string): Date | null {
  const match = eventDateLabel.match(/^([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const month = match[1];
  const day = Number(match[2]);
  const now = new Date();
  const thisYear = now.getFullYear();
  const candidate = new Date(`${month} ${day}, ${thisYear}`);
  if (Number.isNaN(candidate.getTime())) return null;
  if (candidate.getTime() >= now.getTime()) return candidate;
  const nextYear = new Date(`${month} ${day}, ${thisYear + 1}`);
  return Number.isNaN(nextYear.getTime()) ? null : nextYear;
}

function formatPretty(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function OverviewEnhancements() {
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([]);
  const [lessons, setLessons] = useState<LessonRequest[]>([]);
  const [clinics, setClinics] = useState<ClinicBooking[]>([]);
  const [events, setEvents] = useState<EventReservation[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function load() {
      const session = parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
      setMemberNumber(session?.memberNumber || null);

      const rawCourt = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
      const seen = new Set<string>();
      const uniqueCourtStarts = Object.values(rawCourt).filter((booking) => {
        if (booking.hour !== booking.blockStartHour) return false;
        if (seen.has(booking.id)) return false;
        seen.add(booking.id);
        return true;
      });
      setCourtBookings(uniqueCourtStarts);
      setLessons(safeParse<LessonRequest[]>(localStorage.getItem(LESSON_KEY), []));
      setClinics(safeParse<ClinicBooking[]>(localStorage.getItem(CLINIC_KEY), []));
      setEvents(safeParse<EventReservation[]>(localStorage.getItem(EVENT_KEY), []));
    }

    load();
    window.addEventListener(MEMBER_SESSION_EVENT, load);
    return () => window.removeEventListener(MEMBER_SESSION_EVENT, load);
  }, []);

  const memberCourts = useMemo(
    () => courtBookings.filter((booking) => booking.memberNumber === memberNumber),
    [courtBookings, memberNumber]
  );
  const memberLessons = useMemo(
    () => lessons.filter((item) => item.memberNumber === memberNumber),
    [lessons, memberNumber]
  );
  const memberClinics = useMemo(
    () => clinics.filter((item) => item.memberNumber === memberNumber),
    [clinics, memberNumber]
  );
  const memberEvents = useMemo(
    () => events.filter((item) => item.memberNumber === memberNumber),
    [events, memberNumber]
  );

  const nextCourt = useMemo(() => {
    const now = Date.now();
    return memberCourts
      .map((booking) => ({ booking, at: toDate(booking.date, booking.blockStartHour).getTime() }))
      .filter((item) => item.at > now)
      .sort((a, b) => a.at - b.at)[0]?.booking;
  }, [memberCourts]);

  const lastCourt = useMemo(() => {
    return [...memberCourts]
      .sort(
        (a, b) =>
          toDate(b.date, b.blockStartHour).getTime() - toDate(a.date, a.blockStartHour).getTime()
      )[0];
  }, [memberCourts]);

  const socialPulse = useMemo(() => {
    const clinicSignups = clinics.length;
    const eventGuests = events.reduce((sum, event) => sum + Math.max(1, event.guestCount || 0), 0);
    const paidCourts = courtBookings.filter((booking) => booking.paymentStatus === "paid").length;
    return { clinicSignups, eventGuests, paidCourts };
  }, [clinics, events, courtBookings]);
  const hasLiveData =
    courtBookings.length > 0 || lessons.length > 0 || clinics.length > 0 || events.length > 0;
  const displayPulse = hasLiveData ? socialPulse : MOCK_PULSE;

  const nextEvent = useMemo(() => {
    return rtcSummerEvents
      .map((event) => ({ event, at: nextEventDate(event.dateLabel)?.getTime() || Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.at - b.at)[0]?.event;
  }, []);

  const nextEventSpots = useMemo(() => {
    if (!nextEvent) return null;
    const reserved = events
      .filter((event) => event.eventTitle === nextEvent.title)
      .reduce((sum, event) => sum + Math.max(1, event.guestCount || 0), 0);
    return Math.max(nextEvent.capacity - reserved, 0);
  }, [events, nextEvent]);

  const displayActivity = {
    lessons: memberLessons.length || (!hasLiveData && memberNumber ? MOCK_MEMBER_ACTIVITY.lessons : 0),
    clinics: memberClinics.length || (!hasLiveData && memberNumber ? MOCK_MEMBER_ACTIVITY.clinics : 0),
    events: memberEvents.length || (!hasLiveData && memberNumber ? MOCK_MEMBER_ACTIVITY.events : 0),
  };

  const atmosphereCard = atmosphereNotes[new Date().getDay() % atmosphereNotes.length];
  const rebookHref =
    lastCourt
      ? `/RTC/book?date=${encodeURIComponent(lastCourt.date)}&courtId=${encodeURIComponent(
          lastCourt.courtId
        )}&startHour=${lastCourt.blockStartHour}&duration=${lastCourt.durationHours}`
      : "/RTC/book";

  return (
    <div className="mb-4 space-y-4">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Club Pulse</p>
          <p className="text-[11px] text-[#8a8477]">Live activity across the club</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
            <span className="font-semibold text-[#1a1a1a]">{displayPulse.clinicSignups}</span> clinic signups
            in the booking flow
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
            <span className="font-semibold text-[#1a1a1a]">{displayPulse.eventGuests}</span> guest RSVP seats
            reserved
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
            <span className="font-semibold text-[#1a1a1a]">{displayPulse.paidCourts}</span> paid court
            reservations recorded
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Today at RTC</p>
          <h3 className="mt-1 text-[24px] font-semibold tracking-tight">
            {memberNumber ? "Welcome back, member." : "A smoother daily club flow."}
          </h3>
          <p className="mt-2 text-[13px] text-[#6b665e]">
            {memberNumber
              ? `Signed in as Member #${memberNumber}. Your bookings and account details are ready.`
              : "Members get one-tap booking and account access. New visitors can still browse and book easily."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Next Up</p>
              {nextCourt ? (
                <p className="mt-1 text-[13px] text-[#4a4a4a]">
                  {nextCourt.courtName} on {formatPretty(toDate(nextCourt.date, nextCourt.blockStartHour))} at{" "}
                  {toDate(nextCourt.date, nextCourt.blockStartHour).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-[#6b665e]">
                  {memberNumber
                    ? "No upcoming court on file yet. Your next booking appears here."
                    : "No upcoming court on file yet."}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Your Activity</p>
              <p className="mt-1 text-[13px] text-[#4a4a4a]">
                {displayActivity.lessons} lessons, {displayActivity.clinics} clinics,{" "}
                {displayActivity.events} event RSVPs
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={rebookHref}
              className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white"
            >
              Rebook Last Court Slot
            </Link>
            <Link
              href="/RTC/member"
              className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white"
            >
              Open Account Center
            </Link>
            <a
              href="mailto:difaziotennis@gmail.com?subject=RTC%20Booking%20Support"
              className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white"
            >
              Concierge Support
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <img
            src={atmosphereCard.image}
            alt="Hudson Valley club atmosphere"
            className="h-36 w-full object-cover"
          />
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Hudson Valley Atmosphere</p>
            <p className="mt-1 text-[17px] font-semibold">{atmosphereCard.title}</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">{atmosphereCard.detail}</p>
            {nextEvent && (
              <p className="mt-3 text-[12px] text-[#6b665e]">
                Next event: <span className="font-medium text-[#1a1a1a]">{nextEvent.title}</span>
                {typeof nextEventSpots === "number" ? ` · ${nextEventSpots} spots left` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
