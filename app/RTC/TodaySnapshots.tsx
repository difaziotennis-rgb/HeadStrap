"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rtcClinics } from "./rtc-data";
import { MEMBER_SESSION_EVENT, MEMBER_SESSION_KEY, parseMemberSession } from "./member-session";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";

type CourtBooking = {
  id: string;
  date: string;
  blockStartHour: number;
  memberNumber?: string;
};

type MemberCounts = {
  courts: number;
  lessons: number;
  clinics: number;
  events: number;
  nextCourtLabel: string | null;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatHour(hour: number): string {
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function bookingDateTime(date: string, hour: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hour, 0, 0, 0);
}

export default function TodaySnapshots({ todayDateParam }: { todayDateParam: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [counts, setCounts] = useState<MemberCounts>({
    courts: 0,
    lessons: 0,
    clinics: 0,
    events: 0,
    nextCourtLabel: null,
  });

  const todayProgramRows = useMemo(() => {
    const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return rtcClinics
      .filter((clinic) => clinic.schedule.startsWith(weekday))
      .map((clinic) => {
        const parts = clinic.schedule.split("·").map((part) => part.trim());
        return {
          name: clinic.name,
          time: parts[1] || "Time TBA",
          duration: parts[2] || "",
        };
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function load() {
      const session = parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
      const memberNumber = session?.memberNumber || "";
      setSignedIn(!!memberNumber);
      if (!memberNumber) {
        setCounts({
          courts: 0,
          lessons: 0,
          clinics: 0,
          events: 0,
          nextCourtLabel: null,
        });
        return;
      }

      const courtMap = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
      const lessons = safeParse<Array<{ memberNumber?: string }>>(localStorage.getItem(LESSON_KEY), []);
      const clinics = safeParse<Array<{ memberNumber?: string }>>(localStorage.getItem(CLINIC_KEY), []);
      const events = safeParse<Array<{ memberNumber?: string }>>(localStorage.getItem(EVENT_KEY), []);
      const uniqueCourts = Object.values(courtMap).filter((booking) => booking.memberNumber === memberNumber);
      const upcoming = uniqueCourts
        .map((booking) => ({
          id: booking.id,
          at: bookingDateTime(booking.date, booking.blockStartHour).getTime(),
          date: booking.date,
          hour: booking.blockStartHour,
        }))
        .filter((booking) => booking.at >= Date.now())
        .sort((a, b) => a.at - b.at);
      const nextCourt = upcoming[0];
      const nextCourtLabel = nextCourt ? `${nextCourt.date} at ${formatHour(nextCourt.hour)}` : null;

      setCounts({
        courts: uniqueCourts.length,
        lessons: lessons.filter((item) => item.memberNumber === memberNumber).length,
        clinics: clinics.filter((item) => item.memberNumber === memberNumber).length,
        events: events.filter((item) => item.memberNumber === memberNumber).length,
        nextCourtLabel,
      });
    }
    load();
    window.addEventListener(MEMBER_SESSION_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MEMBER_SESSION_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Today at RTC</p>
        <p className="mt-1 text-[16px] font-semibold">Daily Snapshot</p>
        <p className="mt-1 text-[13px] text-[#6b665e]">Courts open 7:00 AM-9:00 PM. Indoor + 5 outdoor courts live.</p>
        <Link href={`/RTC/book?date=${todayDateParam}`} className="mt-3 inline-block rounded-lg border border-[#dfdbd4] bg-[#faf9f7] px-3 py-1.5 text-[12px] font-medium hover:bg-white">
          Open Court Sheet
        </Link>
      </div>

      <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Today&apos;s Programs</p>
        <p className="mt-1 text-[16px] font-semibold">
          {todayProgramRows.length > 0 ? `${todayProgramRows.length} session${todayProgramRows.length > 1 ? "s" : ""} scheduled` : "No clinics scheduled today"}
        </p>
        {todayProgramRows.length > 0 ? (
          <div className="mt-1 space-y-1 text-[12px] text-[#6b665e]">
            {todayProgramRows.slice(0, 2).map((row) => (
              <p key={row.name}>
                {row.name}: {row.time}
                {row.duration ? ` (${row.duration})` : ""}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[13px] text-[#6b665e]">Check lessons and events for other ways to play today.</p>
        )}
        <Link href="/RTC/clinics" className="mt-3 inline-block rounded-lg border border-[#dfdbd4] bg-[#faf9f7] px-3 py-1.5 text-[12px] font-medium hover:bg-white">
          View Programs
        </Link>
      </div>

      <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">My Day</p>
        {signedIn ? (
          <>
            <p className="mt-1 text-[16px] font-semibold">
              {counts.courts + counts.lessons + counts.clinics + counts.events} active item
              {counts.courts + counts.lessons + counts.clinics + counts.events === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              Next court: {counts.nextCourtLabel || "No upcoming court yet"}.
            </p>
            <p className="mt-1 text-[12px] text-[#8a8477]">
              Lessons {counts.lessons} · Clinics {counts.clinics} · Events {counts.events}
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-[16px] font-semibold">Personal Snapshot Locked</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              Sign in to the Portal to see your upcoming schedule, bookings, and daily activity details.
            </p>
          </>
        )}
        <Link href="/RTC/member/portal" className="mt-3 inline-block rounded-lg border border-[#dfdbd4] bg-[#faf9f7] px-3 py-1.5 text-[12px] font-medium hover:bg-white">
          Open Portal
        </Link>
      </div>
    </div>
  );
}
