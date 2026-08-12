"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useS27Session } from "../../use-s27-session";
import { canOneClick, startStripeCheckout } from "../../payments";
import { formatPrettyDate } from "../../summer27-data";
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
  const event = getLiveEvents().find((e) => e.id === params.id);
  const [bookings, setBookings] = useState<S27EventBooking[]>([]);
  const [guestCount, setGuestCount] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setBookings(loadList<S27EventBooking>(KEYS.events));
  }, []);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27EventBooking>(KEYS.events).map((b) =>
        b.id === bookingId ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : b
      );
      saveList(KEYS.events, all);
      setBookings(all);
      setMsg("You’re in. Payment received.");
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

  async function reserve(e: React.FormEvent) {
    e.preventDefault();
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
      paymentMethod: savedCard ? "saved-card" : "stripe",
      createdAt: new Date().toISOString(),
    };
    if (savedCard) {
      booking.paymentStatus = "paid";
      const next = [...bookings, booking];
      saveList(KEYS.events, next);
      setBookings(next);
      setMsg(`Reserved. Charged $${total} to ${savedCard.brand} •••• ${savedCard.last4}.`);
      return;
    }
    const next = [...bookings, booking];
    saveList(KEYS.events, next);
    setBookings(next);
    setPaying(true);
    const checkout = await startStripeCheckout({
      amount: total,
      email: attendeeEmail,
      description: `${event.title} · ${guestCount} spot(s)`,
      successPath: `/Summer27/events/${event.id}`,
      bookingId: id,
      metadata: { type: "event", eventId: event.id },
    });
    setPaying(false);
    if (checkout.url) window.location.href = checkout.url;
    else setMsg(checkout.error || "Checkout failed.");
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
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-[#6b665e]">
        {event.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>

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

      <form onSubmit={reserve} className="mt-4 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        {!isMember && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </>
        )}
        <label className="block text-[12px] text-[#6b665e]">
          Spots (you + guests)
          <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
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
        <button disabled={paying || seatsLeft <= 0} className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white disabled:opacity-40">
          {seatsLeft <= 0 ? "Sold out" : savedCard ? `One-click · $${total}` : `Pay $${total} & reserve`}
        </button>
      </form>
    </main>
  );
}
