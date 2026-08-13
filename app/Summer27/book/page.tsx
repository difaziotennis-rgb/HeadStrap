"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useS27Session } from "../use-s27-session";
import { canOneClick, getPaymentProfile, startGuestCheckout, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { getSummer27StripeConfig } from "../stripe-config";
import { PayChooser } from "../PayChooser";
import { MemberPicker } from "../MemberPicker";
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
import { canChangeBooking, CANCEL_WINDOW_HOURS } from "../booking-policy";
import {
  KEYS,
  courtBookingKey,
  courtShareForMember,
  loadList,
  loadRecord,
  memberOnCourt,
  saveRecord,
  type S27CourtBooking,
  type S27CourtPlayer,
  type S27MemberAccount,
} from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";

type SplitMode = "solo" | "singles" | "doubles";

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
  const duration = 1;
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ courtId: CourtId; hour: number } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<S27CourtBooking | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>("solo");
  const [partners, setPartners] = useState<S27MemberAccount[]>([]);
  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const isMember = !!session;
  const rates = getLiveCourtRates();
  const rate = isMember ? rates.member : rates.guest;
  const savedCard = canOneClick(session);

  const partnerSlots = splitMode === "solo" ? 0 : splitMode === "singles" ? 1 : 3;
  const playerCount = 1 + partners.length;
  const shareEach = Math.round((rate * duration * 100) / Math.max(playerCount, 1)) / 100;

  useEffect(() => {
    setBookings(loadRecord<S27CourtBooking>(KEYS.courts));
    setMembers(loadList<S27MemberAccount>(KEYS.members));
    getSummer27StripeConfig().then((c) => setStripeReady(c.configured));
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
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => addDays(start, i));
  }, []);

  const dayChips = useMemo(
    () =>
      weekDays.map((d) => {
        const key = formatDateInput(d);
        return dateChipFromIso(key);
      }),
    [weekDays]
  );

  function isMine(booking: S27CourtBooking) {
    if (!session) return false;
    return memberOnCourt(booking, session.memberNumber, session.memberEmail);
  }

  function occupancy(dateStr: string, courtId: CourtId, hour: number) {
    const program = getProgramBlock(dateStr, courtId, hour);
    if (program) return program;
    const existing = bookings[courtBookingKey(dateStr, courtId, hour)];
    if (existing?.paymentStatus === "paid") {
      return { type: "booked" as const, label: existing.clientName, booking: existing };
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

  function buildPlayers(): S27CourtPlayer[] | undefined {
    if (!session || splitMode === "solo") return undefined;
    const total = rate * duration;
    const n = 1 + partners.length;
    const base = Math.round((total / n) * 100) / 100;
    const hostShare = Math.round((total - base * (n - 1)) * 100) / 100;
    return [
      {
        memberNumber: session.memberNumber,
        name: session.memberName,
        email: session.memberEmail,
        amount: hostShare,
      },
      ...partners.map((p) => ({
        memberNumber: p.memberNumber,
        name: p.name,
        email: p.email,
        amount: base,
      })),
    ];
  }

  async function bookSlot(courtId: CourtId, hour: number, method: S27PayMethod) {
    if (isMember && session) {
      if (!savedCard && method === "saved-card") {
        setMsg("Add a card on file in My Account to book.");
        return;
      }
      if (splitMode !== "solo" && partners.length !== partnerSlots) {
        setMsg(
          splitMode === "singles"
            ? "Pick one partner to split singles."
            : "Pick three partners to split doubles."
        );
        return;
      }
      for (const p of partners) {
        if (!getPaymentProfile(p.memberNumber)?.last4) {
          setMsg(`${p.name} needs a card on file to split.`);
          return;
        }
      }
    } else {
      if (!guestName.trim() || !guestEmail.trim()) {
        setMsg("Enter your name and email to book as a guest.");
        return;
      }
      if (splitMode !== "solo") {
        setMsg("Guest bookings are for a single player. Sign in to split.");
        return;
      }
    }

    if (!canBook(date, courtId, hour)) {
      setMsg("That window is no longer open.");
      return;
    }

    const total = rate * duration;
    const players = isMember ? buildPlayers() : undefined;
    const hostAmount = players?.[0]?.amount ?? total;
    const id = `court-${Date.now()}`;
    const courtName = COURTS.find((c) => c.id === courtId)?.name || courtId;
    const booking: S27CourtBooking = {
      id,
      date,
      hour,
      durationHours: duration,
      courtId,
      courtName,
      clientName: session?.memberName || guestName.trim(),
      clientEmail: session?.memberEmail || guestEmail.trim(),
      clientPhone: session?.memberPhone || "",
      memberNumber: session?.memberNumber,
      amount: total,
      paymentStatus: method === "checkout" && stripeReady ? "pending" : "paid",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
      players,
      format: splitMode,
    };

    const next = { ...bookings };
    for (let i = 0; i < duration; i++) {
      next[courtBookingKey(date, courtId, hour + i)] = booking;
    }

    setPaying(true);

    if (!isMember || method === "checkout") {
      const guestPay = await startGuestCheckout({
        amount: total,
        email: booking.clientEmail,
        name: booking.clientName,
        description: `${courtName} · ${formatPrettyDate(date)} · ${formatHour(hour)}`,
        successPath: "/Summer27/book",
        bookingId: id,
        metadata: { type: "court", courtId, date, hour: String(hour) },
      });
      if (guestPay.kind === "error") {
        setPaying(false);
        setMsg(guestPay.error);
        return;
      }
      if (guestPay.kind === "checkout") {
        saveRecord(KEYS.courts, next);
        setBookings(next);
        window.location.href = guestPay.url;
        return;
      }
      booking.paymentStatus = "paid";
      for (let i = 0; i < duration; i++) {
        next[courtBookingKey(date, courtId, hour + i)] = booking;
      }
      saveRecord(KEYS.courts, next);
      setBookings(next);
      setPaying(false);
      setPendingSlot(null);
      setMsg(`Booked ${courtName} ${formatHour(hour)} (demo). $${total}.`);
      return;
    }

    const result = await startMemberPayment({
      method,
      amount: hostAmount,
      email: session!.memberEmail,
      description: `${courtName} · ${formatPrettyDate(date)} · ${formatHour(hour)}`,
      successPath: "/Summer27/book",
      bookingId: id,
      metadata: { type: "court", courtId, date, hour: String(hour) },
      paymentProfile: savedCard,
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }
    if (result.kind === "checkout") {
      saveRecord(KEYS.courts, next);
      setBookings(next);
      window.location.href = result.url;
      return;
    }

    saveRecord(KEYS.courts, next);
    setBookings(next);
    setPendingSlot(null);
    setSplitMode("solo");
    setPartners([]);
    setPaying(false);
    if (players && players.length > 1) {
      setMsg(
        `Booked ${courtName} ${formatHour(hour)}. $${hostAmount} charged to you · partners billed their share.`
      );
    } else {
      setMsg(`Booked ${courtName} ${formatHour(hour)}. $${total} charged.`);
    }
  }

  function requestSlot(courtId: CourtId, hour: number) {
    setCancelTarget(null);
    setSplitMode("solo");
    setPartners([]);
    setPendingSlot({ courtId, hour });
    setMsg(null);
  }

  function cancelBooking(booking: S27CourtBooking) {
    if (!canChangeBooking(booking.date, booking.hour)) {
      setMsg(`Cancellations need at least ${CANCEL_WINDOW_HOURS} hours’ notice.`);
      setCancelTarget(null);
      return;
    }
    const next = { ...bookings };
    for (const [key, b] of Object.entries(next)) {
      if (b.id === booking.id) delete next[key];
    }
    saveRecord(KEYS.courts, next);
    setBookings(next);
    setCancelTarget(null);
    setMsg(`Cancelled ${booking.courtName} · ${formatHour(booking.hour)}.`);
  }

  function slotClass(type: string) {
    if (type === "clinic") return "bg-[#eef3ea] text-[#3d5a2c]";
    if (type === "lesson") return "bg-[#f4efe4] text-[#7a6230]";
    if (type === "event") return "bg-[#ece8f5] text-[#4a3d6b]";
    if (type === "hold") return "bg-[#f6eaea] text-[#7a3d3d]";
    if (type === "mine") return "bg-[#1a1a1a] text-white";
    return "bg-[#f3eee8] text-[#6b665e]";
  }

  function shortOccLabel(label: string, type: string) {
    if (type === "lesson") return "Lesson";
    if (type === "event") return "Event";
    if (type === "hold") return "Held";
    if (type === "mine") return "Yours";
    if (type === "booked") return lastNameFromFull(label) || "Booked";
    return (
      label
        .replace(/^Weekend\s+/i, "")
        .replace(/^Midweek\s+/i, "")
        .replace(/^Weeknight\s+/i, "")
        .replace(/\s+Clinic$/i, "")
        .replace(/\s+&\s+Drills$/i, "")
        .trim() || label
    );
  }

  function courtSlotName(booking: S27CourtBooking) {
    if (booking.players && booking.players.length > 1) {
      return booking.players
        .map((p) => lastNameFromFull(p.name))
        .filter(Boolean)
        .slice(0, 4)
        .join("/");
    }
    const name = booking.clientName.trim();
    if (!name) return "Booked";
    if (booking.memberNumber) return lastNameFromFull(name);
    return name.split(/\s+/).filter(Boolean)[0] || "Booked";
  }

  function lastNameFromFull(full: string) {
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    return parts.length > 1 ? parts[parts.length - 1] : parts[0];
  }

  function renderSlot(courtId: CourtId, hour: number) {
    const occ = occupancy(date, courtId, hour);
    const open = canBook(date, courtId, hour);
    if (occ) {
      if (occ.type === "clinic") {
        return (
          <Link
            href={`/Summer27/clinics?clinic=${encodeURIComponent(occ.clinicId)}&date=${date}`}
            className={`block truncate rounded-md px-1.5 py-2.5 text-center text-[11px] font-medium leading-tight sm:px-2 sm:py-2 sm:text-[11px] ${slotClass(occ.type)}`}
          >
            {shortOccLabel(occ.label, occ.type)}
          </Link>
        );
      }
      if (occ.type === "booked" && "booking" in occ && occ.booking && isMine(occ.booking)) {
        const mine = occ.booking;
        const cancellable = canChangeBooking(mine.date, mine.hour);
        return (
          <button
            type="button"
            onClick={() => {
              setPendingSlot(null);
              setCancelTarget(mine);
              setMsg(null);
            }}
            className={`w-full truncate rounded-md px-1.5 py-2.5 text-center text-[11px] font-medium leading-tight sm:px-2 sm:py-2 sm:text-[11px] ${slotClass("mine")}`}
            title={cancellable ? "Tap to cancel" : `Locked within ${CANCEL_WINDOW_HOURS} hours`}
          >
            {cancellable ? "Yours · Cancel" : "Yours"}
          </button>
        );
      }
      return (
        <span
          className={`block truncate rounded-md px-1.5 py-2.5 text-center text-[11px] leading-tight sm:px-2 sm:py-2 sm:text-[11px] ${slotClass(occ.type)}`}
          title={occ.type === "booked" && "booking" in occ && occ.booking ? occ.booking.clientName : occ.label}
        >
          {occ.type === "booked" && "booking" in occ && occ.booking
            ? courtSlotName(occ.booking)
            : shortOccLabel(occ.label, occ.type)}
        </span>
      );
    }
    return (
      <button
        type="button"
        disabled={!open || paying}
        onClick={() => requestSlot(courtId, hour)}
        className="w-full rounded-md border border-[#e8e5df] bg-[#faf9f7] px-1.5 py-2.5 text-[11px] font-medium text-[#1a1a1a] hover:bg-white disabled:opacity-35 sm:px-2 sm:py-2 sm:text-[11px]"
      >
        ${rate * duration}
      </button>
    );
  }

  const pendingCourtName = pendingSlot
    ? COURTS.find((c) => c.id === pendingSlot.courtId)?.name || pendingSlot.courtId
    : "";
  const cancelCancellable = cancelTarget ? canChangeBooking(cancelTarget.date, cancelTarget.hour) : false;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:max-w-6xl sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Courts</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Court 3 &amp; Court 4</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        ${rates.member}/hour members · ${rates.guest} guests. Court 3 may be held on weekdays for private lessons —
        open times show on the grid.
      </p>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#6b665e]">
        Seasonal options:{" "}
        <a href="mailto:difaziotennis@gmail.com" className="text-[#1a1a1a] underline-offset-2 hover:underline">
          difaziotennis@gmail.com
        </a>
      </p>
      {isMember && (
        <p className="mt-2 max-w-2xl text-[12px] text-[#8a8477]">
          Tap an open slot to confirm. Your bookings show as Yours — cancel anytime until {CANCEL_WINDOW_HOURS} hours
          before.
        </p>
      )}

      <div className="mt-5 -mx-4 border-y border-[#ece8e2] bg-white px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Day</p>
        </div>
        <DateChips items={dayChips} value={date} onChange={setDate} ariaLabel="Court dates" />
        <p className="mt-3 text-[13px] font-medium text-[#1a1a1a]">
          {parseDateInput(date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          <span className="font-normal text-[#8a8477]">
            {" · "}${rate}/hour
            {savedCard ? ` · ${savedCard.brand} •••• ${savedCard.last4}` : ""}
          </span>
        </p>
        {!isMember && (
          <div className="mt-3 rounded-xl border border-[#ead9c2] bg-[#fbf6ee] px-3 py-3 text-[13px] text-[#6b665e]">
            Guests can book and pay by card. Or{" "}
            <Link href="/Summer27/member" className="font-medium text-[#1a1a1a] underline-offset-2 hover:underline">
              join / sign in
            </Link>{" "}
            to save a card.
          </div>
        )}
        {isMember && !savedCard && (
          <div className="mt-3 rounded-xl border border-[#ead9c2] bg-[#fbf6ee] px-3 py-3 text-[13px] text-[#6b665e]">
            Add a card on file to book.{" "}
            <Link href="/Summer27/member/portal?tab=card" className="font-medium text-[#1a1a1a] underline-offset-2 hover:underline">
              My Account
            </Link>
          </div>
        )}
      </div>

      {msg && (
        <p className="mt-3 rounded-xl border border-[#e8e5df] bg-white px-3 py-2 text-[13px] text-[#4a4a4a]">{msg}</p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="grid grid-cols-[3.75rem_1fr_1fr] border-b border-[#ece8e2] bg-[#faf9f7] sm:grid-cols-[4.5rem_1fr_1fr]">
          <div className="px-2 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[#8a8477] sm:px-3 sm:text-[11px]">
            Time
          </div>
          {COURTS.map((c) => (
            <div
              key={c.id}
              className="border-l border-[#ece8e2] px-2 py-2.5 text-center text-[12px] font-semibold text-[#1a1a1a] sm:px-3 sm:text-[12px]"
            >
              {c.name}
            </div>
          ))}
        </div>
        {BOOKING_HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[3.75rem_1fr_1fr] border-b border-[#f0ede8] last:border-b-0 sm:grid-cols-[4.5rem_1fr_1fr]"
          >
            <div className="flex items-center px-2 py-2 text-[12px] text-[#6b665e] sm:px-3 sm:py-1.5 sm:text-[12px]">
              {formatHour(hour).replace(":00 ", " ")}
            </div>
            {COURTS.map((court) => (
              <div key={court.id} className="border-l border-[#f0ede8] p-1.5 sm:p-1.5">
                {renderSlot(court.id, hour)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {pendingSlot && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close booking confirmation"
            className="absolute inset-0 bg-[#1a1a1a]/30"
            onClick={() => setPendingSlot(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-4 py-3.5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">
                  Confirm booking
                </p>
                <p className="mt-1 text-[15px] font-medium text-[#1a1a1a]">
                  {pendingCourtName} · {formatHour(pendingSlot.hour)}
                </p>
                <p className="mt-0.5 text-[12px] text-[#6b665e]">
                  {formatPrettyDate(date)} · {duration} hour{duration === 1 ? "" : "s"} · ${rate * duration}
                </p>
              </div>
              <button type="button" onClick={() => setPendingSlot(null)} className="text-[12px] text-[#8a8477]">
                Close
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              {!isMember && (
                <div className="space-y-2">
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  />
                  <input
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Email for receipt"
                    type="email"
                    className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  />
                </div>
              )}

              {isMember && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Who’s playing</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "solo", label: "Just me" },
                      { id: "singles", label: "Split 2" },
                      { id: "doubles", label: "Split 4" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSplitMode(opt.id);
                        setPartners([]);
                      }}
                      className={`rounded-xl border px-2 py-2.5 text-[12px] font-medium ${
                        splitMode === opt.id
                          ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                          : "border-[#e8e5df] bg-[#faf9f7] text-[#4a4a4a]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {isMember && splitMode !== "solo" && session && (
                <div>
                  <p className="mb-2 text-[12px] text-[#6b665e]">
                    {splitMode === "singles"
                      ? "Add 1 partner — both cards charged equally."
                      : "Add 3 partners — all four cards charged equally."}
                  </p>
                  <MemberPicker
                    members={members}
                    exclude={[session.memberNumber]}
                    selected={partners}
                    onChange={setPartners}
                    max={partnerSlots}
                    placeholder="Search partner…"
                  />
                </div>
              )}

              <PayChooser
                amount={
                  splitMode === "solo" || partners.length !== partnerSlots
                    ? rate * duration
                    : Math.round((rate * duration - shareEach * partners.length) * 100) / 100
                }
                savedCard={savedCard}
                paying={paying}
                disabled={isMember && splitMode !== "solo" && partners.length !== partnerSlots}
                primaryLabel={splitMode === "solo" ? "Confirm" : "Confirm split"}
                allowGuestCheckout={!savedCard}
                stripeReady={stripeReady}
                onPay={(method) => bookSlot(pendingSlot.courtId, pendingSlot.hour, method)}
              />
              {splitMode !== "solo" && partners.length === partnerSlots && (
                <p className="text-center text-[11px] text-[#8a8477]">
                  Court ${rate * duration} · ~${shareEach} each
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close cancel confirmation"
            className="absolute inset-0 bg-[#1a1a1a]/30"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl">
            <div className="px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Your booking</p>
              <p className="mt-1 text-[15px] font-medium text-[#1a1a1a]">
                {cancelTarget.courtName} · {formatHour(cancelTarget.hour)}
              </p>
              <p className="mt-0.5 text-[12px] text-[#6b665e]">
                {formatPrettyDate(cancelTarget.date)} · {cancelTarget.durationHours} hour
                {cancelTarget.durationHours === 1 ? "" : "s"} · $
                {session
                  ? courtShareForMember(cancelTarget, session.memberNumber)
                  : cancelTarget.amount}
                {cancelTarget.players && cancelTarget.players.length > 1
                  ? ` · with ${cancelTarget.players
                      .filter((p) => p.memberNumber !== session?.memberNumber)
                      .map((p) => p.name.split(" ")[0])
                      .join(", ")}`
                  : ""}
              </p>
              {cancelCancellable ? (
                <>
                  <p className="mt-3 text-[13px] text-[#6b665e]">Cancel this court time?</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelTarget(null)}
                      className="rounded-2xl border border-[#e8e5df] bg-[#faf9f7] py-3 text-[14px] font-medium text-[#4a4a4a]"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelBooking(cancelTarget)}
                      className="rounded-2xl bg-[#991b1b] py-3 text-[14px] font-medium text-white"
                    >
                      Cancel booking
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-[13px] text-[#6b665e]">
                    Inside the {CANCEL_WINDOW_HOURS}-hour window — call the shop to change this.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCancelTarget(null)}
                    className="mt-4 w-full rounded-2xl border border-[#e8e5df] bg-[#faf9f7] py-3 text-[14px] font-medium text-[#4a4a4a]"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
