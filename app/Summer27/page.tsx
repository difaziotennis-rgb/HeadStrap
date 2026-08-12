"use client";

import Link from "next/link";
import { useS27Session } from "./use-s27-session";
import { clinicDayLabel, clinicTimeLabel, s27Clinics, s27Events } from "./summer27-data";

export default function Summer27Home() {
  const session = useS27Session();
  const adultClinics = s27Clinics.filter((c) => c.kind === "adult");
  const juniorClinics = s27Clinics.filter((c) => c.kind === "junior");
  const events = s27Events;

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-3 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-[0_14px_36px_rgba(26,26,26,0.07)]">
          <div className="relative border-b border-[#f0ede8] bg-[#1e3a5f] p-6 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">Summer 2027 preview</p>
            <h2 className="mt-2 max-w-3xl text-[28px] font-semibold tracking-tight text-white sm:text-5xl">
              Two courts. A pro shop. A first season.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/90 sm:text-[15px]">
              DiFazio Tennis at Rhinebeck Tennis Club — Courts 1 &amp; 2 plus the pro shop. Lessons, clinics,
              court time, stringing, and a handful of club events. Hudson Valley, unhurried.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={session ? "/Summer27/book" : "/Summer27/member"}
                className="rounded-lg bg-white px-4 py-2 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f5f3ef]"
              >
                {session ? "Book a court" : "Become a member"}
              </Link>
              <Link
                href="/Summer27/clinics"
                className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-[12px] font-medium text-white hover:bg-white/20"
              >
                View clinics
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-4 sm:grid-cols-3 sm:p-6">
            {[
              { label: "Courts", value: "Court 1 & Court 2", note: "Hourly member play · clinics blocked" },
              { label: "Lessons", value: "Derek DiFazio", note: "Court 1 · weekday mornings & late afternoons" },
              { label: "Pro shop", value: "Stringing", note: "$50 labor + cost of string" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#e8e5df] bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{item.label}</p>
                <p className="mt-1 text-[16px] font-medium">{item.value}</p>
                <p className="mt-1 text-[12px] text-[#6b665e]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-3 pb-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Weekly clinics</p>
              <Link href="/Summer27/clinics" className="text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
                Sign up
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {adultClinics.map((c) => (
                <li key={c.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{c.level}</p>
                  <p className="mt-0.5 text-[13px] font-medium">{c.name}</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · max {c.capacity} · ${c.memberPrice} members
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-[#8a8477]">
              Juniors: {juniorClinics.map((c) => `${c.name} (${clinicDayLabel(c.days)})`).join(" · ")}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Club events</p>
              <Link href="/Summer27/events" className="text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
                Full calendar
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {events.slice(0, 4).map((e) => (
                <li key={e.id}>
                  <Link href={`/Summer27/events/${e.id}`} className="block rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2.5 hover:bg-white">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{e.category}</p>
                    <p className="text-[13px] font-medium">{e.title}</p>
                    <p className="text-[12px] text-[#6b665e]">{e.timeLabel}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">How it works</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {[
              "Join as a member and save a card for one-click booking.",
              "Pay in advance for courts, clinics, lessons, and events.",
              "Change or cancel from My Account until 24 hours before start.",
              "Court 1 is reserved for private instruction weekday mornings and late afternoons. Clinics use both courts.",
            ].map((step, i) => (
              <p key={step} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3 text-[13px] text-[#4a4a4a]">
                <span className="font-medium">{i + 1}.</span> {step}
              </p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
