"use client";

import { useEffect, useMemo, useState } from "react";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

type Court = {
  id: string;
  name: string;
  type: "indoor" | "outdoor";
};

type Booking = {
  id: string;
  date: string;
  hour: number;
  courtId: string;
  courtName: string;
  type: "indoor" | "outdoor";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  isMember: boolean;
  memberCode?: string;
  amount: number;
  paymentStatus?: "pending" | "paid";
  paymentMethod?: "stripe" | "venmo" | "paypal" | "manual";
  createdAt: string;
};

const STORAGE_KEY = "rtc_court_bookings_v1";

const courts: Court[] = [
  { id: "indoor-1", name: "Indoor Court", type: "indoor" },
  { id: "outdoor-1", name: "Court 1", type: "outdoor" },
  { id: "outdoor-2", name: "Court 2", type: "outdoor" },
  { id: "outdoor-3", name: "Court 3", type: "outdoor" },
  { id: "outdoor-4", name: "Court 4", type: "outdoor" },
  { id: "outdoor-5", name: "Court 5", type: "outdoor" },
];

const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM - 9 PM

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHour(hour: number): string {
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function getRate(type: "indoor" | "outdoor", isMember: boolean): number {
  if (type === "indoor") return isMember ? 62 : 74;
  return isMember ? 44 : 58;
}

function bookingKey(date: string, courtId: string, hour: number): string {
  return `${date}|${courtId}|${hour}`;
}

export default function RTCBookPage() {
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [memberView, setMemberView] = useState(false);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [activeCourt, setActiveCourt] = useState<Court | null>(null);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    isMember: false,
    memberCode: "",
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isCreatingStripe, setIsCreatingStripe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Booking>;
      setBookings(parsed);
    } catch {
      // Ignore corrupted local storage data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const bookingId = params.get("bookingId");
    if (!payment) return;

    if (bookingId && payment === "success") {
      const next = { ...bookings };
      let updated = false;
      for (const key of Object.keys(next)) {
        if (next[key].id === bookingId) {
          next[key] = {
            ...next[key],
            paymentStatus: "paid",
            paymentMethod: "stripe",
          };
          updated = true;
          break;
        }
      }
      if (updated) {
        persist(next);
      }
      setStatusMsg("Payment successful. Your court booking is confirmed.");
    } else if (payment === "cancelled") {
      setStatusMsg("Stripe checkout cancelled. Your reservation remains pending.");
    }

    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  function persist(next: Record<string, Booking>) {
    setBookings(next);
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const activeAmount = useMemo(() => {
    if (!activeCourt) return 0;
    return getRate(activeCourt.type, form.isMember);
  }, [activeCourt, form.isMember]);

  function openBooking(court: Court, hour: number) {
    setActiveCourt(court);
    setActiveHour(hour);
    setForm((prev) => ({ ...prev, isMember: memberView }));
    setStatusMsg(null);
  }

  function closeBooking() {
    setActiveCourt(null);
    setActiveHour(null);
    setStatusMsg(null);
  }

  function saveBooking() {
    if (!activeCourt || activeHour === null) return null;
    if (!form.name.trim() || !form.email.trim()) {
      setStatusMsg("Name and email are required.");
      return null;
    }
    const id = `rtc-booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const amount = getRate(activeCourt.type, form.isMember);
    const booking: Booking = {
      id,
      date: selectedDate,
      hour: activeHour,
      courtId: activeCourt.id,
      courtName: activeCourt.name,
      type: activeCourt.type,
      clientName: form.name.trim(),
      clientEmail: form.email.trim(),
      clientPhone: form.phone.trim(),
      isMember: form.isMember,
      memberCode: form.isMember ? form.memberCode.trim() : "",
      amount,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: new Date().toISOString(),
    };
    const key = bookingKey(booking.date, booking.courtId, booking.hour);
    const next = { ...bookings, [key]: booking };
    persist(next);
    return booking;
  }

  async function handleReserveOnly() {
    const booking = saveBooking();
    if (!booking) return;
    setStatusMsg("Court reserved. You can complete payment now.");
  }

  function buildVenmoUrl(booking: Booking): string {
    const note = `${booking.courtName} - ${booking.date} at ${formatHour(booking.hour)}`;
    return `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(
      PAYMENT_CONFIG.venmoHandle.replace(/^@/, "")
    )}&amount=${booking.amount}&note=${encodeURIComponent(note)}`;
  }

  function buildPaypalUrl(booking: Booking): string {
    if (PAYMENT_CONFIG.paypalMeUsername) {
      return `https://www.paypal.me/${PAYMENT_CONFIG.paypalMeUsername}/${booking.amount.toFixed(2)}`;
    }
    return `https://www.paypal.com/paypalme/${encodeURIComponent(
      PAYMENT_CONFIG.paypalEmail
    )}/${booking.amount.toFixed(2)}`;
  }

  async function handleStripeCheckout() {
    if (!activeCourt || activeHour === null) return;
    const booking = saveBooking();
    if (!booking) return;

    try {
      setIsCreatingStripe(true);
      const res = await fetch("/api/rtc/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: booking.amount,
          clientEmail: booking.clientEmail,
          bookingId: booking.id,
          description: `${booking.courtName} court booking on ${booking.date} at ${formatHour(
            booking.hour
          )}`,
          metadata: {
            bookingId: booking.id,
            court: booking.courtName,
            date: booking.date,
            hour: String(booking.hour),
            member: booking.isMember ? "yes" : "no",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Stripe checkout failed.");
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setStatusMsg(err?.message || "Unable to open Stripe checkout.");
    } finally {
      setIsCreatingStripe(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Court Booking</h2>
            <p className="mt-1 text-[14px] text-[#6b665e]">
              Full-day schedule for all courts. Tap any open cell to reserve and pay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[12px] font-medium text-[#6b665e]">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
            />
            <button
              type="button"
              onClick={() => setMemberView((v) => !v)}
              className={`rounded-lg border px-3 py-2 text-[12px] font-medium ${
                memberView
                  ? "border-[#2d5016] bg-[#f4faf1] text-[#2d5016]"
                  : "border-[#d9d5cf] text-[#6b665e]"
              }`}
            >
              {memberView ? "Member View On" : "Member View Off"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Public Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$74/hr</strong> · Outdoor: <strong>$58/hr</strong></p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Pricing</p>
            <p className="mt-2 text-[14px]">Indoor: <strong>$62/hr</strong> · Outdoor: <strong>$44/hr</strong></p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-[#ece8e2]">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr className="bg-[#faf9f7]">
                <th className="sticky left-0 z-10 border-b border-r border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-left text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                  Time
                </th>
                {courts.map((court) => (
                  <th
                    key={court.id}
                    className="border-b border-[#ece8e2] px-3 py-2 text-left text-[11px] uppercase tracking-[0.12em] text-[#8a8477]"
                  >
                    {court.name}
                    <span className="ml-1 text-[10px] normal-case tracking-normal text-[#a39e95]">
                      ({court.type})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="sticky left-0 z-10 border-r border-t border-[#f0ede8] bg-white px-3 py-2 text-[12px] font-medium text-[#6b665e]">
                    {formatHour(hour)}
                  </td>
                  {courts.map((court) => {
                    const key = bookingKey(selectedDate, court.id, hour);
                    const existing = bookings[key];
                    return (
                      <td key={key} className="border-t border-[#f0ede8] p-1.5 align-top">
                        {existing ? (
                          <div className="rounded-lg border border-[#f0d9d9] bg-[#fff6f6] px-2 py-2 text-[11px]">
                            <p className="font-medium text-[#7f1d1d]">Booked</p>
                            <p className="mt-0.5 truncate text-[#7a756d]">{existing.clientName}</p>
                            <p className="text-[#a39e95]">${existing.amount}</p>
                            <p className="text-[#a39e95]">
                              {existing.paymentStatus === "paid"
                                ? "Paid"
                                : "Payment pending"}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBooking(court, hour)}
                            className="w-full rounded-lg border border-[#d9d5cf] px-2 py-2 text-[11px] font-medium text-[#1a1a1a] hover:bg-[#faf9f7]"
                          >
                            Book
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
      </div>

      {activeCourt && activeHour !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e8e5df] bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve Court</p>
                <h3 className="mt-1 text-xl font-semibold">{activeCourt.name}</h3>
                <p className="mt-1 text-[13px] text-[#6b665e]">
                  {selectedDate} · {formatHour(activeHour)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBooking}
                className="rounded-md border border-[#d9d5cf] px-2 py-1 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              />
              <label className="mt-1 flex items-center gap-2 text-[12px] text-[#4a4a4a]">
                <input
                  type="checkbox"
                  checked={form.isMember}
                  onChange={(e) => setForm((f) => ({ ...f, isMember: e.target.checked }))}
                />
                I am an RTC member
              </label>
              {form.isMember && (
                <input
                  placeholder="Member code"
                  value={form.memberCode}
                  onChange={(e) => setForm((f) => ({ ...f, memberCode: e.target.value }))}
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                />
              )}
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              Rate: <strong>${activeAmount}</strong> ({form.isMember ? "member" : "public"})
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleReserveOnly}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Reserve Without Paying
              </button>
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={isCreatingStripe}
                className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c] disabled:opacity-60"
              >
                {isCreatingStripe ? "Opening Stripe..." : "Pay with Card (Stripe)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = saveBooking();
                  if (!booking) return;
                  const key = bookingKey(booking.date, booking.courtId, booking.hour);
                  persist({
                    ...bookings,
                    [key]: {
                      ...booking,
                      paymentMethod: "venmo",
                    },
                  });
                  window.open(buildVenmoUrl(booking), "_blank");
                  setStatusMsg("Venmo opened in a new tab.");
                }}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Pay with Venmo
              </button>
              <button
                type="button"
                onClick={() => {
                  const booking = saveBooking();
                  if (!booking) return;
                  const key = bookingKey(booking.date, booking.courtId, booking.hour);
                  persist({
                    ...bookings,
                    [key]: {
                      ...booking,
                      paymentMethod: "paypal",
                    },
                  });
                  window.open(buildPaypalUrl(booking), "_blank");
                  setStatusMsg("PayPal opened in a new tab.");
                }}
                className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
              >
                Pay with PayPal
              </button>
            </div>

            {statusMsg && <p className="mt-3 text-[12px] text-[#2d5016]">{statusMsg}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
