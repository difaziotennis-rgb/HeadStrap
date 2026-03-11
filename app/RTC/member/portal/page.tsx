"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MemberAuth from "../../MemberAuth";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
} from "../../member-session";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const MEMBER_PAYMENT_KEY = "rtc_member_payment_profile_v1";
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM - 9 PM

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2 | 3;
  courtId: string;
  courtName: string;
  type: "indoor" | "outdoor";
  clientName: string;
  memberNumber?: string;
  totalAmount: number;
  paymentStatus?: "pending" | "paid";
};

type LessonBooking = {
  id: string;
  coachName: string;
  slot: string;
  clientName: string;
  memberNumber?: string;
  createdAt: string;
};

type ClinicBooking = {
  id: string;
  clinicNames: string[];
  sessionWindow: string;
  total: number;
  clientName: string;
  memberNumber?: string;
  createdAt: string;
};

type EventReservation = {
  id: string;
  eventTitle: string;
  eventDateLabel: string;
  guestCount: number;
  total: number;
  attendeeName: string;
  memberNumber?: string;
  createdAt: string;
};

type PaymentProfile = {
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: string;
  expYear: string;
  billingZip: string;
  autopay: boolean;
};

type BillingRow = {
  id: string;
  source: "court" | "clinic" | "event";
  label: string;
  amount: number;
  status: "Paid" | "Pending";
  at: string;
};

const COURTS = [
  { id: "indoor-1", name: "Indoor Court", type: "indoor" as const },
  { id: "outdoor-1", name: "Court 1", type: "outdoor" as const },
  { id: "outdoor-2", name: "Court 2", type: "outdoor" as const },
  { id: "outdoor-3", name: "Court 3", type: "outdoor" as const },
  { id: "outdoor-4", name: "Court 4", type: "outdoor" as const },
  { id: "outdoor-5", name: "Court 5", type: "outdoor" as const },
];

