"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM - 9 PM

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2;
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

function formatHour(hour: number): string {
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function toDateTime(date: string, hour: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hour, 0, 0, 0);
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

export default function RTCMemberPortalPage() {
  const [courtMap, setCourtMap] = useState<Record<string, CourtBooking>>({});
  const [lessons, setLessons] = useState<LessonBooking[]>([]);
  const [clinics, setClinics] = useState<ClinicBooking[]>([]);
  const [events, setEvents] = useState<EventReservation[]>([]);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    date: "",
    courtId: COURTS[0].id,
    startHour: HOURS[0],
  });
  const [modifyMsg, setModifyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const courtRaw = localStorage.getItem(COURT_KEY);
      const lessonRaw = localStorage.getItem(LESSON_KEY);
      const clinicRaw = localStorage.getItem(CLINIC_KEY);
      const eventRaw = localStorage.getItem(EVENT_KEY);

      const courtMap = (courtRaw ? JSON.parse(courtRaw) : {}) as Record<string, CourtBooking>;
      setCourtMap(courtMap);
      setLessons((lessonRaw ? JSON.parse(lessonRaw) : []) as LessonBooking[]);
      setClinics((clinicRaw ? JSON.parse(clinicRaw) : []) as ClinicBooking[]);
      setEvents((eventRaw ? JSON.parse(eventRaw) : []) as EventReservation[]);
    } catch {
      // Ignore malformed local data.
    }
  }, []);

  const courts = useMemo(() => {
    const uniqueStarts = new Map<string, CourtBooking>();
    Object.values(courtMap).forEach((booking) => {
      if (booking.hour !== booking.blockStartHour) return;
      if (!uniqueStarts.has(booking.id)) uniqueStarts.set(booking.id, booking);
    });
    return Array.from(uniqueStarts.values()).sort(
      (a, b) =>
        toDateTime(a.date, a.blockStartHour).getTime() - toDateTime(b.date, b.blockStartHour).getTime()
    );
  }, [courtMap]);

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
    if (booking.durationHours === 2 && editForm.startHour + 1 > HOURS[HOURS.length - 1]) {
      setModifyMsg("Two-hour bookings must start at least one hour earlier.");
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

  const totals = useMemo(() => {
    const upcomingCount = courts.length + lessons.length + clinics.length + events.length;
    const outstanding = courts
      .filter((b) => b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    return { upcomingCount, outstanding };
  }, [courts, lessons, clinics, events]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Member Portal</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your Upcoming Club Schedule</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#6b665e]">
              A private, concierge-style view of your upcoming courts, lessons, clinics, and event plans.
            </p>
          </div>
          <span className="rounded-full border border-[#d9d5cf] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[#7a756d]">
            Test Access Enabled
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Total Upcoming</p>
            <p className="mt-1 text-[26px] font-semibold">{totals.upcomingCount}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Court Bookings</p>
            <p className="mt-1 text-[26px] font-semibold">{courts.length}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Lessons + Clinics</p>
            <p className="mt-1 text-[26px] font-semibold">{lessons.length + clinics.length}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Outstanding Court Balance</p>
            <p className="mt-1 text-[26px] font-semibold">${totals.outstanding.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Upcoming Court Bookings</p>
            <div className="mt-3 space-y-2">
              {courts.length === 0 ? (
                <p className="text-[13px] text-[#8a8477]">No court bookings yet.</p>
              ) : (
                courts.slice(0, 6).map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{booking.courtName}</p>
                    <p className="text-[#6b665e]">
                      {booking.date} · {formatHour(booking.blockStartHour)}
                      {booking.durationHours === 2 ? " (2 hours)" : ""}
                    </p>
                    <p className="text-[#6b665e]">
                      ${booking.totalAmount} · {booking.paymentStatus === "paid" ? "Paid" : "Payment pending"}
                    </p>
                    {booking.memberNumber && <p className="text-[#8a8477]">Member #{booking.memberNumber}</p>}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Upcoming Lessons</p>
            <div className="mt-3 space-y-2">
              {lessons.length === 0 ? (
                <p className="text-[13px] text-[#8a8477]">No lessons booked yet.</p>
              ) : (
                lessons.slice(0, 6).map((lesson) => (
                  <div key={lesson.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{lesson.coachName}</p>
                    <p className="text-[#6b665e]">{lesson.slot}</p>
                    <p className="text-[#8a8477]">{lesson.clientName}</p>
                    {lesson.memberNumber && <p className="text-[#8a8477]">Member #{lesson.memberNumber}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinic Enrollments</p>
            <div className="mt-3 space-y-2">
              {clinics.length === 0 ? (
                <p className="text-[13px] text-[#8a8477]">No clinic enrollments yet.</p>
              ) : (
                clinics.slice(0, 6).map((clinic) => (
                  <div key={clinic.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{clinic.clinicNames.join(", ")}</p>
                    <p className="text-[#6b665e]">{clinic.sessionWindow}</p>
                    <p className="text-[#6b665e]">Total ${clinic.total.toFixed(2)}</p>
                    {clinic.memberNumber && <p className="text-[#8a8477]">Member #{clinic.memberNumber}</p>}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Event RSVPs</p>
            <div className="mt-3 space-y-2">
              {events.length === 0 ? (
                <p className="text-[13px] text-[#8a8477]">No event RSVPs yet.</p>
              ) : (
                events.slice(0, 6).map((event) => (
                  <div key={event.id} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{event.eventTitle}</p>
                    <p className="text-[#6b665e]">{event.eventDateLabel} · {event.guestCount} guest{event.guestCount > 1 ? "s" : ""}</p>
                    <p className="text-[#6b665e]">Total ${event.total.toFixed(2)}</p>
                    {event.memberNumber && <p className="text-[#8a8477]">Member #{event.memberNumber}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Modify Court Bookings</p>
            <p className="text-[11px] text-[#8a8477]">Online modifications are available more than 72 hours out.</p>
          </div>

          <div className="mt-3 space-y-3">
            {courts.length === 0 && <p className="text-[13px] text-[#8a8477]">No court bookings available to modify.</p>}
            {courts.map((booking) => {
              const canModify = canModifyBooking(booking);
              return (
                <div key={`modify-${booking.id}`} className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-3 text-[12px]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{booking.courtName}</p>
                      <p className="text-[#6b665e]">
                        {booking.date} · {formatHour(booking.blockStartHour)}
                        {booking.durationHours === 2 ? " (2 hours)" : ""}
                      </p>
                      <p className="text-[#8a8477]">{canModify ? "Eligible to edit online" : "Locked by 72-hour policy"}</p>
                      {booking.memberNumber && <p className="text-[#8a8477]">Member #{booking.memberNumber}</p>}
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
                      <div className="sm:col-span-3 flex flex-wrap gap-2">
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
        </div>

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
