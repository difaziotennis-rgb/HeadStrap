"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLiveEvents } from "../schedule";
import { KEYS, loadList, type S27EventBooking } from "../storage";

export default function Summer27EventsPage() {
  const [bookings, setBookings] = useState<S27EventBooking[]>([]);

  useEffect(() => {
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">A small club calendar</h2>
      <p className="mt-2 max-w-2xl text-[14px] text-[#6b665e]">
        Mixed doubles round robins, a member–guest mixer, ladies morning play, and one family afternoon. Pay in
        advance. Courts are blocked for event windows.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {getLiveEvents().map((event) => {
          const taken = counts[event.id] || 0;
          return (
            <Link
              key={event.id}
              href={`/Summer27/events/${event.id}`}
              className="rounded-2xl border border-[#e8e5df] bg-white p-5 hover:bg-[#faf9f7]"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{event.category}</p>
              <h3 className="mt-1 text-[17px] font-medium">{event.title}</h3>
              <p className="mt-1 text-[13px] text-[#6b665e]">{event.timeLabel}</p>
              <p className="mt-2 text-[13px] text-[#4a4a4a]">{event.description}</p>
              <p className="mt-3 text-[12px] text-[#8a8477]">
                ${event.memberPrice} members · ${event.guestPrice} guests · {taken}/{event.capacity} signed up
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
