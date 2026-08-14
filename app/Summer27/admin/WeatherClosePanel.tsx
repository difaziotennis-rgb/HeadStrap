"use client";

import { useMemo, useState } from "react";
import { formatPrettyDate } from "../summer27-data";
import type { S27AdminBlock } from "../schedule";
import type { S27Charge, S27ClinicBooking, S27CourtBooking, S27LessonBooking } from "../storage";
import { applyWeatherClose, weatherAffectedRows, weatherAlreadyClosed, type WeatherCloseResult } from "../weather-close";

type Props = {
  date: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  blocks: S27AdminBlock[];
  onApply: (result: WeatherCloseResult) => void;
};

export default function WeatherClosePanel({ date, courts, clinics, lessons, blocks, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [includeCourts, setIncludeCourts] = useState(true);
  const [includeClinics, setIncludeClinics] = useState(true);
  const [includeLessons, setIncludeLessons] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const affected = useMemo(
    () => weatherAffectedRows({ date, courts, clinics, lessons, includeCourts, includeClinics, includeLessons }),
    [date, courts, clinics, lessons, includeCourts, includeClinics, includeLessons]
  );

  const alreadyClosed = weatherAlreadyClosed(blocks, date);
  const courtCount = weatherAffectedRows({ date, courts, clinics, lessons, includeCourts: true, includeClinics: false, includeLessons: false }).length;
  const clinicCount = weatherAffectedRows({ date, courts, clinics, lessons, includeCourts: false, includeClinics: true, includeLessons: false }).length;
  const lessonCount = weatherAffectedRows({ date, courts, clinics, lessons, includeCourts: false, includeClinics: false, includeLessons: true }).length;

  async function runClose() {
    if (!affected.length && alreadyClosed) {
      setMsg("Already marked closed for weather.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await applyWeatherClose({
      date,
      courts,
      clinics,
      lessons,
      blocks,
      includeCourts,
      includeClinics,
      includeLessons,
      sendEmail,
    });
    onApply(result);
    setBusy(false);
    setOpen(false);
    setMsg(
      `Closed ${formatPrettyDate(date)} for weather · ${affected.length} booking${affected.length === 1 ? "" : "s"} cleared · ${result.emailed} emailed · ${result.refunded} Stripe refund${result.refunded === 1 ? "" : "s"}.`
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
              Courts ({courtCount})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeClinics} onChange={(e) => setIncludeClinics(e.target.checked)} />
              Clinics ({clinicCount})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeLessons} onChange={(e) => setIncludeLessons(e.target.checked)} />
              Lessons ({lessonCount})
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
