"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useS27Session } from "./use-s27-session";
import {
  clinicTimeLabel,
  clinicsSuspendedOnDate,
  formatDateInput,
  formatPrettyDate,
  parseDateInput,
  s27Clinics,
  s27Events,
} from "./summer27-data";
import { weatherClosedOnDate } from "./schedule";
import VoiceAsk from "./VoiceAsk";

function upcomingClinicSessions(count = 4) {
  const clinics = s27Clinics;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const out: { date: string; clinic: (typeof clinics)[number] }[] = [];
  for (let i = 0; i < 21 && out.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDay();
    const iso = formatDateInput(d);
    if (clinicsSuspendedOnDate(iso, s27Events) || weatherClosedOnDate(iso)) continue;
    for (const clinic of clinics) {
      if (!clinic.days.includes(day)) continue;
      out.push({ date: iso, clinic });
      if (out.length >= count) break;
    }
  }
  return out;
}

export default function Summer27Home() {
  const session = useS27Session();
  const events = s27Events.slice(0, 3);
  const upcoming = useMemo(() => upcomingClinicSessions(4), []);

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-[#1e3a5f] p-5 shadow-[0_14px_36px_rgba(26,26,26,0.07)] sm:p-10">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">DiFazio Tennis at Rhinebeck</p>
          <h2 className="mt-2 max-w-3xl text-[26px] font-semibold tracking-tight text-white sm:text-5xl">
            A first season on Courts 3 &amp; 4
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
            Private lessons, weekly clinics, court time, and a handful of club events.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={session ? "/Summer27/book" : "/Summer27/member"}
              className="inline-flex rounded-full bg-white px-4 py-2.5 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f5f3ef]"
            >
              {session ? "Book a court" : "Join"}
            </Link>
            <VoiceAsk />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-5 sm:px-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Coming up</p>
          <ul className="mt-3 divide-y divide-[#f0ede8]">
            {upcoming.map(({ date, clinic }) => (
              <li key={`${clinic.id}-${date}`}>
                <Link
                  href={`/Summer27/clinics?clinic=${encodeURIComponent(clinic.id)}&date=${date}`}
                  className="flex items-center gap-3 py-3 hover:bg-[#faf9f7]"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">
                      {parseDateInput(date).toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className="text-[18px] font-semibold leading-none">{parseDateInput(date).getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{clinic.name}</p>
                    <p className="truncate text-[12px] text-[#6b665e]">
                      {clinicTimeLabel(clinic)} · {clinic.level} · ${clinic.memberPrice}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/Summer27/events/${e.id}`}
                  className="block rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2.5 hover:bg-white"
                >
                  <p className="text-[13px] font-medium">{e.title}</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {formatPrettyDate(e.date)} · {e.timeLabel}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
