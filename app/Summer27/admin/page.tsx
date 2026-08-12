"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  KEYS,
  loadList,
  loadRecord,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import { formatHour, formatPrettyDate } from "../summer27-data";

export default function Summer27AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("s27_admin") === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const courtMap = loadRecord<S27CourtBooking>(KEYS.courts);
    const unique = Object.values(courtMap).filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
    setCourts(unique);
    setClinics(loadList<S27ClinicBooking>(KEYS.clinics));
    setLessons(loadList<S27LessonBooking>(KEYS.lessons));
    setEvents(loadList<S27EventBooking>(KEYS.events));
    setStringing(loadList<S27StringingOrder>(KEYS.stringing));
    setMembers(loadList<S27MemberAccount>(KEYS.members));
  }, [authed]);

  const revenue = useMemo(() => {
    const paid = [
      ...courts,
      ...clinics,
      ...lessons,
      ...events,
      ...stringing,
    ].filter((b) => b.paymentStatus === "paid");
    return paid.reduce((sum, b) => sum + b.amount, 0);
  }, [courts, clinics, lessons, events, stringing]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (password === "admin" || password === "admin123") {
      sessionStorage.setItem("s27_admin", "1");
      setAuthed(true);
      return;
    }
    setError("Try admin / admin123 for this preview.");
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <h2 className="text-xl font-medium">Summer ’27 admin</h2>
        <form onSubmit={login} className="mt-4 space-y-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          {error && <p className="text-[12px] text-[#991b1b]">{error}</p>}
          <button className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[13px] text-white">Enter</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Admin</p>
          <h2 className="text-2xl font-semibold">Summer ’27 desk</h2>
        </div>
        <Link href="/Summer27" className="text-[12px] text-[#8a8477]">
          Back to site
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Stat label="Members" value={String(members.length)} />
        <Stat label="Paid revenue" value={`$${revenue}`} />
        <Stat label="Clinic signups" value={String(clinics.filter((c) => c.paymentStatus === "paid").length)} />
        <Stat label="Court bookings" value={String(courts.filter((c) => c.paymentStatus === "paid").length)} />
      </div>

      <Section title="Members">
        {members.length === 0 ? (
          <Empty />
        ) : (
          members.map((m) => (
            <p key={m.memberNumber} className="text-[13px]">
              #{m.memberNumber} · {m.name} · {m.email}
            </p>
          ))
        )}
      </Section>
      <Section title="Courts">
        {courts.length === 0 ? (
          <Empty />
        ) : (
          courts.map((b) => (
            <p key={b.id} className="text-[13px]">
              {b.courtName} · {formatPrettyDate(b.date)} {formatHour(b.hour)} · {b.clientName} · ${b.amount} · {b.paymentStatus}
            </p>
          ))
        )}
      </Section>
      <Section title="Clinics / juniors">
        {clinics.length === 0 ? (
          <Empty />
        ) : (
          clinics.map((b) => (
            <p key={b.id} className="text-[13px]">
              {b.clinicName} · {formatPrettyDate(b.date)} · {b.clientName} · ${b.amount} · {b.paymentStatus}
            </p>
          ))
        )}
      </Section>
      <Section title="Lessons">
        {lessons.length === 0 ? (
          <Empty />
        ) : (
          lessons.map((b) => (
            <p key={b.id} className="text-[13px]">
              {formatPrettyDate(b.date)} {formatHour(b.hour)} · {b.clientName} · ${b.amount} · {b.paymentStatus}
            </p>
          ))
        )}
      </Section>
      <Section title="Events">
        {events.length === 0 ? (
          <Empty />
        ) : (
          events.map((b) => (
            <p key={b.id} className="text-[13px]">
              {b.eventTitle} · {b.attendeeName} ×{b.guestCount} · ${b.amount} · {b.paymentStatus}
            </p>
          ))
        )}
      </Section>
      <Section title="Stringing">
        {stringing.length === 0 ? (
          <Empty />
        ) : (
          stringing.map((b) => (
            <p key={b.id} className="text-[13px]">
              {b.racket} · {b.stringName} · {b.clientName} · ${b.amount} · {b.paymentStatus}
            </p>
          ))
        )}
      </Section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{label}</p>
      <p className="mt-1 text-xl font-medium">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-[13px] text-[#8a8477]">None yet.</p>;
}
