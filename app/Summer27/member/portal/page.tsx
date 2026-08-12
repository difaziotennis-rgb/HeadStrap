"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useS27Session } from "../../use-s27-session";
import { getPaymentProfile } from "../../payments";
import MemberBookings from "../MemberBookings";
import {
  KEYS,
  loadList,
  loadRecord,
  saveList,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27PaymentProfile,
  type S27StringingOrder,
} from "../../storage";

export default function Summer27PortalPage() {
  const session = useS27Session();
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);
  const [payment, setPayment] = useState<S27PaymentProfile | null>(null);
  const [brand, setBrand] = useState<S27PaymentProfile["brand"]>("Visa");
  const [last4, setLast4] = useState("");
  const [oneClick, setOneClick] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!session) return;
    setCourts(
      uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setClinics(
      loadList<S27ClinicBooking>(KEYS.clinics).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setLessons(
      loadList<S27LessonBooking>(KEYS.lessons).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setEvents(
      loadList<S27EventBooking>(KEYS.events).filter(
        (b) => b.memberNumber === session.memberNumber || b.attendeeEmail === session.memberEmail
      )
    );
    setStringing(
      loadList<S27StringingOrder>(KEYS.stringing).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    const profile = getPaymentProfile(session.memberNumber);
    setPayment(profile);
    if (profile) {
      setBrand(profile.brand);
      setLast4(profile.last4);
      setOneClick(profile.oneClick);
    }
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  function saveCard(e: React.FormEvent) {
    e.preventDefault();
    if (!session || last4.trim().length !== 4) {
      setSavedMsg("Enter the last 4 digits of your card.");
      return;
    }
    const all = loadList<S27PaymentProfile>(KEYS.payment).filter((p) => p.memberNumber !== session.memberNumber);
    const next: S27PaymentProfile = {
      memberNumber: session.memberNumber,
      brand,
      last4: last4.trim(),
      expMonth: payment?.expMonth || "",
      expYear: payment?.expYear || "",
      billingZip: payment?.billingZip || "",
      oneClick,
    };
    saveList(KEYS.payment, [...all, next]);
    setPayment(next);
    setSavedMsg("Card saved for one-click booking.");
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h2 className="text-xl font-medium">Member dashboard</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">Sign in or join to see your courts, clinics, and events.</p>
        <Link href="/Summer27/member" className="mt-4 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-white">
          Join / sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">My account</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{session.memberName}</h2>
      <p className="mt-1 text-[13px] text-[#6b665e]">
        Member #{session.memberNumber} · {session.memberEmail}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Bookings</p>
          <MemberBookings
            courts={courts}
            clinics={clinics}
            lessons={lessons}
            events={events}
            stringing={stringing}
            onChange={reload}
          />
        </section>

        <section className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Saved card</p>
          {payment ? (
            <p className="mt-2 text-[13px] text-[#4a4a4a]">
              {payment.brand} •••• {payment.last4}
              {payment.oneClick ? " · one-click on" : ""}
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-[#8a8477]">No card on file yet.</p>
          )}
          <form onSubmit={saveCard} className="mt-3 space-y-2">
            <select value={brand} onChange={(e) => setBrand(e.target.value as S27PaymentProfile["brand"])} className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              <option>Visa</option>
              <option>Mastercard</option>
              <option>Amex</option>
            </select>
            <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Last 4" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={oneClick} onChange={(e) => setOneClick(e.target.checked)} />
              One-click booking
            </label>
            {savedMsg && <p className="text-[12px]">{savedMsg}</p>}
            <button className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[12px] font-medium text-white">Save card</button>
          </form>
        </section>
      </div>
    </main>
  );
}
