"use client";

import Link from "next/link";
import { useS27Session } from "./use-s27-session";
import { clinicDayLabel, clinicTimeLabel, s27Clinics, s27Events } from "./summer27-data";

export default function Summer27Home() {
  const session = useS27Session();
  const adultClinics = s27Clinics.filter((c) => c.kind === "adult");
  const events = s27Events;

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-3 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-[0_14px_36px_rgba(26,26,26,0.07)]">
          <div className="relative border-b border-[#f0ede8] bg-[#1e3a5f] p-6 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">DiFazio Tennis at Rhinebeck</p>
            <h2 className="mt-2 max-w-3xl text-[28px] font-semibold tracking-tight text-white sm:text-5xl">
              Courts 1 &amp; 2. Lessons. Club play.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
              Private instruction, weekly clinics, court time, and stringing.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={session ? "/Summer27/book" : "/Summer27/member"}
                className="rounded-lg bg-white px-4 py-2 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f5f3ef]"
              >
                {session ? "Book a court" : "Join"}
              </Link>
              <Link
                href="/Summer27/clinics"
                className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-[12px] font-medium text-white hover:bg-white/20"
              >
                Clinics
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-4 sm:grid-cols-3 sm:p-6">
            {[
              { label: "Courts", value: "$50 / hour", note: "Members · Court 1 & 2", href: "/Summer27/book" },
              { label: "Lessons", value: "Choose a pro", note: "Private instruction", href: "/Summer27/lessons" },
              { label: "Stringing", value: "$50 labor", note: "Plus cost of string", href: "/Summer27/stringing" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-[#e8e5df] bg-white p-4 hover:bg-[#faf9f7]">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{item.label}</p>
                <p className="mt-1 text-[16px] font-medium">{item.value}</p>
                <p className="mt-1 text-[12px] text-[#6b665e]">{item.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
              <Link href="/Summer27/clinics" className="text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
                Sign up
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {adultClinics.map((c) => (
                <li key={c.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2.5">
                  <p className="text-[13px] font-medium">{c.name}</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {c.level} · {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · ${c.memberPrice}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/Summer27/juniors" className="mt-3 inline-block text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
              Junior hours →
            </Link>
          </div>

          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
              <Link href="/Summer27/events" className="text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
                Calendar
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {events.slice(0, 4).map((e) => (
                <li key={e.id}>
                  <Link href={`/Summer27/events/${e.id}`} className="block rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2.5 hover:bg-white">
                    <p className="text-[13px] font-medium">{e.title}</p>
                    <p className="text-[12px] text-[#6b665e]">{e.timeLabel}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
