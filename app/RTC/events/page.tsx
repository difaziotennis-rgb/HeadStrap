"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { rtcSummerEvents } from "../rtc-data";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
} from "../member-session";

type EventReservation = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  attendeeName: string;
  attendeeEmail: string;
  guestCount: number;
  isMember: boolean;
  memberNumber?: string;
  total: number;
  createdAt: string;
};

const STORAGE_KEY = "rtc_summer_event_reservations_v1";

function parsePrice(value: string): number {
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function RTCEventsPage() {
  const [selectedEventId, setSelectedEventId] = useState(rtcSummerEvents[0]?.id || "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [memberSession, setMemberSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [reservations, setReservations] = useState<EventReservation[]>([]);
  const isMember = !!memberSession;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      setReservations(JSON.parse(raw) as EventReservation[]);
    } catch {
      // Ignore bad data.
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

  const selectedEvent = useMemo(
    () => rtcSummerEvents.find((event) => event.id === selectedEventId) ?? rtcSummerEvents[0],
    [selectedEventId]
  );

  const perPersonPrice = useMemo(() => {
    if (!selectedEvent) return 0;
    return parsePrice(isMember ? selectedEvent.priceMember : selectedEvent.pricePublic);
  }, [isMember, selectedEvent]);

  const totalPrice = useMemo(() => {
    return perPersonPrice * guestCount;
  }, [perPersonPrice, guestCount]);

  const attendeesByEvent = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const reservation of reservations) {
      counts[reservation.eventId] = (counts[reservation.eventId] || 0) + reservation.guestCount;
    }
    return counts;
  }, [reservations]);

  function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent || (!isMember && (!name.trim() || !email.trim()))) {
      setStatusMsg("Please complete name, email, and event selection.");
      return;
    }

    const reservation: EventReservation = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      eventDateLabel: selectedEvent.dateLabel,
      attendeeName: isMember
        ? memberSession?.memberName || `Member #${memberSession?.memberNumber || "RTC"}`
        : name.trim(),
      attendeeEmail: isMember ? memberSession?.memberEmail || "" : email.trim(),
      guestCount,
      isMember,
      memberNumber: isMember ? memberSession?.memberNumber || "" : "",
      total: totalPrice,
      createdAt: new Date().toISOString(),
    };

    const next = [reservation, ...reservations].slice(0, 20);
    setReservations(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }

    setStatusMsg(`Reserved ${selectedEvent.title} for ${guestCount} guest${guestCount > 1 ? "s" : ""}.`);
    setName("");
    setEmail("");
    setGuestCount(1);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Summer Events</h2>
            <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
              A curated club calendar inspired by top private clubs: elegant social evenings,
              family-forward programming, and signature member-guest experiences.
            </p>
          </div>
          <span className="rounded-full border border-[#d9d5cf] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[#7a756d]">
            2026 Season
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {rtcSummerEvents.map((event) => {
              const active = event.id === selectedEventId;
              return (
                <div
                  key={event.id}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-[#1a1a1a] bg-white shadow-sm"
                      : "border-[#ece8e2] bg-[#faf9f7] hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEventId(event.id)}
                    className="w-full text-left"
                  >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{event.category}</p>
                      <h3 className="mt-1 text-[18px] font-semibold">{event.title}</h3>
                    </div>
                    <span className="rounded-full bg-[#f0ede8] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#7a756d]">
                      {event.audience}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-[#6b665e]">
                    {event.dateLabel} · {event.timeLabel}
                  </p>
                  <p className="mt-1 text-[12px] text-[#8a8477]">
                    {(attendeesByEvent[event.id] || 0)} attending ·{" "}
                    {Math.max((event.capacity || 0) - (attendeesByEvent[event.id] || 0), 0)} spots left
                  </p>
                  <p className="mt-2 text-[13px] text-[#6b665e] leading-relaxed">{event.description}</p>
                  <ul className="mt-2 grid gap-1 text-[12px] text-[#7a756d]">
                    {event.highlights.map((highlight) => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13px]">
                    <span className="font-medium text-[#2d5016]">{event.priceMember} member</span>
                    <span className="text-[#8a8477]"> · </span>
                    <span>{event.pricePublic} public</span>
                  </p>
                  </button>
                  <Link
                    href={`/RTC/events/${event.id}`}
                    className="mt-3 inline-block rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] font-medium hover:border-[#c8c1b6]"
                  >
                    View Event Page
                  </Link>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleReserve} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve Event</p>
            <div className="mt-3 grid gap-2">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              >
                {rtcSummerEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
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
                </>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                >
                  <option value={1}>1 guest</option>
                  <option value={2}>2 guests</option>
                  <option value={3}>3 guests</option>
                  <option value={4}>4 guests</option>
                </select>
                {isMember && (
                  <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                    Booking as Member #{memberSession?.memberNumber}.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              <p>
                <span className="text-[#7a756d]">Event:</span> <strong>{selectedEvent?.title}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Date:</span> <strong>{selectedEvent?.dateLabel}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Per person:</span>{" "}
                <strong>${perPersonPrice.toFixed(2)}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Total:</span>{" "}
                <strong>${totalPrice.toFixed(2)}</strong>
              </p>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Reserve Event Spot
            </button>
            {statusMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{statusMsg}</p>}
            <p className="mt-3 text-[11px] text-[#8a8477]">
              Concierge support: you can modify an RSVP any time.
            </p>
            <a
              href="mailto:difaziotennis@gmail.com?subject=RTC%20Event%20RSVP%20Update"
              className="mt-2 inline-block rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-[#faf9f7]"
            >
              Modify RSVP
            </a>
          </form>
        </div>

        {reservations.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Recent Reservations</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {reservations.slice(0, 6).map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                  <p className="font-medium">{reservation.eventTitle}</p>
                  <p className="text-[#6b665e]">{reservation.eventDateLabel} · {reservation.guestCount} guest{reservation.guestCount > 1 ? "s" : ""}</p>
                  <p className="text-[#6b665e]">Total ${reservation.total.toFixed(2)}</p>
                  <p className="text-[#8a8477]">{reservation.attendeeName}</p>
                  {reservation.memberNumber && <p className="text-[#8a8477]">Member #{reservation.memberNumber}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
