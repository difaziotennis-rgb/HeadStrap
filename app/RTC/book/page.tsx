"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAYMENT_CONFIG } from "@/lib/payment-config";
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
  durationHours: 1 | 2;
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
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function getRate(type: "indoor" | "outdoor", isMember: boolean): number {
  if (type === "indoor") return isMember ? 62 : 74;
  return isMember ? 44 : 58;
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

export default function RTCBookPage() {
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [activeCourt, setActiveCourt] = useState<Court | null>(null);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<1 | 2>(1);
  const [memberSession, setMemberSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isCreatingStripe, setIsCreatingStripe] = useState(false);
  const [lastBooked, setLastBooked] = useState<Booking | null>(null);
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
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Booking>;
      setBookings(parsed);
    } catch {
      // Ignore corrupted local storage data.
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const bookingId = params.get("bookingId");
    if (!payment) return;

    if (bookingId && payment === "success") {
      const next = { ...bookings };
      let updated = false;
      for (const key of Object.keys(next)) {
        if (next[key].id === bookingId) {
          next[key] = {
            ...next[key],
            paymentStatus: "paid",
            paymentMethod: "stripe",
          };
          updated = true;
          break;
        }
      }
      if (updated) {
        persist(next);
      }
      setStatusMsg("Payment successful. Your court booking is confirmed.");
    } else if (payment === "cancelled") {
      setStatusMsg("Stripe checkout cancelled. Your reservation remains pending.");
    }

    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

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

  function persist(next: Record<string, Booking>) {
    setBookings(next);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const activeAmount = useMemo(() => {
    if (!activeCourt) return 0;
    const hourlyRate = getRate(activeCourt.type, !!memberSession);
    const discount = durationHours === 2 ? Math.round(hourlyRate * 0.1 * 100) / 100 : 0;
    return hourlyRate * durationHours - discount;
  }, [activeCourt, memberSession, durationHours]);

  function openBooking(court: Court, hour: number) {
    setActiveCourt(court);
    setActiveHour(hour);
    setDurationHours(1);
    setStatusMsg(null);
  }

  function closeBooking() {
    setActiveCourt(null);
    setActiveHour(null);
    setStatusMsg(null);
  }

  function saveBooking(paymentMethod: Booking["paymentMethod"] = "manual") {
    if (!activeCourt || activeHour === null) return null;
    const isMember = !!memberSession;
    if (!isMember && (!form.name.trim() || !form.email.trim())) {
      setStatusMsg("Name and email are required.");
      return null;
    }
    if (durationHours === 2 && activeHour + 1 > hours[hours.length - 1]) {
      setStatusMsg("Two-hour bookings must start at least one hour earlier.");
      return null;
    }
    if (durationHours === 2) {
      const secondKey = bookingKey(selectedDate, activeCourt.id, activeHour + 1);
      if (bookings[secondKey]) {
        setStatusMsg("The next consecutive hour is not available.");
        return null;
      }
    }

    const firstKey = bookingKey(selectedDate, activeCourt.id, activeHour);
    if (bookings[firstKey]) {
      setStatusMsg("This slot is no longer available.");
      return null;
    }

    const id = `rtc-booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const hourlyRate = getRate(activeCourt.type, isMember);
    const discountApplied =
      durationHours === 2 ? Math.round(hourlyRate * 0.1 * 100) / 100 : 0;
    const totalAmount = hourlyRate * durationHours - discountApplied;
    const createdAt = new Date().toISOString();

    const next = { ...bookings };
    for (let i = 0; i < durationHours; i += 1) {
      const slotHour = activeHour + i;
      const booking: Booking = {
        id,
        date: selectedDate,
        hour: slotHour,
        blockStartHour: activeHour,
        durationHours,
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
      const key = bookingKey(booking.date, booking.courtId, booking.hour);
      next[key] = booking;
    }
    persist(next);
    return next[firstKey];
  }

  async function handleReserveOnly() {
    const booking = saveBooking();
    if (!booking) return;
    setLastBooked(booking);
    setStatusMsg("Court reserved. You can complete payment now.");
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
    const booking = saveBooking();
    if (!booking) return;
    setLastBooked(booking);

    try {
      setIsCreatingStripe(true);
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
        throw new Error(data?.error || "Stripe checkout failed.");
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setStatusMsg(err?.message || "Unable to open Stripe checkout.");
    } finally {
      setIsCreatingStripe(false);
    }
  }

  const todaysOpenSlots = useMemo(() => {
    let open = 0;
    for (const court of courts) {
      for (const hour of hours) {
        const key = bookingKey(selectedDate, court.id, hour);
        if (!bookings[key]) open += 1;
      }
    }
    return open;
  }, [bookings, selectedDate]);

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
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Court Booking</h2>
            <p className="mt-1 text-[14px] text-[#6b665e]">
              Full-day schedule for all courts. Tap any open cell to reserve and pay.
            </p>
          </div>
          <div className="relative flex w-full flex-wrap items-center gap-2 sm:w-auto" ref={calendarRef}>
            <label className="text-[12px] font-medium text-[#6b665e]">Date</label>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date(parseDateInput(selectedDate).getFullYear(), parseDateInput(selectedDate).getMonth(), 1));
                setCalendarOpen((v) => !v);
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-left shadow-[0_4px_12px_rgba(26,26,26,0.04)] transition-colors hover:border-[#d9d5cf] sm:w-auto"
            >
              <span aria-hidden className="text-[13px] text-[#8a8477]">📅</span>
              <span className="text-[13px] font-medium text-[#1a1a1a] sm:min-w-[170px]">{formatPrettyDate(selectedDate)}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(formatDateInput(new Date()))}
              className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium text-[#6b665e] hover:bg-[#faf9f7]"
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
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Public Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$74/hr</strong> · Outdoor: <strong>$58/hr</strong></p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$62/hr</strong> · Outdoor: <strong>$44/hr</strong></p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Live Availability</p>
          <p className="mt-1 text-[13px] text-[#6b665e]">
            {todaysOpenSlots} open slots remaining today across all courts.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-[#ece8e2]">
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
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="sticky left-0 z-10 border-r border-t border-[#f0ede8] bg-white px-3 py-2 text-[12px] font-medium text-[#6b665e]">
                    {formatHour(hour)}
                  </td>
                  {courts.map((court) => {
                    const key = bookingKey(selectedDate, court.id, hour);
                    const existing = bookings[key];
                  const isBlockStart =
                    !!existing && existing.blockStartHour === existing.hour;
                    return (
                      <td key={key} className="border-t border-[#f0ede8] p-1.5 align-top">
                        {existing ? (
                          <div className="rounded-lg border border-[#f0d9d9] bg-[#fff6f6] px-2 py-2 text-[11px]">
                            <p className="font-medium text-[#7f1d1d]">
                              {isBlockStart ? "Booked" : "Booked (cont.)"}
                            </p>
                            {isBlockStart ? (
                              <>
                                <p className="mt-0.5 truncate text-[#7a756d]">{existing.clientName}</p>
                                <p className="text-[#a39e95]">
                                  ${existing.totalAmount}
                                  {existing.discountApplied > 0
                                    ? ` (${existing.durationHours} hrs, discount applied)`
                                    : ""}
                                </p>
                                <p className="text-[#a39e95]">
                                  {existing.paymentStatus === "paid"
                                    ? "Paid"
                                    : "Payment pending"}
                                </p>
                              </>
                            ) : (
                              <p className="text-[#a39e95]">Part of 2-hour reservation</p>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBooking(court, hour)}
                            className="w-full rounded-lg border border-[#d9d5cf] px-2 py-2 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#faf9f7]"
                          >
                            Book
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
          <div className="w-full max-w-lg rounded-2xl border border-[#e8e5df] bg-white p-5 shadow-xl sm:p-6">
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
                  <input
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                </>
              )}
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value) === 2 ? 2 : 1)}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 consecutive hours (discount)</option>
              </select>
              {memberSession && (
                <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                  Booking as Member #{memberSession.memberNumber}.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              Rate: <strong>${activeAmount}</strong> ({memberSession ? "member" : "public"})
              {durationHours === 2 && activeCourt && (
                <p className="mt-1 text-[12px] text-[#7a756d]">
                  Includes 10% discount on the second hour for consecutive bookings.
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleReserveOnly}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Reserve Without Paying
              </button>
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={isCreatingStripe}
                className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-60"
              >
                {isCreatingStripe ? "Opening Stripe..." : "Pay with Card (Stripe)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = saveBooking("venmo");
                  if (!booking) return;
                  window.open(buildVenmoUrl(booking), "_blank");
                  setStatusMsg("Venmo opened in a new tab.");
                }}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Pay with Venmo
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = saveBooking("paypal");
                  if (!booking) return;
                  window.open(buildPaypalUrl(booking), "_blank");
                  setStatusMsg("PayPal opened in a new tab.");
                }}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Pay with PayPal
              </button>
            </div>

            {statusMsg && <p className="mt-3 text-[12px] text-[#2d5016]">{statusMsg}</p>}
            {lastBooked && (
              <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
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
