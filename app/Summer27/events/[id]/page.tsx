"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useS27Session } from "../../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../../payments";
import { PayChooser } from "../../PayChooser";
import { eventDateRangeLabel, parseDateInput, s27Events, type EventDef } from "../../summer27-data";
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
    if (!isMember || !session) {
      setMsg("Sign in as a member to reserve.");
      return;
    }
    if (!savedCard) {
      setMsg("Add a card on file in My Account to reserve.");
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
      attendeeName: session.memberName,
      attendeeEmail: session.memberEmail,
      guestCount,
      memberNumber: session.memberNumber,
      amount: total,
      paymentStatus: "paid",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    setPaying(true);
    const result = await startMemberPayment({
      method,
      amount: total,
      email: session.memberEmail,
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

    const next = [...bookings, booking];
    saveList(KEYS.events, next);
    setBookings(next);
    setPaying(false);
    setMsg(`Reserved. $${total} charged.`);
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

  const theme = event.theme || s27Events[0].theme;
  const d = parseDateInput(event.date);
  const dateBadge = {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: String(d.getDate()),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
  };

  return (
    <main className="pb-10">
      <div className="relative overflow-hidden" style={{ background: theme.wash }}>
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.image} alt="" className="h-full w-full object-cover opacity-55" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(105deg, ${theme.wash}f2 12%, ${theme.wash}88 55%, ${theme.wash}55 100%)`,
            }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
          <Link href="/Summer27/events" className="text-[12px] text-white/75 hover:text-white">
            ← Events
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 max-w-2xl text-white">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{event.category}</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-4xl">{event.title}</h2>
              <p className="mt-3 text-[14px] text-white/85 sm:text-[15px]">
                {eventDateRangeLabel(event)} · {event.timeLabel}
              </p>
              <p className="mt-2 text-[13px] text-white/70">Courts 3 &amp; 4 · Clubhouse</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{dateBadge.month}</p>
              <p className="text-[32px] font-semibold leading-none text-[#1a1a1a]">{dateBadge.day}</p>
              <p className="mt-1 text-[12px] text-[#6b665e]">{dateBadge.weekday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-5 px-4 pt-6 sm:px-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-5 sm:p-6">
            <p className="text-[15px] leading-relaxed text-[#4a4a4a]">{event.description}</p>
            {event.highlights?.length ? (
              <ul className="mt-5 space-y-2">
                {event.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-[#4a4a4a]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: theme.accent }} />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5" style={{ background: theme.soft }}>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Signed up</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              {taken}/{event.capacity} · {seatsLeft} open
            </p>
            {paid.length > 0 ? (
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {paid.map((b) => (
                  <li key={b.id} className="text-[13px] text-[#4a4a4a]">
                    {b.attendeeName}
                    {b.guestCount > 1 ? ` +${b.guestCount - 1}` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-[#8a8477]">Be the first on the list.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e8e5df] bg-white p-5 lg:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve</p>
          <p className="mt-1 text-[14px] font-medium text-[#1a1a1a]">
            ${per} {isMember ? "member" : "guest"} · each
          </p>
          <div className="mt-4 space-y-3">
            {!isMember && (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                />
              </>
            )}
            <label className="block text-[12px] text-[#6b665e]">
              Players
              <select
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {msg && <p className="text-[13px] text-[#4a4a4a]">{msg}</p>}
            {seatsLeft <= 0 ? (
              <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">Sold out</p>
            ) : (
              <PayChooser amount={total} savedCard={savedCard} paying={paying} primaryLabel="Reserve" onPay={reserve} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
