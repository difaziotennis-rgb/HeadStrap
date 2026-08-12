"use client";

import { useMemo, useState } from "react";
import {
  formatDateInput,
  formatPrettyDate,
  parseDateInput,
  type ClinicDef,
  type ProDef,
} from "../summer27-data";
import { bookingProId, lessonSpan } from "../lesson-slots";
import type {
  S27Charge,
  S27ClinicBooking,
  S27CourtBooking,
  S27EventBooking,
  S27LessonBooking,
  S27StringingOrder,
} from "../storage";
import { Segmented } from "../DateChips";

type Scope = "week" | "month";

type Props = {
  today: string;
  clinicsCatalog: ClinicDef[];
  pros: ProDef[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  charges: S27Charge[];
};

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function rangeForCursor(scope: Scope, cursor: Date): { start: string; end: string; label: string } {
  if (scope === "week") {
    const start = startOfWeekMonday(cursor);
    const end = addDays(start, 6);
    return {
      start: formatDateInput(start),
      end: formatDateInput(end),
      label: `${formatPrettyDate(formatDateInput(start))} – ${formatPrettyDate(formatDateInput(end))}`,
    };
  }
  const start = startOfMonth(cursor);
  const end = endOfMonth(cursor);
  return {
    start: formatDateInput(start),
    end: formatDateInput(end),
    label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function PeriodNav({
  label,
  isCurrent,
  currentLabel,
  onPrev,
  onNext,
  onCurrent,
}: {
  label: string;
  isCurrent: boolean;
  currentLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onCurrent: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8e5df] bg-white px-2 py-2">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-full border border-[#e8e5df] px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
        aria-label="Previous"
      >
        ←
      </button>
      <div className="min-w-0 text-center">
        <p className="text-[15px] font-medium tracking-tight text-[#1a1a1a]">{label}</p>
        {!isCurrent && (
          <button
            type="button"
            onClick={onCurrent}
            className="mt-0.5 text-[12px] text-[#8a8477] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
          >
            {currentLabel}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full border border-[#e8e5df] px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
        aria-label="Next"
      >
        →
      </button>
    </div>
  );
}

export default function AdminStats({
  today,
  clinicsCatalog,
  pros,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  charges,
}: Props) {
  const todayDate = useMemo(() => parseDateInput(today), [today]);
  const thisWeek = useMemo(() => startOfWeekMonday(todayDate), [todayDate]);
  const thisMonth = useMemo(() => startOfMonth(todayDate), [todayDate]);

  const [scope, setScope] = useState<Scope>("week");
  const [cursor, setCursor] = useState(thisWeek);

  const { start, end, label } = useMemo(() => rangeForCursor(scope, cursor), [scope, cursor]);
  const isCurrent =
    scope === "week"
      ? formatDateInput(startOfWeekMonday(cursor)) === formatDateInput(thisWeek)
      : formatDateInput(startOfMonth(cursor)) === formatDateInput(thisMonth);

  function setScopeAndReset(next: Scope) {
    setScope(next);
    setCursor(next === "week" ? thisWeek : thisMonth);
  }

  function step(delta: number) {
    setCursor((c) => (scope === "week" ? addDays(startOfWeekMonday(c), delta * 7) : addMonths(startOfMonth(c), delta)));
  }

  const summary = useMemo(() => {
    const courtRows = courts.filter((b) => inRange(b.date, start, end));
    const clinicRows = clinics.filter((b) => inRange(b.date, start, end));
    const lessonRows = lessons.filter(
      (b) =>
        inRange(b.date, start, end) &&
        b.requestStatus !== "declined" &&
        b.requestStatus !== "requested"
    );
    const eventRows = events.filter((b) => inRange(b.eventDate, start, end));
    const stringRows = stringing.filter((b) => inRange(b.pickupDate || b.createdAt.slice(0, 10), start, end));
    const chargeRows = charges.filter((b) => inRange(b.date, start, end));

    const buckets = [
      { key: "courts", label: "Courts", rows: courtRows },
      { key: "clinics", label: "Clinics", rows: clinicRows },
      { key: "lessons", label: "Lessons", rows: lessonRows },
      { key: "events", label: "Events", rows: eventRows },
      { key: "stringing", label: "Stringing", rows: stringRows },
      { key: "charges", label: "Shop / misc", rows: chargeRows },
    ].map((b) => {
      const paid = b.rows.filter((r) => r.paymentStatus === "paid").reduce((s, r) => s + r.amount, 0);
      return { ...b, count: b.rows.length, paid };
    });

    const paid = buckets.reduce((s, b) => s + b.paid, 0);
    const courtHours = courtRows.reduce((s, b) => s + (Number(b.durationHours) || 1), 0);
    const lessonHours = lessonRows.reduce((s, b) => s + lessonSpan(b.duration), 0);

    return { buckets, paid, courtHours, lessonHours, lessonCount: lessonRows.length };
  }, [courts, clinics, lessons, events, stringing, charges, start, end]);

  const clinicRanks = useMemo(() => {
    return clinicsCatalog
      .map((def) => {
        const signups = clinics.filter(
          (b) => b.clinicId === def.id && inRange(b.date, start, end) && b.paymentStatus === "paid"
        );
        return {
          id: def.id,
          name: def.name,
          signups: signups.length,
          revenue: signups.reduce((s, b) => s + b.amount, 0),
        };
      })
      .filter((r) => r.signups > 0)
      .sort((a, b) => b.signups - a.signups || b.revenue - a.revenue);
  }, [clinics, clinicsCatalog, start, end]);

  const proRanks = useMemo(() => {
    return pros
      .map((pro) => {
        const taught = lessons.filter(
          (b) =>
            bookingProId(b) === pro.id &&
            inRange(b.date, start, end) &&
            b.requestStatus !== "declined" &&
            b.requestStatus !== "requested"
        );
        return {
          id: pro.id,
          name: pro.name,
          lessons: taught.length,
          hours: taught.reduce((s, b) => s + lessonSpan(b.duration), 0),
          revenue: taught.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0),
        };
      })
      .filter((r) => r.lessons > 0)
      .sort((a, b) => b.lessons - a.lessons || b.revenue - a.revenue);
  }, [lessons, pros, start, end]);

  return (
    <div className="mt-4 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Stats</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">Flip through any past week or month.</p>
      </div>

      <div className="space-y-3">
        <Segmented
          value={scope}
          onChange={(v) => setScopeAndReset(v as Scope)}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
        <PeriodNav
          label={label}
          isCurrent={isCurrent}
          currentLabel={scope === "week" ? "This week" : "This month"}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onCurrent={() => setCursor(scope === "week" ? thisWeek : thisMonth)}
        />
      </div>

      <div className="sm:max-w-sm">
        <BigStat label="Brought in" value={money(summary.paid)} tone="good" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="border-b border-[#f0ede8] px-4 py-3">
          <p className="text-[15px] font-medium">By type</p>
          <p className="mt-0.5 text-[12px] text-[#6b665e]">
            {summary.courtHours}h courts · {summary.lessonCount} lessons ({summary.lessonHours}h)
          </p>
        </div>
        <ul className="divide-y divide-[#f0ede8]">
          {summary.buckets.map((b) => (
            <li key={b.key} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-[15px] font-medium">{b.label}</p>
                <p className="text-[12px] text-[#6b665e]">
                  {b.count === 0 ? "None" : `${b.count} booking${b.count === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-[15px] font-medium">{money(b.paid)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="border-b border-[#f0ede8] px-4 py-3">
          <p className="text-[15px] font-medium">Clinics</p>
          <p className="mt-0.5 text-[12px] text-[#6b665e]">Most popular this period</p>
        </div>
        {clinicRanks.length === 0 ? (
          <p className="px-4 py-5 text-[14px] text-[#8a8477]">No clinic signups yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0ede8]">
            {clinicRanks.map((row, i) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <p className="min-w-0 text-[15px]">
                  <span className="mr-2 text-[12px] text-[#8a8477]">{i + 1}.</span>
                  {row.name}
                  <span className="ml-2 text-[12px] text-[#6b665e]">
                    {row.signups} signup{row.signups === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="shrink-0 text-[15px] font-medium tabular-nums">{money(row.revenue)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="border-b border-[#f0ede8] px-4 py-3">
          <p className="text-[15px] font-medium">Pros</p>
          <p className="mt-0.5 text-[12px] text-[#6b665e]">Lessons taught this period</p>
        </div>
        {proRanks.length === 0 ? (
          <p className="px-4 py-5 text-[14px] text-[#8a8477]">No lessons yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0ede8]">
            {proRanks.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{row.name}</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {row.lessons} lesson{row.lessons === 1 ? "" : "s"} · {row.hours}h
                  </p>
                </div>
                <p className="shrink-0 text-[15px] font-medium tabular-nums">{money(row.revenue)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        tone === "good" ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fde68a] bg-[#fffbeb]"
      }`}
    >
      <p className="text-[12px] font-medium text-[#6b665e]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-[#1a1a1a]">{value}</p>
    </div>
  );
}
