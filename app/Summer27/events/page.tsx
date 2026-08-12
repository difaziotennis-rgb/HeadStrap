"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLiveEvents } from "../schedule";
import { s27Events, type EventDef } from "../summer27-data";
import { KEYS, loadList, type S27EventBooking } from "../storage";

export default function Summer27EventsPage() {
  const [bookings, setBookings] = useState<S27EventBooking[]>([]);
  const [events, setEvents] = useState<EventDef[]>(s27Events);

  useEffect(() => {
    try {
      const live = getLiveEvents();
      if (live.length) setEvents(live);
    } catch {
      // keep defaults
    }
    setBookings(loadList<S27EventBooking>(KEYS.events));
  }, []);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const b of bookings) {
      if (b.paymentStatus !== "paid") continue;
      next[b.eventId] = (next[b.eventId] || 0) + b.guestCount;
    }
    return next;
  }, [bookings]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Club calendar</h2>
      <p className="mt-2 max-w-2xl text-[14px] text-[#6b665e]">Round robins, mixers, and a season close on the terrace.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {events.map((event) => {
          const taken = counts[event.id] || 0;
          return (
            <Link
              key={event.id}
              href={`/Summer27/events/${event.id}`}
              className="rounded-2xl border border-[#e8e5df] bg-white p-4 active:bg-[#faf9f7] sm:p-5"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{event.category}</p>
              <h3 className="mt-1 text-[16px] font-medium sm:text-[17px]">{event.title}</h3>
              <p className="mt-1 text-[13px] text-[#6b665e]">{event.timeLabel}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#4a4a4a]">{event.description}</p>
              <p className="mt-3 text-[12px] text-[#8a8477]">
                ${event.memberPrice} · {taken}/{event.capacity} signed up
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
