"use client";

import { useMemo, useState } from "react";
import { formatDateInput, formatPrettyDate, lessonProLabel, parseDateInput } from "../summer27-data";
import {
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27StringingOrder,
} from "../storage";
import { Segmented } from "../DateChips";
import { PaidPill, inputClass } from "./ui";

type Kind = "all" | "court" | "clinic" | "lesson" | "event" | "stringing" | "charge";
type Mode = "today" | "week" | "month" | "all";
type Row = {
  id: string;
  kind: Exclude<Kind, "all">;
  date: string;
  name: string;
  label: string;
  amount: number;
  status: "paid" | "pending";
};

type Props = {
  today: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  charges: S27Charge[];
  onCourts: (next: S27CourtBooking[]) => void;
  onClinics: (next: S27ClinicBooking[]) => void;
  onLessons: (next: S27LessonBooking[]) => void;
  onEvents: (next: S27EventBooking[]) => void;
  onStringing: (next: S27StringingOrder[]) => void;
  onCharges: (next: S27Charge[]) => void;
};

const KIND_LABEL: Record<Exclude<Kind, "all">, string> = {
  court: "Court",
  clinic: "Clinic",
  lesson: "Lesson",
  event: "Event",
  stringing: "Stringing",
  charge: "Shop",
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

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function windowFor(mode: Mode, today: string, cursor: Date): { start: string; end: string; label: string } | null {
  if (mode === "all") return null;
  if (mode === "today") {
    return { start: today, end: today, label: formatPrettyDate(today) };
  }
  if (mode === "week") {
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

export default function Ledger({
  today,
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

  const [mode, setMode] = useState<Mode>("week");
  const [cursor, setCursor] = useState(thisWeek);
  const [kind, setKind] = useState<Kind>("all");
  const [query, setQuery] = useState("");

  const window = useMemo(() => windowFor(mode, today, cursor), [mode, today, cursor]);
  const isCurrent =
    mode === "week"
      ? formatDateInput(startOfWeekMonday(cursor)) === formatDateInput(thisWeek)
      : mode === "month"
        ? formatDateInput(startOfMonth(cursor)) === formatDateInput(thisMonth)
        : true;

  function setModeAndReset(next: Mode) {
    setMode(next);
    if (next === "week") setCursor(thisWeek);
    if (next === "month") setCursor(thisMonth);
  }

  function step(delta: number) {
    if (mode === "week") setCursor((c) => addDays(startOfWeekMonday(c), delta * 7));
    if (mode === "month") setCursor((c) => addMonths(startOfMonth(c), delta));
  }

  const rows = useMemo(() => {
    const all: Row[] = [
      ...courts.map((b) => ({
        id: b.id,
        kind: "court" as const,
        date: b.date,
        name: b.clientName,
        label: b.courtName,
        amount: b.amount,
        status: b.paymentStatus,
      })),
      ...clinics.map((b) => ({
        id: b.id,
        kind: "clinic" as const,
        date: b.date,
        name: b.clientName,
        label: b.clinicName,
        amount: b.amount,
        status: b.paymentStatus,
      })),
      ...lessons
        .filter((b) => b.requestStatus !== "declined" && b.requestStatus !== "requested")
        .map((b) => ({
          id: b.id,
          kind: "lesson" as const,
          date: b.date,
          name: b.clientName,
          label: `${lessonProLabel(b)} · ${b.duration} min`,
          amount: b.amount,
          status: b.paymentStatus,
        })),
      ...events.map((b) => ({
        id: b.id,
        kind: "event" as const,
        date: b.eventDate,
        name: b.attendeeName,
        label: `${b.eventTitle} ×${b.guestCount}`,
        amount: b.amount,
        status: b.paymentStatus,
      })),
      ...stringing.map((b) => ({
        id: b.id,
        kind: "stringing" as const,
        date: b.pickupDate || b.createdAt.slice(0, 10),
        name: b.clientName,
        label: b.racket,
        amount: b.amount,
        status: b.paymentStatus,
      })),
      ...charges.map((b) => ({
        id: b.id,
        kind: "charge" as const,
        date: b.date,
        name: b.clientName,
        label: b.description,
        amount: b.amount,
        status: b.paymentStatus,
      })),
    ];
    const q = query.trim().toLowerCase();
    return all
      .filter((row) => {
        if (!window) return true;
        return row.date >= window.start && row.date <= window.end;
      })
      .filter((row) => kind === "all" || row.kind === kind)
      .filter((row) => !q || `${row.name} ${row.label}`.toLowerCase().includes(q))
      .sort((a, b) => `${b.date}${b.name}`.localeCompare(`${a.date}${a.name}`));
  }, [
    courts,
    clinics,
    lessons,
    events,
    stringing,
    charges,
    window,
    kind,
    query,
  ]);

  const paid = rows.reduce((s, r) => s + r.amount, 0);

  const byDate = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const list = map.get(row.date);
      if (list) list.push(row);
      else map.set(row.date, [row]);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      total: items.reduce((s, r) => s + r.amount, 0),
    }));
  }, [rows]);

  return (
    <div className="mt-4 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Finances</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">Everything is charged up front — flip through past weeks or months.</p>
      </div>

      <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4 sm:max-w-sm">
        <p className="text-[12px] font-medium text-[#6b665e]">Brought in</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{money(paid)}</p>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={mode}
            onChange={(v) => setModeAndReset(v as Mode)}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "all", label: "All" },
            ]}
          />
        </div>

        {(mode === "week" || mode === "month") && window && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8e5df] bg-white px-2 py-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="rounded-full border border-[#e8e5df] px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
              aria-label="Previous"
            >
              ←
            </button>
            <div className="min-w-0 text-center">
              <p className="text-[15px] font-medium tracking-tight text-[#1a1a1a]">{window.label}</p>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => setCursor(mode === "week" ? thisWeek : thisMonth)}
                  className="mt-0.5 text-[12px] text-[#8a8477] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
                >
                  {mode === "week" ? "This week" : "This month"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => step(1)}
              className="rounded-full border border-[#e8e5df] px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}

        {mode === "today" && window && (
          <p className="text-center text-[13px] text-[#6b665e]">{window.label}</p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            <option value="all">All types</option>
            <option value="court">Courts</option>
            <option value="clinic">Clinics</option>
            <option value="lesson">Lessons</option>
            <option value="event">Events</option>
            <option value="stringing">Stringing</option>
            <option value="charge">Shop / misc</option>
          </select>
          <input
            className={inputClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name…"
          />
        </div>
      </div>

      {byDate.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-8 text-center text-[14px] text-[#8a8477]">
          Nothing in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {byDate.map((group) => (
            <section key={group.date} className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
              <div className="flex items-baseline justify-between gap-3 border-b border-[#f0ede8] bg-[#faf9f7] px-4 py-2.5">
                <p className="text-[14px] font-medium">{formatPrettyDate(group.date)}</p>
                <p className="text-[13px] tabular-nums text-[#6b665e]">{money(group.total)}</p>
              </div>
              <ul className="divide-y divide-[#f0ede8]">
                {group.items.map((row) => (
                  <li
                    key={`${row.kind}-${row.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium leading-tight">{row.name}</p>
                      <p className="mt-0.5 text-[12px] text-[#6b665e]">
                        {KIND_LABEL[row.kind]} · {row.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium tabular-nums">{money(row.amount)}</span>
                      <PaidPill status={row.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
