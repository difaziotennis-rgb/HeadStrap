"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startStripeCheckout } from "../payments";
import {
  clinicDayLabel,
  clinicTimeLabel,
  formatDateInput,
  parseDateInput,
  s27Clinics,
  type ClinicDef,
} from "../summer27-data";
import { getLiveClinics } from "../schedule";
import { KEYS, loadList, saveList, type S27ClinicBooking } from "../storage";

function nextDatesForClinic(clinic: ClinicDef, count = 6, extra?: string): string[] {
  const dates: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (clinic.days.includes(d.getDay())) dates.push(formatDateInput(d));
  }
  if (extra && clinic.days.includes(parseDateInput(extra).getDay()) && !dates.includes(extra)) {
    dates.push(extra);
    dates.sort();
  }
  return dates;
}

export default function Summer27JuniorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading juniors…</div>}>
      <Summer27JuniorsInner />
    </Suspense>
  );
}

function Summer27JuniorsInner() {
  const [juniors, setJuniors] = useState<ClinicDef[]>(s27Clinics.filter((c) => c.kind === "junior"));
  const session = useS27Session();
  const searchParams = useSearchParams();
  const queryClinic = searchParams.get("clinic") || "";
  const queryDate = searchParams.get("date") || "";
  const [bookings, setBookings] = useState<S27ClinicBooking[]>([]);
  const [selectedId, setSelectedId] = useState(
    () =>
      (queryClinic && s27Clinics.some((c) => c.id === queryClinic && c.kind === "junior")
        ? queryClinic
        : s27Clinics.find((c) => c.kind === "junior")?.id) || ""
  );
  const [date, setDate] = useState(queryDate);
  const [childName, setChildName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clinic = juniors.find((c) => c.id === selectedId) || juniors[0];
  const dates = useMemo(() => (clinic ? nextDatesForClinic(clinic, 6, queryDate) : []), [clinic, queryDate]);
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const price = clinic ? (isMember ? clinic.memberPrice : clinic.guestPrice) : 0;

  useEffect(() => {
    try {
      const live = getLiveClinics().filter((c) => c.kind === "junior");
      if (live.length) {
        setJuniors(live);
        setSelectedId((id) => {
          const preferred = queryClinic || id;
          return live.some((c) => c.id === preferred) ? preferred : live[0].id;
        });
      }
    } catch {
      // keep defaults
    }
    setBookings(loadList<S27ClinicBooking>(KEYS.clinics));
  }, []);

  useEffect(() => {
    if (queryDate && dates.includes(queryDate)) {
      setDate(queryDate);
      return;
    }
    if (!date || !dates.includes(date)) setDate(dates[0] || "");
  }, [dates, date, queryDate]);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27ClinicBooking>(KEYS.clinics).map((b) =>
        b.id === bookingId ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : b
      );
      saveList(KEYS.clinics, all);
      setBookings(all);
      setMsg("Enrolled.");
    }
  }, [searchParams]);

  const roster = useMemo(
    () =>
      bookings.filter(
        (b) => b.clinicId === clinic?.id && b.date === date && b.paymentStatus === "paid"
      ),
    [bookings, clinic?.id, date]
  );
  const seatsLeft = clinic ? Math.max(0, clinic.capacity - roster.length) : 0;

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (!clinic) return;
    const name = childName.trim() || (isMember ? `${session!.memberName}'s junior` : "");
    const email = isMember ? session!.memberEmail : parentEmail.trim();
    if (!name || !email) {
      setMsg("Please add the junior’s name and a parent email.");
      return;
    }
    if (seatsLeft <= 0) {
      setMsg("This hour is full.");
      return;
    }
    const id = `junior-${Date.now()}`;
    const booking: S27ClinicBooking = {
      id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date,
      clientName: name,
      clientEmail: email,
      memberNumber: session?.memberNumber,
      amount: price,
      paymentStatus: "pending",
      paymentMethod: savedCard ? "saved-card" : "stripe",
      createdAt: new Date().toISOString(),
    };
    if (savedCard) {
      booking.paymentStatus = "paid";
      const next = [...bookings, booking];
      saveList(KEYS.clinics, next);
      setBookings(next);
      setMsg(`Enrolled. $${price} charged.`);
      return;
    }
    const next = [...bookings, booking];
    saveList(KEYS.clinics, next);
    setBookings(next);
    setPaying(true);
    const checkout = await startStripeCheckout({
      amount: price,
      email,
      description: `${clinic.name} · ${name} · ${date}`,
      successPath: "/Summer27/juniors",
      bookingId: id,
      metadata: { type: "junior", clinicId: clinic.id },
    });
    setPaying(false);
    if (checkout.url) window.location.href = checkout.url;
    else setMsg(checkout.error || "Checkout failed.");
  }

  if (!clinic) return null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Juniors</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Junior hours</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        Two small weekly sessions on Court 2 — Saturday mornings for ages 8–12, and Wednesday afternoons for ages 10–14.
        Rally, movement, and the beginnings of match play. $50 members · $65 guests.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {juniors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={`rounded-2xl border p-5 text-left ${
              c.id === clinic.id ? "border-[#1a1a1a] bg-white" : "border-[#e8e5df] bg-[#faf9f7]"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{c.level}</p>
            <p className="mt-1 text-[17px] font-medium">{c.name}</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · max {c.capacity}
            </p>
            <p className="mt-2 text-[13px] text-[#4a4a4a]">{c.description}</p>
          </button>
        ))}
      </div>

      <form onSubmit={signUp} className="mt-6 max-w-xl space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        <label className="block text-[12px] text-[#6b665e]">
          Date
          <select value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
            {dates.map((d) => (
              <option key={d} value={d}>
                {parseDateInput(d).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </option>
            ))}
          </select>
        </label>
        <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Junior’s name" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
        {!isMember && (
          <input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="Parent email" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
        )}
        <p className="text-[12px] text-[#8a8477]">
          {roster.length}/{clinic.capacity} signed up · ${price} {isMember ? "member" : "guest"}
        </p>
        {roster.length > 0 && (
          <ul className="text-[13px] text-[#4a4a4a]">
            {roster.map((b) => (
              <li key={b.id}>{b.clientName}</li>
            ))}
          </ul>
        )}
        {msg && <p className="text-[13px]">{msg}</p>}
        <button disabled={paying || seatsLeft <= 0} className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white disabled:opacity-40">
          {seatsLeft <= 0 ? "Full" : `Enroll · $${price}`}
        </button>
      </form>
    </main>
  );
}
