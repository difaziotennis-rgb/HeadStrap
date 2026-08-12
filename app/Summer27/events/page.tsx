"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLiveEvents } from "../schedule";
import { formatPrettyDate, parseDateInput, s27Events, type EventDef } from "../summer27-data";
import { KEYS, loadList, type S27EventBooking } from "../storage";

function monthHeading(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function dayParts(iso: string) {
  const d = parseDateInput(iso);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: String(d.getDate()),
  };
}

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

  const byMonth = useMemo(() => {
    const sorted = events.slice().sort((a, b) => a.date.localeCompare(b.date));
    const map = new Map<string, EventDef[]>();
    for (const event of sorted) {
      const key = event.date.slice(0, 7);
      const list = map.get(key);
      if (list) list.push(event);
      else map.set(key, [event]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: monthHeading(key),
      items,
    }));
  }, [events]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Club calendar</h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
        Round robins, mixers, and a season close on Courts 1 &amp; 2 — with the clubhouse for a simple gathering after.
      </p>

      <div className="mt-8 space-y-10">
        {byMonth.map((month) => (
          <section key={month.key}>
            <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#ece8e2] pb-2">
              <h3 className="text-[18px] font-semibold tracking-tight text-[#1a1a1a]">{month.label}</h3>
              <p className="text-[12px] text-[#8a8477]">
                {month.items.length} event{month.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {month.items.map((event) => {
                const taken = counts[event.id] || 0;
                const open = Math.max(0, event.capacity - taken);
                const date = dayParts(event.date);
                const theme = event.theme || s27Events[0].theme;
                return (
                  <Link
                    key={event.id}
                    href={`/Summer27/events/${event.id}`}
                    className="group overflow-hidden rounded-2xl border border-[#e8e5df] bg-white transition hover:border-[#d9d4cb]"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2/1]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to top, ${theme.wash}ee 0%, ${theme.wash}55 45%, transparent 100%)`,
                        }}
                      />
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                        <div className="min-w-0 text-white">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-white/75">{event.category}</p>
                          <h4 className="mt-0.5 text-[16px] font-semibold leading-snug tracking-tight sm:text-[17px]">
                            {event.title}
                          </h4>
                        </div>
                        <div className="shrink-0 rounded-xl bg-white/95 px-2.5 py-2 text-center shadow-sm">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-[#8a8477]">{date.month}</p>
                          <p className="text-[18px] font-semibold leading-none text-[#1a1a1a]">{date.day}</p>
                          <p className="mt-0.5 text-[10px] text-[#8a8477]">{date.weekday}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3" style={{ background: theme.soft }}>
                      <p className="text-[13px] text-[#4a4a4a]">{event.timeLabel}</p>
                      <p className="mt-1 text-[12px] text-[#6b665e]">
                        {formatPrettyDate(event.date)} · ${event.memberPrice} members · {open > 0 ? `${open} open` : "Full"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
