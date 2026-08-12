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
import { DateChips, dateChipFromIso } from "../DateChips";

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

  const rosterByDate = useMemo(() => {
    const map: Record<string, S27ClinicBooking[]> = {};
    if (!clinic) return map;
    for (const b of bookings) {
      if (b.clinicId !== clinic.id || b.paymentStatus !== "paid") continue;
      (map[b.date] ||= []).push(b);
    }
    return map;
  }, [bookings, clinic]);

  const roster = rosterByDate[date] || [];
  const seatsLeft = clinic ? Math.max(0, clinic.capacity - roster.length) : 0;

  const dateChips = useMemo(
    () =>
      dates.map((d) => {
        const taken = (rosterByDate[d] || []).length;
        const open = clinic ? Math.max(0, clinic.capacity - taken) : 0;
        return dateChipFromIso(d, open <= 0 ? "Full" : `${open} open`);
      }),
    [dates, rosterByDate, clinic]
  );

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
    <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Juniors</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Junior hours</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6b665e]">
        Two small weekly sessions on Court 2 — Saturday mornings for ages 8–12, and Wednesday afternoons for ages 10–14.
        Rally, movement, and the beginnings of match play. $50 members · $65 guests.
      </p>

      <div className="mt-5 -mx-4 border-y border-[#ece8e2] bg-white px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border">
        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Session</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {juniors.map((c) => {
            const active = c.id === clinic.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className={`rounded-2xl border p-4 text-left ${
                  active ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e8e5df] bg-[#faf9f7]"
                }`}
              >
                <p className={`text-[10px] uppercase tracking-[0.12em] ${active ? "text-white/70" : "text-[#8a8477]"}`}>
                  {c.level}
                </p>
                <p className="mt-1 text-[15px] font-medium">{c.name}</p>
                <p className={`mt-1 text-[12px] ${active ? "text-white/75" : "text-[#6b665e]"}`}>
                  {clinicDayLabel(c.days)} · {clinicTimeLabel(c)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Date</p>
        <DateChips items={dateChips} value={date} onChange={setDate} ariaLabel="Junior dates" />
      </div>

      <form onSubmit={signUp} className="mt-5 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
        <p className="text-[13px] text-[#4a4a4a]">
          {date
            ? parseDateInput(date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })
            : ""}
          {" · "}
          {clinicTimeLabel(clinic)} · {roster.length}/{clinic.capacity} signed up
        </p>
        <p className="text-[13px] text-[#6b665e]">{clinic.description}</p>
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="Junior’s name"
          className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
        />
        {!isMember && (
          <input
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="Parent email"
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
          />
        )}
        {roster.length > 0 && (
          <ul className="rounded-xl bg-[#faf9f7] px-3 py-2 text-[13px] text-[#4a4a4a]">
            {roster.map((b) => (
              <li key={b.id}>{b.clientName}</li>
            ))}
          </ul>
        )}
        {msg && <p className="text-[13px]">{msg}</p>}
        <button
          disabled={paying || seatsLeft <= 0}
          className="hidden w-full rounded-xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40 sm:block"
        >
          {seatsLeft <= 0 ? "Full" : `Enroll · $${price}`}
        </button>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e8e5df] bg-[#faf9f7]/95 p-3 backdrop-blur sm:hidden">
        <button
          type="button"
          disabled={paying || seatsLeft <= 0}
          onClick={() => {
            const form = document.querySelector("main form");
            if (form instanceof HTMLFormElement) form.requestSubmit();
          }}
          className="w-full rounded-xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40"
        >
          {seatsLeft <= 0 ? "Full" : `Enroll · $${price}`}
        </button>
      </div>
    </main>
  );
}