type EditForm = {
  date: string;
  courtId: string;
  startHour: number;
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

function formatDateTime(isoLike: string): string {
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return isoLike;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateTime(date: string, hour: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hour, 0, 0, 0);
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

function quarterKey(dateIso: string): string {
  const date = new Date(dateIso);
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

function quarterLabel(key: string): string {
  const [year, qToken] = key.split("-Q");
  return `Q${qToken} ${year}`;
}

function compareQuarterDesc(a: string, b: string): number {
  const [aYear, aQuarter] = a.split("-Q").map(Number);
  const [bYear, bQuarter] = b.split("-Q").map(Number);
  if (aYear !== bYear) return bYear - aYear;
  return bQuarter - aQuarter;
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export default function RTCMemberPortalPage() {
  const [session, setSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [courtMap, setCourtMap] = useState<Record<string, CourtBooking>>({});
  const [lessons, setLessons] = useState<LessonBooking[]>([]);
  const [clinics, setClinics] = useState<ClinicBooking[]>([]);
  const [events, setEvents] = useState<EventReservation[]>([]);
  const [payment, setPayment] = useState<PaymentProfile>({
    brand: "Visa",
    last4: "",
    expMonth: "",
    expYear: "",
    billingZip: "",
    autopay: false,
  });
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    date: "",
    courtId: COURTS[0].id,
    startHour: HOURS[0],
  });
  const [modifyMsg, setModifyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function load() {
      setSession(parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY)));
      const nextCourtMap = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
      const nextLessons = safeParse<LessonBooking[]>(localStorage.getItem(LESSON_KEY), []);
      const nextClinics = safeParse<ClinicBooking[]>(localStorage.getItem(CLINIC_KEY), []);
      const nextEvents = safeParse<EventReservation[]>(localStorage.getItem(EVENT_KEY), []);
      const nextPayment = safeParse<PaymentProfile | null>(localStorage.getItem(MEMBER_PAYMENT_KEY), null);

      setCourtMap(nextCourtMap);
      setLessons(nextLessons);
      setClinics(nextClinics);
      setEvents(nextEvents);
      if (nextPayment) setPayment(nextPayment);
    }

    load();
    window.addEventListener(MEMBER_SESSION_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(MEMBER_SESSION_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const memberNumber = session?.memberNumber || "";

  const courts = useMemo(() => {
    const uniqueStarts = new Map<string, CourtBooking>();
    Object.values(courtMap).forEach((booking) => {
      if (booking.hour !== booking.blockStartHour) return;
      if (memberNumber && booking.memberNumber !== memberNumber) return;
      if (!uniqueStarts.has(booking.id)) uniqueStarts.set(booking.id, booking);
    });
    return Array.from(uniqueStarts.values()).sort(
      (a, b) =>
        toDateTime(a.date, a.blockStartHour).getTime() - toDateTime(b.date, b.blockStartHour).getTime()
    );
  }, [courtMap, memberNumber]);

  const scopedLessons = useMemo(
    () => lessons.filter((item) => (memberNumber ? item.memberNumber === memberNumber : false)),
    [lessons, memberNumber]
  );
  const scopedClinics = useMemo(
    () => clinics.filter((item) => (memberNumber ? item.memberNumber === memberNumber : false)),
    [clinics, memberNumber]
  );
  const scopedEvents = useMemo(
    () => events.filter((item) => (memberNumber ? item.memberNumber === memberNumber : false)),
    [events, memberNumber]
  );

  const now = Date.now();
  const upcomingCourts = useMemo(
    () => courts.filter((booking) => toDateTime(booking.date, booking.blockStartHour).getTime() >= now),
    [courts, now]
  );
  const pastCourts = useMemo(
    () => courts.filter((booking) => toDateTime(booking.date, booking.blockStartHour).getTime() < now),
    [courts, now]
  );

  const billingRows = useMemo(() => {
    const rows: BillingRow[] = [];
    for (const booking of courts) {
      rows.push({
        id: `court-${booking.id}`,
        source: "court",
        label: `${booking.courtName} booking`,
        amount: Number(booking.totalAmount || 0),
        status: booking.paymentStatus === "paid" ? "Paid" : "Pending",
        at: `${booking.date}T12:00:00`,
      });
    }
    for (const clinic of scopedClinics) {
      rows.push({
        id: `clinic-${clinic.id}`,
        source: "clinic",
        label: `Clinic: ${clinic.clinicNames.join(", ")}`,
        amount: Number(clinic.total || 0),
        status: "Paid",
        at: clinic.createdAt,
      });
    }
    for (const event of scopedEvents) {
      rows.push({
        id: `event-${event.id}`,
        source: "event",
        label: `Event: ${event.eventTitle}`,
        amount: Number(event.total || 0),
        status: "Paid",
        at: event.createdAt,
      });
    }
    return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [courts, scopedClinics, scopedEvents]);

  const quarterSummary = useMemo(() => {
    const byQuarter = new Map<
      string,
      { billed: number; paid: number; pending: number; lineItems: number }
    >();
    for (const row of billingRows) {
      const key = quarterKey(row.at);
      const existing = byQuarter.get(key) || { billed: 0, paid: 0, pending: 0, lineItems: 0 };
      existing.billed += row.amount;
      if (row.status === "Paid") existing.paid += row.amount;
      if (row.status === "Pending") existing.pending += row.amount;
      existing.lineItems += 1;
      byQuarter.set(key, existing);
    }
    return Array.from(byQuarter.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => compareQuarterDesc(a.key, b.key));
  }, [billingRows]);

  const currentQuarter = useMemo(() => {
    return quarterSummary[0] || null;
  }, [quarterSummary]);

  const billingRowsByQuarter = useMemo(() => {
    const grouped = new Map<string, BillingRow[]>();
    for (const row of billingRows) {
      const key = quarterKey(row.at);
      const existing = grouped.get(key) || [];
      existing.push(row);
      grouped.set(key, existing);
    }
    for (const [key, rows] of grouped.entries()) {
      grouped.set(
        key,
        [...rows].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      );
    }
    return grouped;
  }, [billingRows]);

  const totals = useMemo(() => {
    const outstanding = billingRows
      .filter((row) => row.status === "Pending")
      .reduce((sum, row) => sum + row.amount, 0);
    return {
      upcomingCount: upcomingCourts.length + scopedLessons.length + scopedClinics.length + scopedEvents.length,
      outstanding,
    };
  }, [upcomingCourts.length, scopedLessons.length, scopedClinics.length, scopedEvents.length, billingRows]);

  function downloadQuarterStatement(quarterKeyValue: string) {
    if (typeof window === "undefined") return;
    const rows = billingRowsByQuarter.get(quarterKeyValue) || [];
    if (rows.length === 0) return;
    const header = ["Date", "Label", "Amount", "Status", "Source"];
    const data = rows.map((row) => [
      formatDateTime(row.at),
      row.label,
      row.amount.toFixed(2),
      row.status,
      row.source,
    ]);
    const csv = [header, ...data]
      .map((line) => line.map((cell) => csvEscape(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rtc-statement-${quarterKeyValue}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function canModifyBooking(booking: CourtBooking): boolean {
    const startsAt = toDateTime(booking.date, booking.blockStartHour).getTime();
    return startsAt - Date.now() > 72 * 60 * 60 * 1000;
  }

  function persistCourts(next: Record<string, CourtBooking>) {
    setCourtMap(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(COURT_KEY, JSON.stringify(next));
    }
  }

  function openEditor(booking: CourtBooking) {
    setEditBookingId(booking.id);
    setEditForm({
      date: booking.date,
      courtId: booking.courtId,
      startHour: booking.blockStartHour,
    });
    setModifyMsg(null);
  }

  function cancelEditor() {
    setEditBookingId(null);
    setModifyMsg(null);
  }

  function saveBookingChanges(booking: CourtBooking) {
    if (!canModifyBooking(booking)) {
      setModifyMsg("This booking is inside the 72-hour policy window and cannot be edited online.");
      return;
    }
    if (editForm.startHour + (booking.durationHours - 1) > HOURS[HOURS.length - 1]) {
      setModifyMsg(`${booking.durationHours}-hour bookings must start earlier in the day.`);
      return;
    }

    for (let i = 0; i < booking.durationHours; i += 1) {
      const key = bookingKey(editForm.date, editForm.courtId, editForm.startHour + i);
      const existing = courtMap[key];
      if (existing && existing.id !== booking.id) {
        setModifyMsg("The selected court/time is not available.");
        return;
      }
    }

    const next = { ...courtMap };
    Object.keys(next).forEach((key) => {
      if (next[key].id === booking.id) delete next[key];
    });

    const targetCourt = COURTS.find((court) => court.id === editForm.courtId);
    for (let i = 0; i < booking.durationHours; i += 1) {
      const slotHour = editForm.startHour + i;
      const updated: CourtBooking = {
        ...booking,
        date: editForm.date,
        hour: slotHour,
        blockStartHour: editForm.startHour,
        courtId: targetCourt?.id || booking.courtId,
        courtName: targetCourt?.name || booking.courtName,
        type: targetCourt?.type || booking.type,
      };
      next[bookingKey(updated.date, updated.courtId, updated.hour)] = updated;
    }

    persistCourts(next);
    setModifyMsg("Booking updated successfully.");
    setEditBookingId(null);
  }

  function cancelBooking(booking: CourtBooking) {
    if (!canModifyBooking(booking)) {
      setModifyMsg("This booking is inside the 72-hour policy window and cannot be cancelled online.");
      return;
    }
    const next = { ...courtMap };
    Object.keys(next).forEach((key) => {
      if (next[key].id === booking.id) delete next[key];
    });
    persistCourts(next);
    setModifyMsg("Booking cancelled successfully.");
    if (editBookingId === booking.id) setEditBookingId(null);
  }

  function savePaymentProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(payment.last4)) {
      setPaymentMsg("Card ending must be exactly 4 digits.");
      return;
    }
    if (payment.expMonth.length < 1 || payment.expYear.length < 2) {
      setPaymentMsg("Please provide expiration month and year.");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(MEMBER_PAYMENT_KEY, JSON.stringify(payment));
    }
    setPaymentMsg("Payment profile updated.");
  }

  const notSignedIn = !memberNumber;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Member Dashboard</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Member Dashboard</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#6b665e]">
              Manage bookings, billing, payment details, and quarterly statements from one clean member workspace.
            </p>
          </div>
          <MemberAuth />
        </div>

        {notSignedIn && (
          <p className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px] text-[#6b665e]">
            Sign in with your member number to unlock your personalized schedule, billing history, and account controls.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <a href="#portal-upcoming" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">Upcoming</a>
          <a href="#portal-modify" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">Modify</a>
          <a href="#portal-payment" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">Payment</a>
          <a href="#portal-billing" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">Billing</a>
          <a href="#portal-statements" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">Statements</a>
          <a href="#portal-history" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 hover:bg-[#faf9f7]">History</a>
        </div>

        <details id="portal-upcoming" className="mt-4 rounded-xl border border-[#ece8e2] p-4" open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Upcoming Schedule
          </summary>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[11px] font-medium">Court Bookings</p>
              {notSignedIn ? (
                <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to view your upcoming bookings.</p>
              ) : upcomingCourts.length === 0 ? (
                <p className="mt-2 text-[12px] text-[#8a8477]">No upcoming court bookings.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {upcomingCourts.slice(0, 6).map((booking) => (
                    <div key={booking.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                      <p className="font-medium">{booking.courtName}</p>
                      <p className="text-[#6b665e]">{booking.date} · {formatHour(booking.blockStartHour)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[11px] font-medium">Lessons, Clinics, and Events</p>
              {notSignedIn ? (
                <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to view your activity details.</p>
              ) : (
                <div className="mt-2 space-y-2 text-[12px] text-[#4a4a4a]">
                  <p>Lessons booked: {scopedLessons.length}</p>
                  <p>Clinic enrollments: {scopedClinics.length}</p>
                  <p>Event RSVPs: {scopedEvents.length}</p>
                </div>
              )}
            </section>
          </div>
        </details>

        <details id="portal-modify" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Modify Court Bookings
          </summary>
          <p className="mt-2 text-[11px] text-[#8a8477]">Online modifications are available more than 72 hours out.</p>
          {notSignedIn ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to edit or cancel your bookings.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {upcomingCourts.length === 0 && (
                <p className="text-[13px] text-[#8a8477]">No upcoming court bookings available to modify.</p>
              )}
              {upcomingCourts.map((booking) => {
                const canModify = canModifyBooking(booking);
                return (
                  <div key={`modify-${booking.id}`} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3 text-[12px]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{booking.courtName}</p>
                        <p className="text-[#6b665e]">
                          {booking.date} · {formatHour(booking.blockStartHour)}
                          {booking.durationHours > 1 ? ` (${booking.durationHours} hours)` : ""}
                        </p>
                        <p className="text-[#8a8477]">{canModify ? "Eligible to edit online" : "Locked by 72-hour policy"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!canModify}
                          onClick={() => openEditor(booking)}
                          className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white"
                        >
                          Modify
                        </button>
                        <button
                          type="button"
                          disabled={!canModify}
                          onClick={() => cancelBooking(booking)}
                          className="rounded-md border border-[#e6cccc] px-2.5 py-1 text-[11px] font-medium text-[#7f1d1d] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {editBookingId === booking.id && (
                      <div className="mt-3 grid gap-2 rounded-lg border border-[#e8e5df] bg-white p-3 sm:grid-cols-3">
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                          className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                        />
                        <select
                          value={editForm.courtId}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, courtId: e.target.value }))}
                          className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                        >
                          {COURTS.map((court) => (
                            <option key={court.id} value={court.id}>
                              {court.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editForm.startHour}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, startHour: Number(e.target.value) }))}
                          className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                        >
                          {HOURS.map((hour) => (
                            <option key={hour} value={hour}>
                              {formatHour(hour)}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap gap-2 sm:col-span-3">
                          <button
                            type="button"
                            onClick={() => saveBookingChanges(booking)}
                            className="rounded-md bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#2c2c2c]"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditor}
                            className="rounded-md border border-[#d9d5cf] px-3 py-1.5 text-[11px] font-medium hover:bg-[#faf9f7]"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {modifyMsg && <p className="text-[12px] text-[#2d5016]">{modifyMsg}</p>}
            </div>
          )}
        </details>

        <details id="portal-payment" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Payment Details
          </summary>
          {notSignedIn ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to edit your payment profile.</p>
          ) : (
            <form onSubmit={savePaymentProfile} className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                value={payment.brand}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, brand: e.target.value as PaymentProfile["brand"] }))
                }
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">Amex</option>
              </select>
              <input
                value={payment.last4}
                onChange={(e) => setPayment((prev) => ({ ...prev, last4: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="Card ending (4 digits)"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <input
                value={payment.expMonth}
                onChange={(e) => setPayment((prev) => ({ ...prev, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                placeholder="Exp month (MM)"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <input
                value={payment.expYear}
                onChange={(e) => setPayment((prev) => ({ ...prev, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                placeholder="Exp year (YYYY)"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <input
                value={payment.billingZip}
                onChange={(e) => setPayment((prev) => ({ ...prev, billingZip: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                placeholder="Billing ZIP"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] sm:col-span-2"
              />
              <label className="flex items-center gap-2 rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={payment.autopay}
                  onChange={(e) => setPayment((prev) => ({ ...prev, autopay: e.target.checked }))}
                />
                Enable autopay for upcoming charges
              </label>
              <button
                type="submit"
                className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c] sm:col-span-2"
              >
                Save Payment Details
              </button>
              {paymentMsg && <p className="text-[12px] text-[#2d5016] sm:col-span-2">{paymentMsg}</p>}
            </form>
          )}
        </details>

        <details id="portal-billing" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Billing Info
          </summary>
          {notSignedIn ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to review your billing activity.</p>
          ) : billingRows.length === 0 ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">No billing activity yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {billingRows.slice(0, 20).map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]">
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="text-[#8a8477]">{formatDateTime(row.at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${row.amount.toFixed(2)}</p>
                    <p className={row.status === "Paid" ? "text-[#2d5016]" : "text-[#7f1d1d]"}>{row.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </details>

        <details id="portal-statements" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Quarterly Statements (Live + Past)
          </summary>
          {notSignedIn ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to view your live quarterly statements.</p>
          ) : quarterSummary.length === 0 ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">No statement activity yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {currentQuarter && (
                <details className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                  <summary className="cursor-pointer list-none">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Current Quarter Snapshot</p>
                    <p className="mt-1 text-[14px] font-semibold">{quarterLabel(currentQuarter.key)}</p>
                    <p className="mt-1 text-[12px] text-[#6b665e]">
                      Billed ${currentQuarter.billed.toFixed(2)} · Paid ${currentQuarter.paid.toFixed(2)} · Pending ${currentQuarter.pending.toFixed(2)}
                    </p>
                    <p className="text-[12px] text-[#8a8477]">{currentQuarter.lineItems} line items this quarter</p>
                  </summary>
                  <div className="mt-2 space-y-2 border-t border-[#e8e5df] pt-2">
                    {(billingRowsByQuarter.get(currentQuarter.key) || []).map((row) => (
                      <div key={row.id} className="rounded-md border border-[#ece8e2] bg-white px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{row.label}</p>
                          <p className="font-semibold">${row.amount.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#8a8477]">
                          <p>{formatDateTime(row.at)}</p>
                          <p className={row.status === "Paid" ? "text-[#2d5016]" : "text-[#7f1d1d]"}>{row.status}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => downloadQuarterStatement(currentQuarter.key)}
                      className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                    >
                      Download Quarter CSV
                    </button>
                  </div>
                </details>
              )}
              <div className="space-y-2">
                {quarterSummary.slice(1).map((quarter) => (
                  <details key={quarter.key} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                    <summary className="cursor-pointer list-none">
                      <p className="font-medium">{quarterLabel(quarter.key)}</p>
                      <p className="text-[#6b665e]">
                        Billed ${quarter.billed.toFixed(2)} · Paid ${quarter.paid.toFixed(2)} · Pending ${quarter.pending.toFixed(2)}
                      </p>
                      <p className="mt-1 text-[11px] text-[#8a8477]">Tap to open statement details</p>
                    </summary>
                    <div className="mt-2 space-y-2 border-t border-[#f0ede8] pt-2">
                      {(billingRowsByQuarter.get(quarter.key) || []).map((row) => (
                        <div key={row.id} className="rounded-md border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{row.label}</p>
                            <p className="font-semibold">${row.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-[#8a8477]">
                            <p>{formatDateTime(row.at)}</p>
                            <p className={row.status === "Paid" ? "text-[#2d5016]" : "text-[#7f1d1d]"}>{row.status}</p>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => downloadQuarterStatement(quarter.key)}
                        className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                      >
                        Download Quarter CSV
                      </button>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </details>

        <details id="portal-history" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
            Past Bookings and Activity
          </summary>
          {notSignedIn ? (
            <p className="mt-2 text-[12px] text-[#8a8477]">Sign in to review your booking history.</p>
          ) : (
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[11px] font-medium">Past Court Bookings</p>
                {pastCourts.length === 0 ? (
                  <p className="mt-2 text-[12px] text-[#8a8477]">No past court bookings yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {pastCourts.slice(-12).reverse().map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                        <p className="font-medium">{booking.courtName}</p>
                        <p className="text-[#6b665e]">{booking.date} · {formatHour(booking.blockStartHour)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[11px] font-medium">Past Programs and Events</p>
                <div className="mt-2 space-y-2 text-[12px]">
                  {scopedLessons.slice(-6).reverse().map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                      <p className="font-medium">Lesson · {lesson.coachName}</p>
                      <p className="text-[#6b665e]">{lesson.slot}</p>
                    </div>
                  ))}
                  {scopedClinics.slice(-6).reverse().map((clinic) => (
                    <div key={clinic.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                      <p className="font-medium">Clinic · {clinic.clinicNames.join(", ")}</p>
                      <p className="text-[#6b665e]">{formatDateTime(clinic.createdAt)}</p>
                    </div>
                  ))}
                  {scopedEvents.slice(-6).reverse().map((event) => (
                    <div key={event.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                      <p className="font-medium">Event · {event.eventTitle}</p>
                      <p className="text-[#6b665e]">{event.eventDateLabel}</p>
                    </div>
                  ))}
                  {scopedLessons.length === 0 && scopedClinics.length === 0 && scopedEvents.length === 0 && (
                    <p className="text-[#8a8477]">No past lessons, clinics, or events yet.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </details>

        <div className="mt-6 border-t border-[#f0ede8] pt-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Quick Actions</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Link href="/RTC/book" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Book Court
            </Link>
            <Link href="/RTC/lessons" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Book Lesson
            </Link>
            <Link href="/RTC/clinics" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Enroll Clinics
            </Link>
            <Link href="/RTC/events" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              RSVP Events
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
