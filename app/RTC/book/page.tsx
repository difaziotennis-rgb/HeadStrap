"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAYMENT_CONFIG } from "@/lib/payment-config";
import { rtcClinicCourtBlocks, rtcClinics, rtcSummerEvents } from "../rtc-data";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
} from "../member-session";

type Court = {
  id: string;
  name: string;
  type: "indoor" | "outdoor";
};

type Booking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2 | 3;
  courtId: string;
  courtName: string;
  type: "indoor" | "outdoor";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  isMember: boolean;
  memberNumber?: string;
  amount: number;
  totalAmount: number;
  discountApplied: number;
  paymentStatus?: "pending" | "paid";
  paymentMethod?: "stripe" | "venmo" | "paypal" | "manual";
  createdAt: string;
};

const STORAGE_KEY = "rtc_court_bookings_v1";
const PENDING_STRIPE_KEY = "rtc_pending_stripe_bookings_v1";
const CLINIC_STORAGE_KEY = "rtc_clinic_bookings_v1";
const MEMBER_PREFERENCES_KEY = "rtc_member_preferences_v1";
const ADMIN_COURT_BLOCKS_KEY = "rtc_admin_court_blocks_v1";
const EVENT_RESERVED_COURTS = ["indoor-1", "outdoor-1", "outdoor-2", "outdoor-3"];

type ClinicBooking = {
  clinicNames: string[];
  sessionWindow: string;
  reservedSlots?: Array<{
    date: string;
    courtId: "indoor-1";
    startHour: number;
    durationHours: number;
  }>;
  createdAt: string;
};

type AdminCourtBlock = {
  id: string;
  date: string;
  courtId: string;
  startHour: number;
  durationHours: 1 | 2 | 3;
  reason: string;
  createdAt: string;
};

type MemberPreferences = {
  favoriteCourt: string;
  preferredStartTime: string;
  preferredCoach: string;
  preferredSurface: "Indoor" | "Outdoor" | "No preference";
};

const courts: Court[] = [
  { id: "indoor-1", name: "Indoor Court", type: "indoor" },
  { id: "outdoor-1", name: "Court 1", type: "outdoor" },
  { id: "outdoor-2", name: "Court 2", type: "outdoor" },
  { id: "outdoor-3", name: "Court 3", type: "outdoor" },
  { id: "outdoor-4", name: "Court 4", type: "outdoor" },
  { id: "outdoor-5", name: "Court 5", type: "outdoor" },
];

