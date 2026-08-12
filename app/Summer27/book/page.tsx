"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { PayChooser } from "../PayChooser";
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
  loadRecord,
  saveRecord,
  type S27CourtBooking,
} from "../storage";
import { DateChips, dateChipFromIso, Segmented } from "../DateChips";

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
  const [pendingSlot, setPendingSlot] = useState<{ courtId: CourtId; hour: number } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<S27CourtBooking | null>(null);
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
    return (
      (!!booking.memberNumber && booking.memberNumber === session.memberNumber) ||
      booking.clientEmail.trim().toLowerCase() === session.memberEmail.trim().toLowerCase()
    );
  }

  function occupancy(dateStr: string, courtId: CourtId, hour: number) {
    const program = getProgramBlock(dateStr, courtId, hour);
    if (program) return program;
    const existing = bookings[courtBookingKey(dateStr, courtId, hour)];
    if (existing?.paymentStatus === "paid" || existing?.paymentStatus === "pending") {
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

  async function bookSlot(courtId: CourtId, hour: number, method: S27PayMethod) {
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
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    const next = { ...bookings };
    for (let i = 0; i < duration; i++) {
      next[courtBookingKey(date, courtId, hour + i)] = booking;
    }

    setPaying(true);
    const result = await startMemberPayment({
      method,
      amount,
      email,
      description: `${courtName} · ${formatPrettyDate(date)} · ${formatHour(hour)}`,
      successPath: "/Summer27/book",
      bookingId: id,
      metadata: { type: "court", courtId, date, hour: String(hour) },
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }

    if (result.kind === "saved-card") {
      booking.paymentStatus = "paid";
      booking.paymentMethod = "saved-card";
      saveRecord(KEYS.courts, next);
      setBookings(next);
      setPendingSlot(null);
      setPaying(false);
      setMsg(`Booked ${courtName} ${formatHour(hour)}. $${amount} charged.`);
      return;
    }

    saveRecord(KEYS.courts, next);
    setBookings(next);
    setPendingSlot(null);
    setPaying(false);

    if (result.kind === "redirect") {
      window.location.href = result.url;
      return;
    }

    setMsg(
      result.method === "venmo"
        ? `Court held for ${formatHour(hour)}. Finish in Venmo — we’ll confirm once it arrives.`
        : `Court held for ${formatHour(hour)}. Finish in PayPal — we’ll confirm once it arrives.`
    );
  }

  function requestSlot(courtId: CourtId, hour: number) {
    if (!isMember && (!guestName.trim() || !guestEmail.trim())) {
      setMsg("Add your name and email first.");
      return;
    }
    setCancelTarget(null);
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
    const name = booking.clientName.trim();
    if (!name) return "Booked";
    // Members: last name on the tee sheet. Guests: first name.
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
            href={`${occ.kind === "junior" ? "/Summer27/juniors" : "/Summer27/clinics"}?clinic=${encodeURIComponent(occ.clinicId)}&date=${date}`}
            className={`block truncate rounded-md px-1.5 py-2 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-[11px] ${slotClass(occ.type)}`}
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
            className={`w-full truncate rounded-md px-1.5 py-2 text-center text-[10px] font-medium leading-tight sm:px-2 sm:text-[11px] ${slotClass("mine")}`}
            title={cancellable ? "Tap to cancel" : `Locked within ${CANCEL_WINDOW_HOURS} hours`}
          >
            {cancellable ? "Yours · Cancel" : "Yours"}
          </button>
        );
      }
      return (
        <span
          className={`block truncate rounded-md px-1.5 py-2 text-center text-[10px] leading-tight sm:px-2 sm:text-[11px] ${slotClass(occ.type)}`}
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
        className="w-full rounded-md border border-[#e8e5df] bg-[#faf9f7] px-1.5 py-2 text-[10px] font-medium text-[#1a1a1a] hover:bg-white disabled:opacity-35 sm:px-2 sm:text-[11px]"
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
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Court 1 &amp; Court 2</h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
        ${rates.member}/hour members · ${rates.guest} guests. Court 1 may be held on weekdays for private lessons —
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Day</p>
          <Segmented
            value={String(duration)}
            onChange={(v) => setDuration(Number(v) as 1 | 2)}
            options={[
              { value: "1", label: "1 hour" },
              { value: "2", label: "2 hours" },
            ]}
          />
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
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Name"
              className="rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            />
            <input
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Email"
              className="rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            />
            <Link href="/Summer27/member" className="text-[12px] text-[#6b665e] underline sm:col-span-2">
              Join for member rates
            </Link>
          </div>
        )}
      </div>

      {msg && (
        <p className="mt-3 rounded-xl border border-[#e8e5df] bg-white px-3 py-2 text-[13px] text-[#4a4a4a]">{msg}</p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="grid grid-cols-[3.25rem_1fr_1fr] border-b border-[#ece8e2] bg-[#faf9f7] sm:grid-cols-[4.5rem_1fr_1fr]">
          <div className="px-2 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#8a8477] sm:px-3 sm:text-[11px]">
            Time
          </div>
          {COURTS.map((c) => (
            <div
              key={c.id}
              className="border-l border-[#ece8e2] px-2 py-2.5 text-center text-[11px] font-semibold text-[#1a1a1a] sm:px-3 sm:text-[12px]"
            >
              {c.name}
            </div>
          ))}
        </div>
        {BOOKING_HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[3.25rem_1fr_1fr] border-b border-[#f0ede8] last:border-b-0 sm:grid-cols-[4.5rem_1fr_1fr]"
          >
            <div className="flex items-center px-2 py-1.5 text-[11px] text-[#6b665e] sm:px-3 sm:text-[12px]">
              {formatHour(hour).replace(":00 ", " ")}
            </div>
            {COURTS.map((court) => (
              <div key={court.id} className="border-l border-[#f0ede8] p-1 sm:p-1.5">
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
                  {savedCard ? "Confirm booking" : "Pay to book"}
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
            <div className="px-4 py-4">
              {savedCard && (
                <p className="mb-3 text-[12px] leading-relaxed text-[#6b665e]">
                  Confirm to charge {savedCard.brand} •••• {savedCard.last4}. You can cancel from this page until{" "}
                  {CANCEL_WINDOW_HOURS} hours before start.
                </p>
              )}
              <PayChooser
                amount={rate * duration}
                savedCard={savedCard}
                paying={paying}
                primaryLabel="Confirm"
                onPay={(method) => bookSlot(pendingSlot.courtId, pendingSlot.hour, method)}
              />
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
                {cancelTarget.durationHours === 1 ? "" : "s"} · ${cancelTarget.amount}
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
