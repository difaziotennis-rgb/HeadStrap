"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rtcClinics, rtcSummerEvents } from "./rtc-data";
import { MEMBER_SESSION_EVENT } from "./member-session";

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

export default function OverviewEnhancements({ memberSignedIn }: { memberSignedIn: boolean }) {
  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([]);
  const [lessons, setLessons] = useState<LessonRequest[]>([]);
  const [clinics, setClinics] = useState<ClinicBooking[]>([]);
  const [events, setEvents] = useState<EventReservation[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function load() {
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

  const hasLiveData =
    courtBookings.length > 0 || lessons.length > 0 || clinics.length > 0 || events.length > 0;

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

  const todayWeekday = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long" }),
    []
  );
  const featuredClinic = useMemo(() => {
    return rtcClinics.find((clinic) => clinic.schedule.startsWith(todayWeekday));
  }, [todayWeekday]);

  const featuredExperience = useMemo(() => {
    if (nextEvent) {
      return {
        title: nextEvent.title,
        blurb: `Upcoming event spotlight: ${nextEvent.title}${
          typeof nextEventSpots === "number" ? ` with ${nextEventSpots} spots currently open.` : "."
        }`,
        href: `/RTC/events/${nextEvent.id}`,
        cta: "Open Event Details",
        image:
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=80",
      };
    }
    if (featuredClinic) {
      return {
        title: featuredClinic.name,
        blurb: `Today's clinic highlight: ${featuredClinic.schedule}. Join the session lineup and reserve your spot.`,
        href: "/RTC/clinics",
        cta: "Open Clinic Schedule",
        image:
          "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80",
      };
    }
    return {
      title: "Club Programming",
      blurb:
        "From clinics to social events, each week is built to keep play competitive, social, and easy to join.",
      href: "/RTC/clinics",
      cta: "View Programs",
      image:
        "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1400&q=80",
    };
  }, [featuredClinic, nextEvent, nextEventSpots]);

  const signedIn = memberSignedIn;

  return (
    <div className="mb-3 sm:mb-4">
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-6">
          {signedIn ? (
            <>
              <h3 className="text-[20px] font-semibold tracking-tight sm:text-[24px]">Welcome back, Derek</h3>
              <p className="mt-2 text-[12px] text-[#6b665e] sm:text-[13px]">
                Your account and booking tools are ready.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link href="/RTC/book" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Book Court
                </Link>
                <Link href="/RTC/member/portal" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Open Member Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Start Here</p>
              <h3 className="mt-1 text-[20px] font-semibold tracking-tight sm:text-[24px]">Plan Your Visit</h3>
              <p className="mt-2 text-[12px] text-[#6b665e] sm:text-[13px]">
                A calm, social tennis setting in the Hudson Valley for daily play, progress, and shared moments.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link href="/RTC/member" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Explore Membership
                </Link>
                <Link href="/RTC/book" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Book Court
                </Link>
                <Link href="/RTC/lessons" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Private Lessons
                </Link>
                <Link href="/RTC/clinics" className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-3 py-2 text-[12px] font-medium hover:bg-white">
                  Clinics
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <img
            src={featuredExperience.image}
            alt="Rhinebeck club programming highlight"
            className="h-32 w-full object-cover sm:h-36"
          />
          <div className="p-3.5 sm:p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Featured Experience</p>
            <p className="mt-1 text-[15px] font-semibold sm:text-[17px]">{featuredExperience.title}</p>
            <p className="mt-1 text-[12px] text-[#6b665e] sm:text-[13px]">{featuredExperience.blurb}</p>
            <Link
              href={featuredExperience.href}
              className="mt-2.5 inline-block rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-2.5 py-1.5 text-[11px] font-medium hover:bg-white sm:mt-3 sm:px-3 sm:text-[12px]"
            >
              {featuredExperience.cta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
