"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startStripeCheckout } from "../payments";
import {
  BOOKING_HOURS,
  COURTS,
  formatHour,
  formatDateInput,
  formatPrettyDate,
  parseDateInput,
  type CourtId,
} from "../summer27-data";
import { getLiveCourtRates, getProgramBlock } from "../schedule";
import {
  KEYS,
  courtBookingKey,
  loadRecord,
  saveRecord,
  type S27CourtBooking,
} from "../storage";

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function Summer27BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading courts…</div>}>
      <Summer27BookInner />
    </Suspense>
  );
}

function Summer27BookInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(() => formatDateInput(new Date()));
  const [bookings, setBookings] = useState<Record<string, S27CourtBooking>>({});
  const [duration, setDuration] = useState<1 | 2>(1);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const isMember = !!session;
  const rates = getLiveCourtRates();
  const rate = isMember ? rates.member : rates.guest;
  const savedCard = canOneClick(session);

  useEffect(() => {
    setBookings(loadRecord<S27CourtBooking>(KEYS.courts));
  }, []);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadRecord<S27CourtBooking>(KEYS.courts);
      for (const [key, b] of Object.entries(all)) {
        if (b.id === bookingId) all[key] = { ...b, paymentStatus: "paid", paymentMethod: "stripe" };
      }
      saveRecord(KEYS.courts, all);
      setBookings(all);
      setMsg("Court confirmed.");
    }
  }, [searchParams]);

  const weekDays = useMemo(() => {
    const start = parseDateInput(date);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i - start.getDay()));
  }, [date]);

  function occupancy(dateStr: string, courtId: CourtId, hour: number) {
    const program = getProgramBlock(dateStr, courtId, hour);
    if (program) return program;
    const existing = bookings[courtBookingKey(dateStr, courtId, hour)];
    if (existing?.paymentStatus === "paid" || existing?.paymentStatus === "pending") {
      return { type: "booked" as const, label: existing.clientName };
    }
    return null;
  }

  function canBook(dateStr: string, courtId: CourtId, hour: number) {
    for (let i = 0; i < duration; i++) {
      if (occupancy(dateStr, courtId, hour + i)) return false;
      if (!BOOKING_HOURS.includes(hour + i)) return false;
    }
    return true;
  }

  async function bookSlot(courtId: CourtId, hour: number) {
    const name = isMember ? session!.memberName : guestName.trim();
    const email = isMember ? session!.memberEmail : guestEmail.trim();
    const phone = isMember ? session!.memberPhone || "" : "";
    if (!name || !email) {
      setMsg(isMember ? "Please sign in again." : "Add your name and email.");
      return;
    }
    if (!canBook(date, courtId, hour)) {
      setMsg("That window is no longer open.");
      return;
    }

    const amount = rate * duration;
    const id = `court-${Date.now()}`;
    const courtName = COURTS.find((c) => c.id === courtId)?.name || courtId;
    const booking: S27CourtBooking = {
      id,
      date,
      hour,
      durationHours: duration,
      courtId,
      courtName,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      memberNumber: session?.memberNumber,
      amount,
      paymentStatus: "pending",
      paymentMethod: savedCard ? "saved-card" : "stripe",
      createdAt: new Date().toISOString(),
    };

    const next = { ...bookings };
    for (let i = 0; i < duration; i++) {
      next[courtBookingKey(date, courtId, hour + i)] = booking;
    }

    if (savedCard) {
      booking.paymentStatus = "paid";
      saveRecord(KEYS.courts, next);
      setBookings(next);
      setMsg(`Booked ${courtName} ${formatHour(hour)}. $${amount} charged.`);
      return;
    }

    setPaying(true);
    saveRecord(KEYS.courts, next);
    setBookings(next);
    const checkout = await startStripeCheckout({
      amount,
      email,
      description: `${courtName} · ${formatPrettyDate(date)} · ${formatHour(hour)} (${duration} hr)`,
      successPath: "/Summer27/book",
      bookingId: id,
      metadata: { type: "court", courtId, date, hour: String(hour) },
    });
    setPaying(false);
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }
    setMsg(checkout.error || "Could not start checkout. Try again.");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Courts</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Court 1 &amp; Court 2</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        ${rates.member}/hour members · ${rates.guest} guests. Court 1 is held weekday mornings and late afternoons for lessons.
      </p>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        For seasonal court options, contact{" "}
        <a href="mailto:difaziotennis@gmail.com" className="text-[#1a1a1a] underline-offset-2 hover:underline">
          difaziotennis@gmail.com
        </a>
        .
      </p>

      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#e8e5df] bg-white p-4">
        <label className="text-[12px] text-[#6b665e]">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
          />
        </label>
        <label className="text-[12px] text-[#6b665e]">
          Length
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as 1 | 2)}
            className="mt-1 block rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
          >
            <option value={1}>1 hour</option>
            <option value={2}>2 hours</option>
          </select>
        </label>
        {!isMember && (
          <>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Name" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </>
        )}
        <p className="text-[12px] text-[#6b665e]">
          {isMember ? `$${rate}/hour` : `$${rate}/hour guest`}
          {savedCard ? ` · ${savedCard.brand} •••• ${savedCard.last4}` : ""}
        </p>
        {!isMember && (
          <Link href="/Summer27/member" className="text-[12px] text-[#6b665e] underline">
            Join for member rates
          </Link>
        )}
      </div>

      {msg && (
        <p className="mt-3 rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px] text-[#4a4a4a]">{msg}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e8e5df] bg-white">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#ece8e2] bg-[#faf9f7]">
              <th className="px-3 py-2 font-medium text-[#8a8477]">Time</th>
              {COURTS.map((c) => (
                <th key={c.id} className="px-3 py-2 font-medium text-[#8a8477]">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BOOKING_HOURS.map((hour) => (
              <tr key={hour} className="border-b border-[#f0ede8]">
                <td className="whitespace-nowrap px-3 py-2 text-[#6b665e]">{formatHour(hour)}</td>
                {COURTS.map((court) => {
                  const occ = occupancy(date, court.id, hour);
                  const open = canBook(date, court.id, hour);
                  return (
                    <td key={court.id} className="px-2 py-1.5">
                      {occ ? (
                        occ.type === "clinic" ? (
                          <Link
                            href={`${occ.kind === "junior" ? "/Summer27/juniors" : "/Summer27/clinics"}?clinic=${encodeURIComponent(occ.clinicId)}&date=${date}`}
                            className="block rounded-md bg-[#eef3ea] px-2 py-1.5 text-[11px] text-[#3d5a2c] hover:bg-[#e4ecdf]"
                          >
                            {occ.label}
                          </Link>
                        ) : (
                        <span
                          className={`block rounded-md px-2 py-1.5 text-[11px] ${
                            occ.type === "lesson"
                              ? "bg-[#f4efe4] text-[#7a6230]"
                              : occ.type === "event"
                                ? "bg-[#ece8f5] text-[#4a3d6b]"
                                : occ.type === "hold"
                                  ? "bg-[#f6eaea] text-[#7a3d3d]"
                                : "bg-[#f3eee8] text-[#6b665e]"
                          }`}
                        >
                          {occ.label}
                        </span>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={!open || paying}
                          onClick={() => bookSlot(court.id, hour)}
                          className="w-full rounded-md border border-[#e8e5df] bg-[#faf9f7] px-2 py-1.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-white disabled:opacity-40"
                        >
                          ${rate * duration}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#8a8477]">
        {weekDays.map((d) => {
          const key = formatDateInput(d);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setDate(key)}
              className={`rounded-full border px-3 py-1 ${
                key === date ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e8e5df] bg-white"
              }`}
            >
              {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </button>
          );
        })}
      </div>
    </main>
  );
}