const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM - 9 PM

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatPrettyDate(value: string): string {
  const date = parseDateInput(value);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatHour(hour: number): string {
  const totalMinutes = Math.round(hour * 60);
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${String(minutes).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}

function clinicDurationHours(clinicName: string, fallback: number): number {
  const clinic = rtcClinics.find((item) => item.name === clinicName);
  if (!clinic) return fallback;
  const match = clinic.schedule.match(/(\d+)\s*h(?:\s*(\d+)\s*min)?/i);
  if (!match) return fallback;
  const hrs = Number(match[1] || 0);
  const mins = Number(match[2] || 0);
  const parsed = hrs + mins / 60;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRate(type: "indoor" | "outdoor", isMember: boolean): number {
  if (type === "indoor") return isMember ? 62 : 74;
  return isMember ? 44 : 58;
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateAtHour(date: Date, hour: number): Date {
  const next = new Date(date);
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  next.setHours(wholeHours, minutes, 0, 0);
  return next;
}

function parseTimeLabel(value: string): number | null {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  const minute = Number(match[2] || "0");
  const period = match[3].toUpperCase();
  if (period === "PM") hour += 12;
  return hour + minute / 60;
}

function parseEventWindow(
  dateLabel: string,
  timeLabel: string,
  year: number
): { start: Date; end: Date } | null {
  const dateMatch = dateLabel.match(/^([A-Za-z]+)\s+(\d+)(?:-(\d+))?$/);
  if (!dateMatch) return null;
  const monthName = dateMatch[1];
  const startDay = Number(dateMatch[2]);
  const endDay = Number(dateMatch[3] || dateMatch[2]);
  const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
  if (!Number.isFinite(monthIndex)) return null;

  const [startSegmentRaw, endSegmentRaw] = timeLabel.split("-").map((s) => s.trim());
  if (!startSegmentRaw || !endSegmentRaw) return null;
  const startHour = parseTimeLabel(startSegmentRaw);
  const endHour = parseTimeLabel(endSegmentRaw);
  if (startHour === null || endHour === null) return null;

  const startDate = new Date(year, monthIndex, startDay);
  const endDate = new Date(year, monthIndex, endDay);
  const start = toDateAtHour(startDate, startHour);
  const end = toDateAtHour(endDate, endHour);
  if (end <= start) return null;
  return { start, end };
}

export default function RTCBookPage() {
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [clinicBookings, setClinicBookings] = useState<ClinicBooking[]>([]);
  const [adminBlocks, setAdminBlocks] = useState<AdminCourtBlock[]>([]);
  const [activeCourt, setActiveCourt] = useState<Court | null>(null);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [memberSession, setMemberSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isCreatingStripe, setIsCreatingStripe] = useState(false);
  const [lastBooked, setLastBooked] = useState<Booking | null>(null);
  const [bookingStep, setBookingStep] = useState<2 | 3>(2);
  const [preferences, setPreferences] = useState<MemberPreferences | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const calendarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, Booking>) : {};
      setBookings(parsed);
    } catch {
      // Ignore corrupted local storage data.
    }
    try {
      const raw = localStorage.getItem(CLINIC_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ClinicBooking[]) : [];
      setClinicBookings(parsed);
    } catch {
      // Ignore corrupted clinic storage data.
    }
    try {
      const raw = localStorage.getItem(ADMIN_COURT_BLOCKS_KEY);
      const parsed = raw ? (JSON.parse(raw) as AdminCourtBlock[]) : [];
      setAdminBlocks(parsed);
    } catch {
      // Ignore corrupted admin block storage data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function applySession() {
      setMemberSession(parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY)));
      try {
        const raw = localStorage.getItem(MEMBER_PREFERENCES_KEY);
        setPreferences(raw ? (JSON.parse(raw) as MemberPreferences) : null);
      } catch {
        setPreferences(null);
      }
    }
    applySession();
    window.addEventListener(MEMBER_SESSION_EVENT, applySession);
    return () => window.removeEventListener(MEMBER_SESSION_EVENT, applySession);
  }, []);

  const displayHours = useMemo(() => {
    const selectedDay = parseDateInput(selectedDate);
    const weekday = selectedDay.getDay();
    let halfHourShiftStart: number | null = null;
    for (const [clinicName, template] of Object.entries(rtcClinicCourtBlocks)) {
      if (template.weekday !== weekday) continue;
      const duration = clinicDurationHours(clinicName, template.durationHours);
      const end = template.startHour + duration;
      if (Math.abs((end % 1) - 0.5) < 0.001) {
        halfHourShiftStart = halfHourShiftStart === null ? end : Math.min(halfHourShiftStart, end);
      }
    }
    if (halfHourShiftStart === null) return hours;
    const before = hours.filter((hour) => hour < Math.floor(halfHourShiftStart));
    const shifted: number[] = [];
    const lastShiftedStart = hours[hours.length - 1] + 0.5;
    for (let hour = halfHourShiftStart; hour <= lastShiftedStart + 0.001; hour += 1) {
      shifted.push(Number(hour.toFixed(1)));
    }
    return [...before, ...shifted];
  }, [selectedDate]);

  const blockedSlots = useMemo(() => {
    const blocked: Record<string, string> = {};
    const selectedDay = parseDateInput(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    const dayStart = selectedDay.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const weekday = selectedDay.getDay();
    const markRangeBlocked = (courtId: string, startHour: number, durationHours: number, reason: string) => {
      const rangeStart = toDateAtHour(selectedDay, startHour).getTime();
      const rangeEnd = toDateAtHour(selectedDay, startHour + durationHours).getTime();
      for (const hour of displayHours) {
        const slotStart = toDateAtHour(selectedDay, hour).getTime();
        const slotEnd = toDateAtHour(selectedDay, hour + 1).getTime();
        if (slotStart < rangeEnd && slotEnd > rangeStart) {
          blocked[bookingKey(selectedDate, courtId, hour)] = reason;
        }
      }
    };

    // Always reserve indoor court for scheduled clinic program blocks.
    for (const [clinicName, template] of Object.entries(rtcClinicCourtBlocks)) {
      if (template.weekday !== weekday) continue;
      markRangeBlocked(
        "indoor-1",
        template.startHour,
        clinicDurationHours(clinicName, template.durationHours),
        `Reserved for ${clinicName}`
      );
    }

    for (const block of adminBlocks) {
      if (block.date !== selectedDate) continue;
      markRangeBlocked(block.courtId, block.startHour, block.durationHours, `Reserved: ${block.reason}`);
    }

    for (const booking of clinicBookings) {
      if (booking.reservedSlots?.length) {
        for (const slot of booking.reservedSlots) {
          if (slot.date !== selectedDate || slot.courtId !== "indoor-1") continue;
          markRangeBlocked("indoor-1", slot.startHour, slot.durationHours, "Reserved for clinic");
        }
        continue;
      }
      const bookingDate = new Date(booking.createdAt || Date.now());
      const baseWeek = startOfWeek(bookingDate);
      const weekOffset = booking.sessionWindow === "next_week" ? 7 : 0;
      for (const clinicName of booking.clinicNames || []) {
        const template = rtcClinicCourtBlocks[clinicName];
        if (!template) continue;
        const clinicDate = addDays(baseWeek, weekOffset + template.weekday);
        const clinicDateKey = formatDateInput(clinicDate);
        if (clinicDateKey !== selectedDate) continue;
        markRangeBlocked(
          "indoor-1",
          template.startHour,
          clinicDurationHours(clinicName, template.durationHours),
          "Reserved for clinic"
        );
      }
    }

    const year = selectedDay.getFullYear();
    for (const event of rtcSummerEvents) {
      const window = parseEventWindow(event.dateLabel, event.timeLabel, year);
      if (!window) continue;
      const startMs = window.start.getTime();
      const endMs = window.end.getTime();
      if (endMs <= dayStart || startMs >= dayEnd) continue;
      for (const courtId of EVENT_RESERVED_COURTS) {
        for (const hour of displayHours) {
          const slotStart = toDateAtHour(selectedDay, hour);
          const slotEnd = toDateAtHour(selectedDay, hour + 1);
          if (slotStart.getTime() < endMs && slotEnd.getTime() > startMs) {
            blocked[bookingKey(selectedDate, courtId, hour)] = `Reserved for ${event.title}`;
          }
        }
      }
    }

    return blocked;
  }, [adminBlocks, clinicBookings, displayHours, selectedDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const bookingId = params.get("bookingId");
    if (!payment) return;

    if (bookingId && payment === "success") {
      let pendingMap: Record<string, Booking> = {};
      try {
        const raw = localStorage.getItem(PENDING_STRIPE_KEY);
        pendingMap = raw ? (JSON.parse(raw) as Record<string, Booking>) : {};
      } catch {
        pendingMap = {};
      }
      const pending = pendingMap[bookingId];
      if (!pending) {
        setStatusMsg("Payment successful. Refresh to view your updated booking.");
      } else {
        const firstKey = bookingKey(pending.date, pending.courtId, pending.blockStartHour);
        const hasConflict = bookings[firstKey] || blockedSlots[firstKey];
        if (hasConflict) {
          setStatusMsg("Payment received, but that slot is no longer available. Please contact the club.");
        } else {
          const next = { ...bookings };
          next[firstKey] = {
            ...pending,
            hour: pending.blockStartHour,
            durationHours: 1,
            discountApplied: 0,
            totalAmount: pending.amount,
            paymentStatus: "paid",
            paymentMethod: "stripe",
          };
          persist(next);
          setLastBooked({ ...pending, paymentStatus: "paid", paymentMethod: "stripe" });
          setStatusMsg("Payment successful. Your court booking is confirmed.");
        }
        delete pendingMap[bookingId];
        localStorage.setItem(PENDING_STRIPE_KEY, JSON.stringify(pendingMap));
      }
    } else if (payment === "cancelled") {
      if (bookingId) {
        try {
          const raw = localStorage.getItem(PENDING_STRIPE_KEY);
          const pendingMap = raw ? (JSON.parse(raw) as Record<string, Booking>) : {};
          if (pendingMap[bookingId]) {
            delete pendingMap[bookingId];
            localStorage.setItem(PENDING_STRIPE_KEY, JSON.stringify(pendingMap));
          }
        } catch {
          // Ignore malformed pending checkout storage.
        }
      }
      setStatusMsg("Stripe checkout cancelled. No booking was created.");
    }

    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, blockedSlots]);

  useEffect(() => {
    if (!calendarOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (!calendarRef.current) return;
      if (!calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    const courtId = params.get("courtId");
    const startHour = Number(params.get("startHour"));
    const duration = Number(params.get("duration"));
    if (!courtId || !Number.isFinite(startHour)) return;

    const court = courts.find((item) => item.id === courtId);
    if (!court) return;

    const targetDate = dateParam || selectedDate;
    const slotKey = bookingKey(targetDate, court.id, startHour);
    if (bookings[slotKey] || blockedSlots[slotKey]) return;

    setSelectedDate(targetDate);
    setActiveCourt(court);
    setActiveHour(startHour);
    const hasMultiHourHint = duration > 1;
    setBookingStep(2);
    setStatusMsg(hasMultiHourHint ? "Court booking is currently 1 hour at a time." : null);
    window.history.replaceState({}, "", "/RTC/book");
  }, [blockedSlots, bookings, selectedDate]);

  function persist(next: Record<string, Booking>) {
    setBookings(next);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const activeAmount = useMemo(() => {
    if (!activeCourt) return 0;
    const hourlyRate = getRate(activeCourt.type, !!memberSession);
    return hourlyRate;
  }, [activeCourt, memberSession]);

  function openBooking(court: Court, hour: number) {
    setActiveCourt(court);
    setActiveHour(hour);
    setBookingStep(2);
    setStatusMsg(null);
  }

  function closeBooking() {
    setActiveCourt(null);
    setActiveHour(null);
    setStatusMsg(null);
    setBookingStep(2);
  }

  function buildBookingDraft(paymentMethod: Booking["paymentMethod"]) {
    if (!activeCourt || activeHour === null) return null;
    const isMember = !!memberSession;
    if (!isMember && (!form.name.trim() || !form.email.trim())) {
      setStatusMsg("Name and email are required.");
      return null;
    }
    const firstKey = bookingKey(selectedDate, activeCourt.id, activeHour);
    if (bookings[firstKey] || blockedSlots[firstKey]) {
      setStatusMsg("This slot is no longer available.");
      return null;
    }

    const id = `rtc-booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const hourlyRate = getRate(activeCourt.type, isMember);
    const discountApplied = 0;
    const totalAmount = hourlyRate;
    const createdAt = new Date().toISOString();

    const booking: Booking = {
      id,
      date: selectedDate,
      hour: activeHour,
      blockStartHour: activeHour,
      durationHours: 1,
      courtId: activeCourt.id,
      courtName: activeCourt.name,
      type: activeCourt.type,
      clientName: isMember
        ? memberSession?.memberName || `Member #${memberSession?.memberNumber || "RTC"}`
        : form.name.trim(),
      clientEmail: isMember ? memberSession?.memberEmail || "" : form.email.trim(),
      clientPhone: form.phone.trim(),
      isMember,
      memberNumber: isMember ? memberSession?.memberNumber || "" : "",
      amount: hourlyRate,
      totalAmount,
      discountApplied,
      paymentStatus: "pending",
      paymentMethod,
      createdAt,
    };
    return booking;
  }

  function proceedToPaymentStep() {
    if (!memberSession && (!form.name.trim() || !form.email.trim())) {
      setStatusMsg("Name and email are required.");
      return;
    }
    setStatusMsg(null);
    setBookingStep(3);
  }

  function buildVenmoUrl(booking: Booking): string {
    const note = `${booking.courtName} - ${booking.date} at ${formatHour(booking.hour)}`;
    return `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(
      PAYMENT_CONFIG.venmoHandle.replace(/^@/, "")
    )}&amount=${booking.totalAmount}&note=${encodeURIComponent(note)}`;
  }

  function buildPaypalUrl(booking: Booking): string {
    if (PAYMENT_CONFIG.paypalMeUsername) {
      return `https://www.paypal.me/${PAYMENT_CONFIG.paypalMeUsername}/${booking.totalAmount.toFixed(2)}`;
    }
    return `https://www.paypal.com/paypalme/${encodeURIComponent(
      PAYMENT_CONFIG.paypalEmail
    )}/${booking.totalAmount.toFixed(2)}`;
  }

  async function handleStripeCheckout() {
    if (!activeCourt || activeHour === null) return;
    const booking = buildBookingDraft("stripe");
    if (!booking) return;

    try {
      setIsCreatingStripe(true);
      let pendingMap: Record<string, Booking> = {};
      try {
        const raw = localStorage.getItem(PENDING_STRIPE_KEY);
        pendingMap = raw ? (JSON.parse(raw) as Record<string, Booking>) : {};
      } catch {
        pendingMap = {};
      }
      pendingMap[booking.id] = booking;
      localStorage.setItem(PENDING_STRIPE_KEY, JSON.stringify(pendingMap));
      const res = await fetch("/api/rtc/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: booking.totalAmount,
          clientEmail: booking.clientEmail,
          bookingId: booking.id,
          description: `${booking.courtName} court booking on ${booking.date} at ${formatHour(
            booking.hour
          )}`,
          metadata: {
            bookingId: booking.id,
            court: booking.courtName,
            date: booking.date,
            hour: String(booking.hour),
            member: booking.isMember ? "yes" : "no",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        delete pendingMap[booking.id];
        localStorage.setItem(PENDING_STRIPE_KEY, JSON.stringify(pendingMap));
        throw new Error(data?.error || "Stripe checkout failed.");
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setStatusMsg(err?.message || "Unable to open Stripe checkout.");
    } finally {
      setIsCreatingStripe(false);
    }
  }

  const monthLabel = useMemo(
    () => calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [calendarMonth]
  );

  const monthCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: formatDateInput(new Date(year, month, day)), day });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth]);

  function shiftCalendarMonth(offset: number) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-[#e8e5df] bg-gradient-to-b from-white to-[#fcfbf9] p-6 shadow-[0_18px_42px_rgba(26,26,26,0.06)] sm:p-8">
        <div className="mb-4 overflow-hidden rounded-2xl border border-[#ece8e2]">
          <img
            src="https://images.unsplash.com/photo-1600614282844-a885427b0c15?auto=format&fit=crop&w=1600&q=80"
            alt="Aerial tennis court surrounded by trees"
            className="h-32 w-full object-cover sm:h-40"
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#8a8477]">Rhinebeck Tennis Club</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[30px]">Court Booking</h2>
            <p className="mt-1 text-[14px] text-[#6b665e]">
              Full-day schedule for all courts. Tap any open cell to reserve and pay.
            </p>
          </div>
          <div className="relative flex w-full flex-wrap items-center gap-2 sm:w-auto" ref={calendarRef}>
            <label className="text-[11px] uppercase tracking-[0.12em] text-[#7a756d]">Date</label>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(parseDateInput(selectedDate).getFullYear(), parseDateInput(selectedDate).getMonth(), 1));
                setCalendarOpen((v) => !v);
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-left shadow-[0_4px_12px_rgba(26,26,26,0.04)] transition-all hover:border-[#cfc9c0] hover:shadow-[0_6px_14px_rgba(26,26,26,0.06)] sm:w-auto"
            >
              <span aria-hidden className="text-[13px] text-[#8a8477]">📅</span>
              <span className="text-[13px] font-medium text-[#1a1a1a] sm:min-w-[170px]">{formatPrettyDate(selectedDate)}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(formatDateInput(new Date()))}
              className="rounded-xl border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium text-[#6b665e] transition-colors hover:bg-[#faf9f7]"
            >
              Today
            </button>
            {calendarOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#e8e5df] bg-white p-3 shadow-[0_14px_34px_rgba(26,26,26,0.14)] sm:left-auto sm:right-0">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => shiftCalendarMonth(-1)}
                    className="rounded-md border border-[#e8e5df] px-2 py-1 text-[12px] text-[#6b665e] hover:bg-[#faf9f7]"
                  >
                    Prev
                  </button>
                  <p className="text-[12px] font-medium text-[#1a1a1a]">{monthLabel}</p>
                  <button
                    type="button"
                    onClick={() => shiftCalendarMonth(1)}
                    className="rounded-md border border-[#e8e5df] px-2 py-1 text-[12px] text-[#6b665e] hover:bg-[#faf9f7]"
                  >
                    Next
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="py-1 text-center text-[10px] uppercase tracking-[0.08em] text-[#8a8477]">
                      {day}
                    </div>
                  ))}
                  {monthCells.map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="h-8 rounded-md" />;
                    }
                    const isSelected = cell.date === selectedDate;
                    const isToday = cell.date === formatDateInput(new Date());
                    return (
                      <button
                        key={cell.date}
                        type="button"
                        onClick={() => {
                          setSelectedDate(cell.date);
                          setCalendarOpen(false);
                        }}
                        className={`h-8 rounded-md text-[12px] font-medium transition-colors ${
                          isSelected
                            ? "bg-[#1a1a1a] text-white"
                            : isToday
                              ? "border border-[#d9d5cf] text-[#1a1a1a]"
                              : "text-[#4a4a4a] hover:bg-[#f5f3ef]"
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Public Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$74/hr</strong> · Outdoor: <strong>$58/hr</strong></p>
          </div>
          <div className="rounded-2xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$62/hr</strong> · Outdoor: <strong>$44/hr</strong></p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#ece8e2] bg-[#f9f8f6] px-3 py-2 text-[11px] text-[#7a756d]">
          <p className="uppercase tracking-[0.1em]">Court Grid</p>
          <p>Tap any open slot to book instantly.</p>
        </div>

        <div className="mt-3 overflow-x-auto rounded-3xl border border-[#ece8e2] bg-white shadow-[0_12px_28px_rgba(26,26,26,0.05)]">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9f7]">
                <th className="sticky left-0 z-10 border-b border-r border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-left text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                  Time
                </th>
                {courts.map((court) => (
                  <th
                    key={court.id}
                    className="border-b border-[#ece8e2] px-3 py-2 text-left text-[11px] uppercase tracking-[0.12em] text-[#8a8477]"
                  >
                    {court.name}
                    <span className="ml-1 text-[10px] normal-case tracking-normal text-[#a39e95]">
                      ({court.type})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayHours.map((hour) => (
                <tr key={hour} className="transition-colors hover:bg-[#fcfbf9]">
                  <td className="sticky left-0 z-10 border-r border-t border-[#f0ede8] bg-white px-3 py-2 text-[12px] font-medium text-[#6b665e]">
                    {formatHour(hour)}
                  </td>
                  {courts.map((court) => {
                    const key = bookingKey(selectedDate, court.id, hour);
                    const existing = bookings[key];
                    const blockedReason = blockedSlots[key];
                    const isBlockStart =
                      !!existing && existing.blockStartHour === existing.hour;
                    const isSelectedCell =
                      activeCourt?.id === court.id && activeHour === hour;
                    return (
                      <td key={key} className="border-t border-[#f0ede8] p-1.5 align-top">
                        {existing ? (
                          <div className="rounded-xl border border-[#ead2d2] bg-gradient-to-b from-[#fffafa] to-[#fff5f5] px-2.5 py-2 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                            <p className="font-medium text-[#7f1d1d]">
                              {isBlockStart ? "Booked" : "Booked (cont.)"}
                            </p>
                            {isBlockStart ? (
                              <>
                                <p className="mt-0.5 truncate text-[#7a756d]">{existing.clientName}</p>
                                <p className="text-[#a39e95]">${existing.totalAmount}</p>
                                <p className="text-[#a39e95]">
                                  {existing.paymentStatus === "paid"
                                    ? "Paid"
                                    : "Payment pending"}
                                </p>
                              </>
                            ) : (
                              <p className="text-[#a39e95]">Part of multi-hour reservation</p>
                            )}
                          </div>
                        ) : blockedReason ? (
                          <div className="rounded-xl border border-[#ddd9d2] bg-[#f4f2ee] px-2.5 py-2 text-[11px]">
                            <p className="font-medium text-[#6b665e]">Reserved</p>
                            <p className="mt-0.5 line-clamp-2 text-[#8a8477]">{blockedReason}</p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBooking(court, hour)}
                            className={`w-full rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d7d2c9] ${
                              isSelectedCell
                                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white shadow-[0_6px_14px_rgba(26,26,26,0.2)]"
                                : "border-[#d9d5cf] bg-white text-[#1a1a1a] hover:-translate-y-[1px] hover:border-[#c7c1b8] hover:bg-[#faf9f7] hover:shadow-[0_6px_14px_rgba(26,26,26,0.08)] active:translate-y-0"
                            }`}
                            aria-label={`Book ${court.name} at ${formatHour(hour)}`}
                          >
                            {isSelectedCell ? "Selected" : "Book"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeCourt && activeHour !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#e8e5df] bg-white p-5 shadow-[0_28px_60px_rgba(15,15,15,0.35)] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve Court</p>
                <h3 className="mt-1 text-xl font-semibold">{activeCourt.name}</h3>
                <p className="mt-1 text-[13px] text-[#6b665e]">
                  {selectedDate} · {formatHour(activeHour)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBooking}
                className="rounded-md border border-[#d9d5cf] px-2 py-1 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">
                <div className={bookingStep >= 2 ? "font-semibold text-[#1a1a1a]" : ""}>1. Details</div>
                <div className={bookingStep >= 3 ? "font-semibold text-[#1a1a1a]" : ""}>2. Pay</div>
              </div>
              {memberSession && preferences && (
                <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                  Member defaults loaded: {preferences.favoriteCourt}, {preferences.preferredStartTime},{" "}
                  {preferences.preferredSurface}.
                </p>
              )}

              {bookingStep === 2 && (
                <div className="grid gap-2">
                  <p className="text-[11px] text-[#8a8477]">
                    One-hour booking. Enter details and continue to payment.
                  </p>
                  {!memberSession && (
                    <>
                      <input
                        placeholder="Full name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                      />
                      <input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                      />
                    </>
                  )}
                  <input
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                  {memberSession && (
                    <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                      Booking as Member #{memberSession.memberNumber}. Member details are prefilled.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={proceedToPaymentStep}
                    className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
                  >
                    Continue to Payment
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              Rate: <strong>${activeAmount}</strong> ({memberSession ? "member" : "public"})
            </div>

            {bookingStep === 3 && (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={isCreatingStripe}
                    className="rounded-xl bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#2c2c2c] disabled:opacity-60 sm:col-span-2"
                  >
                    {isCreatingStripe ? "Opening Stripe..." : "Pay with Card (Stripe)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const booking = buildBookingDraft("venmo");
                      if (!booking) return;
                      window.open(buildVenmoUrl(booking), "_blank");
                      setStatusMsg("Venmo opened in a new tab. Booking is created only after confirmed payment.");
                    }}
                    className="rounded-xl border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium transition-colors hover:bg-[#faf9f7]"
                  >
                    Pay with Venmo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const booking = buildBookingDraft("paypal");
                      if (!booking) return;
                      window.open(buildPaypalUrl(booking), "_blank");
                      setStatusMsg("PayPal opened in a new tab. Booking is created only after confirmed payment.");
                    }}
                    className="rounded-xl border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium transition-colors hover:bg-[#faf9f7]"
                  >
                    Pay with PayPal
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="rounded-lg border border-[#d9d5cf] px-3 py-1.5 text-[11px] font-medium hover:bg-[#faf9f7]"
                  >
                    Back
                  </button>
                  <p className="text-[11px] text-[#8a8477]">Payment is required to confirm a court booking.</p>
                </div>
              </>
            )}

            {statusMsg && <p className="mt-3 text-[12px] text-[#2d5016]">{statusMsg}</p>}
            {lastBooked && (
              <div className="mt-3 rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                <p className="font-medium">Concierge Confirmation</p>
                <p className="text-[#6b665e]">
                  {lastBooked.courtName} · {lastBooked.date} · {formatHour(lastBooked.blockStartHour)} · $
                  {lastBooked.totalAmount.toFixed(2)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${lastBooked.clientEmail}?subject=${encodeURIComponent(
                      `RTC Court Booking Confirmation - ${lastBooked.courtName}`
                    )}`}
                    className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                  >
                    Send Confirmation
                  </a>
                  <a
                    href={`mailto:difaziotennis@gmail.com?subject=${encodeURIComponent(
                      `RTC Court Booking Update - ${lastBooked.courtName}`
                    )}`}
                    className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                  >
                    Modify Booking
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
