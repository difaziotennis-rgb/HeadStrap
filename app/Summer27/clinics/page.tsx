"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  KEYS,
  loadList,
  saveList,
  type S27ClinicBooking,
} from "../storage";

function nextDatesForClinic(clinic: ClinicDef | undefined, count = 6, extra?: string): string[] {
  const dates: string[] = [];
  if (!clinic || !Array.isArray(clinic.days)) return dates;
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

export default function Summer27ClinicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading clinics…</div>}>
      <Summer27ClinicsInner />
    </Suspense>
  );
}

function Summer27ClinicsInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const queryClinic = searchParams.get("clinic") || "";
  const queryDate = searchParams.get("date") || "";
  const [bookings, setBookings] = useState<S27ClinicBooking[]>([]);
  const [clinics, setClinics] = useState<ClinicDef[]>(s27Clinics.filter((c) => c.kind === "adult"));
  const [selectedId, setSelectedId] = useState(
    () =>
      (queryClinic && s27Clinics.some((c) => c.id === queryClinic && c.kind === "adult")
        ? queryClinic
        : s27Clinics.find((c) => c.kind === "adult")?.id) || ""
  );
  const [date, setDate] = useState(queryDate);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clinic = clinics.find((c) => c.id === selectedId) || clinics[0];
  const dates = useMemo(() => nextDatesForClinic(clinic, 6, queryDate), [clinic, queryDate]);
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const price = clinic ? (isMember ? clinic.memberPrice : clinic.guestPrice) : 0;

  useEffect(() => {
    try {
      const live = getLiveClinics().filter((c) => c.kind === "adult");
      if (live.length) {
        setClinics(live);
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
      setMsg("You’re on the roster.");
    }
  }, [searchParams]);

  const roster = useMemo(
    () =>
      !clinic
        ? []
        : bookings.filter(
            (b) => b.clinicId === clinic.id && b.date === date && b.paymentStatus === "paid"
          ),
    [bookings, clinic, date]
  );
  const seatsLeft = clinic ? Math.max(0, clinic.capacity - roster.length) : 0;
  const alreadyIn =
    !!session && roster.some((b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail);

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const name = isMember ? session!.memberName : guestName.trim();
    const email = isMember ? session!.memberEmail : guestEmail.trim();
    if (!name || !email) {
      setMsg("Name and email required.");
      return;
    }
    if (seatsLeft <= 0) {
      setMsg("This session is full.");
      return;
    }
    if (alreadyIn) {
      setMsg("You’re already on this roster.");
      return;
    }

    if (!clinic) return;
    const id = `clinic-${Date.now()}`;
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
      setMsg(`You’re in. $${price} charged.`);
      return;
    }

    const next = [...bookings, booking];
    saveList(KEYS.clinics, next);
    setBookings(next);
    setPaying(true);
    const checkout = await startStripeCheckout({
      amount: price,
      email,
      description: `${clinic.name} · ${date}`,
      successPath: "/Summer27/clinics",
      bookingId: id,
      metadata: { type: "clinic", clinicId: clinic.id, date },
    });
    setPaying(false);
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }
    setMsg(checkout.error || "Checkout failed.");
  }

  if (!clinic) return null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Weekly group play</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        Choose a level, then a date. One hour $50 · 90 minutes $80. Guests $65 / $100.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-5">
          {clinics
            .filter((c) => c.kind === "adult")
            .map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  c.id === clinic.id ? "border-[#1a1a1a] bg-white" : "border-[#e8e5df] bg-[#faf9f7]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{c.level}</p>
                <p className="mt-0.5 text-[15px] font-medium">{c.name}</p>
                <p className="text-[12px] text-[#6b665e]">
                  {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · ${c.memberPrice}
                </p>
              </button>
            ))}
          <Link href="/Summer27/juniors" className="block text-[12px] text-[#6b665e] hover:text-[#1a1a1a]">
            Junior hours →
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-7">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{clinic.level}</p>
          <h3 className="mt-1 text-lg font-medium">{clinic.name}</h3>
          <p className="mt-1 text-[13px] text-[#6b665e]">{clinic.description}</p>
          <p className="mt-2 text-[12px] text-[#8a8477]">
            {clinicDayLabel(clinic.days)} · {clinicTimeLabel(clinic)} · {clinic.capacity} max · ${clinic.memberPrice}
            {!isMember ? ` / $${clinic.guestPrice} guest` : ""}
          </p>

          <label className="mt-4 block text-[12px] text-[#6b665e]">
            Session date
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {parseDateInput(d).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="uppercase tracking-[0.12em] text-[#8a8477]">Signed up</span>
              <span className="text-[#6b665e]">
                {roster.length}/{clinic.capacity} · {seatsLeft} open
              </span>
            </div>
            {roster.length === 0 ? (
              <p className="mt-2 text-[13px] text-[#8a8477]">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {roster.map((b) => (
                  <li key={b.id} className="text-[13px] text-[#4a4a4a]">
                    {b.clientName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={signUp} className="mt-4 space-y-2">
            {!isMember && (
              <>
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
                <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
              </>
            )}
            {msg && <p className="text-[13px] text-[#4a4a4a]">{msg}</p>}
            <button
              type="submit"
              disabled={paying || seatsLeft <= 0}
              className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white disabled:opacity-40"
            >
              {seatsLeft <= 0 ? "Full" : `Join · $${price}`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
