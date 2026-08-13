"use client";

import { useMemo, useState } from "react";
import { formatPrettyDate } from "../summer27-data";
import { refundStripePayment } from "../payments";
import type { S27AdminBlock } from "../schedule";
import type {
  S27Charge,
  S27ClinicBooking,
  S27CourtBooking,
  S27LessonBooking,
} from "../storage";

type Affected = {
  email: string;
  name: string;
  kind: string;
  label: string;
  amount: number;
  paymentIntentId?: string;
  bookingId: string;
};

type Props = {
  date: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  blocks: S27AdminBlock[];
  onApply: (result: {
    courts: S27CourtBooking[];
    clinics: S27ClinicBooking[];
    lessons: S27LessonBooking[];
    blocks: S27AdminBlock[];
    charges: S27Charge[];
    emailed: number;
    refunded: number;
  }) => void;
};

function uniqueCourts(list: S27CourtBooking[]) {
  const seen = new Set<string>();
  return list.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

export default function WeatherClosePanel({
  date,
  courts,
  clinics,
  lessons,
  blocks,
  onApply,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [includeCourts, setIncludeCourts] = useState(true);
  const [includeClinics, setIncludeClinics] = useState(true);
  const [includeLessons, setIncludeLessons] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const dayCourts = useMemo(
    () => uniqueCourts(courts.filter((b) => b.date === date && b.paymentStatus === "paid")),
    [courts, date]
  );
  const dayClinics = useMemo(
    () => clinics.filter((b) => b.date === date && b.paymentStatus === "paid"),
    [clinics, date]
  );
  const dayLessons = useMemo(
    () =>
      lessons.filter(
        (b) =>
          b.date === date &&
          b.paymentStatus === "paid" &&
          b.requestStatus !== "declined"
      ),
    [lessons, date]
  );

  const affected: Affected[] = useMemo(() => {
    const rows: Affected[] = [];
    if (includeCourts) {
      for (const b of dayCourts) {
        rows.push({
          email: b.clientEmail,
          name: b.clientName,
          kind: "court",
          label: `${b.courtName} · ${b.hour}:00`,
          amount: b.amount,
          paymentIntentId: b.paymentIntentId,
          bookingId: b.id,
        });
      }
    }
    if (includeClinics) {
      for (const b of dayClinics) {
        rows.push({
          email: b.clientEmail,
          name: b.clientName,
          kind: "clinic",
          label: b.clinicName,
          amount: b.amount,
          paymentIntentId: b.paymentIntentId,
          bookingId: b.id,
        });
      }
    }
    if (includeLessons) {
      for (const b of dayLessons) {
        rows.push({
          email: b.clientEmail,
          name: b.clientName,
          kind: "lesson",
          label: `Lesson · ${b.hour}:00`,
          amount: b.amount,
          paymentIntentId: b.paymentIntentId,
          bookingId: b.id,
        });
      }
    }
    return rows;
  }, [includeCourts, includeClinics, includeLessons, dayCourts, dayClinics, dayLessons]);

  const alreadyClosed = blocks.some(
    (b) => b.date === date && b.courtId === "both" && /weather/i.test(b.reason || "")
  );

  async function runClose() {
    if (!affected.length && alreadyClosed) {
      setMsg("Already marked closed for weather.");
      return;
    }
    setBusy(true);
    setMsg(null);

    const removeCourtIds = new Set(includeCourts ? dayCourts.map((b) => b.id) : []);
    const removeClinicIds = new Set(includeClinics ? dayClinics.map((b) => b.id) : []);
    const removeLessonIds = new Set(includeLessons ? dayLessons.map((b) => b.id) : []);

    let refunded = 0;
    for (const row of affected) {
      if (!row.paymentIntentId) continue;
      const result = await refundStripePayment({
        paymentIntentId: row.paymentIntentId,
        amount: row.amount,
      });
      if (result.ok) refunded += 1;
    }

    let emailed = 0;
    if (sendEmail) {
      const byEmail = new Map<string, Affected[]>();
      for (const row of affected) {
        const key = row.email.trim().toLowerCase();
        if (!key) continue;
        (byEmail.get(key) || byEmail.set(key, []).get(key)!).push(row);
      }
      for (const [email, rows] of byEmail) {
        const res = await fetch("/api/summer27/weather-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: rows[0].name,
            date,
            items: rows.map((r) => ({ kind: r.kind, label: r.label, amount: r.amount })),
          }),
        });
        if (res.ok) emailed += 1;
      }
    }

    const hold: S27AdminBlock = {
      id: `weather-${date}`,
      date,
      courtId: "both",
      startHour: 7,
      durationHours: 14,
      reason: "Weather — courts closed",
      createdAt: new Date().toISOString(),
      kind: "hold",
    };
    const nextBlocks = [
      ...blocks.filter((b) => !(b.date === date && /weather/i.test(b.reason || ""))),
      hold,
    ];

    const refundCharges: S27Charge[] = affected.map((row) => ({
      id: `weather-refund-${row.bookingId}`,
      date,
      description: `Weather refund · ${row.kind} · ${row.label}`,
      clientName: row.name,
      clientEmail: row.email,
      amount: -Math.abs(row.amount),
      paymentStatus: "paid",
      paymentMethod: row.paymentIntentId ? "stripe" : "manual",
      createdAt: new Date().toISOString(),
    }));

    onApply({
      courts: courts.filter((b) => !removeCourtIds.has(b.id)),
      clinics: clinics.filter((b) => !removeClinicIds.has(b.id)),
      lessons: lessons.filter((b) => !removeLessonIds.has(b.id)),
      blocks: nextBlocks,
      charges: refundCharges,
      emailed,
      refunded,
    });

    setBusy(false);
    setOpen(false);
    setMsg(
      `Closed ${formatPrettyDate(date)} for weather · ${affected.length} booking${affected.length === 1 ? "" : "s"} cleared · ${emailed} emailed · ${refunded} Stripe refund${refunded === 1 ? "" : "s"}.`
    );
  }

  return (
    <div className="rounded-2xl border border-[#ead9c2] bg-[#fbf6ee] px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Weather</p>
          <p className="mt-0.5 text-[14px] font-medium text-[#1a1a1a]">
            Close {formatPrettyDate(date)} for weather
          </p>
          <p className="mt-1 text-[12px] text-[#6b665e]">
            Holds both courts, clears paid court/clinic/lesson bookings, emails players, and refunds when a Stripe
            charge exists.
            {alreadyClosed ? " · Already closed." : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#faf9f7]"
        >
          {open ? "Hide" : "Rain out"}
        </button>
      </div>

      {msg && <p className="mt-3 text-[13px] text-[#4a4a4a]">{msg}</p>}

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#ead9c2]/80 pt-3">
          <div className="flex flex-wrap gap-4 text-[13px] text-[#4a4a4a]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeCourts} onChange={(e) => setIncludeCourts(e.target.checked)} />
              Courts ({dayCourts.length})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeClinics} onChange={(e) => setIncludeClinics(e.target.checked)} />
              Clinics ({dayClinics.length})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeLessons} onChange={(e) => setIncludeLessons(e.target.checked)} />
              Lessons ({dayLessons.length})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              Email players
            </label>
          </div>

          {affected.length === 0 ? (
            <p className="text-[13px] text-[#8a8477]">No paid bookings on this day for the selected types.</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px] text-[#6b665e]">
              {affected.map((row) => (
                <li key={row.bookingId}>
                  {row.name} · {row.kind} · {row.label} · ${row.amount}
                  {row.paymentIntentId ? " · Stripe" : ""}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={runClose}
            className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white disabled:opacity-40 sm:w-auto sm:px-5"
          >
            {busy ? "Closing…" : "Confirm rain out"}
          </button>
        </div>
      )}
    </div>
  );
}
