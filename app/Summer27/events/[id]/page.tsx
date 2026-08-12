"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useS27Session } from "../../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../../payments";
import { PayChooser } from "../../PayChooser";
import { formatPrettyDate, s27Events, type EventDef } from "../../summer27-data";
import { getLiveEvents } from "../../schedule";
import { KEYS, loadList, saveList, type S27EventBooking } from "../../storage";

export default function Summer27EventDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading event…</div>}>
      <Summer27EventDetailInner />
    </Suspense>
  );
}

function Summer27EventDetailInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const session = useS27Session();
  const [event, setEvent] = useState<EventDef | undefined>(() => s27Events.find((e) => e.id === params.id));
  const [bookings, setBookings] = useState<S27EventBooking[]>([]);
  const [guestCount, setGuestCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    try {
      const live = getLiveEvents().find((e) => e.id === params.id);
      if (live) setEvent(live);
    } catch {
      // keep default
    }
    setBookings(loadList<S27EventBooking>(KEYS.events));
  }, [params.id]);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27EventBooking>(KEYS.events).map((b) =>
        b.id === bookingId ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : b
      );
      saveList(KEYS.events, all);
      setBookings(all);
      setMsg("You’re in.");
    }
  }, [searchParams]);

  const paid = useMemo(
    () => bookings.filter((b) => b.eventId === event?.id && b.paymentStatus === "paid"),
    [bookings, event?.id]
  );
  const taken = paid.reduce((sum, b) => sum + b.guestCount, 0);
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const per = event ? (isMember ? event.memberPrice : event.guestPrice) : 0;
  const total = per * guestCount;
  const seatsLeft = event ? Math.max(0, event.capacity - taken) : 0;

  async function reserve(method: S27PayMethod) {
    if (!event) return;
    const attendeeName = isMember ? session!.memberName : name.trim();
    const attendeeEmail = isMember ? session!.memberEmail : email.trim();
    if (!attendeeName || !attendeeEmail) {
      setMsg("Name and email required.");
      return;
    }
    if (guestCount > seatsLeft) {
      setMsg("Not enough spots left.");
      return;
    }
    const id = `event-${Date.now()}`;
    const booking: S27EventBooking = {
      id,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      attendeeName,
      attendeeEmail,
      guestCount,
      memberNumber: session?.memberNumber,
      amount: total,
      paymentStatus: "pending",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    setPaying(true);
    const result = await startMemberPayment({
      method,
      amount: total,
      email: attendeeEmail,
      description: `${event.title} · ${guestCount} player(s)`,
      successPath: `/Summer27/events/${event.id}`,
      bookingId: id,
      metadata: { type: "event", eventId: event.id },
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }

    if (result.kind === "saved-card") {
      booking.paymentStatus = "paid";
      booking.paymentMethod = "saved-card";
      const next = [...bookings, booking];
      saveList(KEYS.events, next);
      setBookings(next);
      setPaying(false);
      setMsg(`Reserved. $${total} charged.`);
      return;
    }

    const next = [...bookings, booking];
    saveList(KEYS.events, next);
    setBookings(next);
    setPaying(false);

    if (result.kind === "redirect") {
      window.location.href = result.url;
      return;
    }

    setMsg(
      result.method === "venmo"
        ? "Reservation held. Finish in Venmo — we’ll confirm once it arrives."
        : "Reservation held. Finish in PayPal — we’ll confirm once it arrives."
    );
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p>Event not found.</p>
        <Link href="/Summer27/events" className="mt-3 inline-block text-[13px] underline">
          Back to events
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/Summer27/events" className="text-[12px] text-[#8a8477] hover:text-[#1a1a1a]">
        ← Events
      </Link>
      <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{event.category}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{event.title}</h2>
      <p className="mt-1 text-[14px] text-[#6b665e]">
        {formatPrettyDate(event.date)} · {event.timeLabel}
      </p>
      <p className="mt-3 text-[14px] text-[#4a4a4a]">{event.description}</p>

      <div className="mt-6 rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[12px] uppercase tracking-[0.12em] text-[#8a8477]">Signed up</p>
        <p className="mt-1 text-[13px] text-[#6b665e]">
          {taken}/{event.capacity} · {seatsLeft} open
        </p>
        {paid.length > 0 && (
          <ul className="mt-2 space-y-1 text-[13px]">
            {paid.map((b) => (
              <li key={b.id}>
                {b.attendeeName}
                {b.guestCount > 1 ? ` +${b.guestCount - 1}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        {!isMember && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]" />
          </>
        )}
        <label className="block text-[12px] text-[#6b665e]">
          Players
          <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]">
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[13px] text-[#6b665e]">
          ${per} each · total ${total}
        </p>
        {msg && <p className="text-[13px]">{msg}</p>}
        {seatsLeft <= 0 ? (
          <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">Sold out</p>
        ) : (
          <PayChooser amount={total} savedCard={savedCard} paying={paying} primaryLabel={`Reserve · $${total}`} onPay={reserve} />
        )}
      </div>
    </main>
  );
}
