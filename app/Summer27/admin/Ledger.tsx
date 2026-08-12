"use client";

import { useMemo, useState } from "react";
import { formatPrettyDate, lessonProLabel } from "../summer27-data";
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
type Range = "today" | "week" | "month" | "all";
type PayFilter = "all" | "owed" | "paid";

type Row = {
  id: string;
  kind: Exclude<Kind, "all">;
  date: string;
  name: string;
  label: string;
  amount: number;
  status: "paid" | "pending";
  onToggle: () => void;
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

function inRange(date: string, today: string, range: Range) {
  if (range === "all") return true;
  if (range === "today") return date === today;
  const t = new Date(`${today}T12:00:00`);
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  if (range === "week") {
    const start = new Date(t);
    start.setDate(t.getDate() - 6);
    return d >= start && d <= t;
  }
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

export default function Ledger({
  today,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  charges,
  onCourts,
  onClinics,
  onLessons,
  onEvents,
  onStringing,
  onCharges,
}: Props) {
  const [range, setRange] = useState<Range>("week");
  const [kind, setKind] = useState<Kind>("all");
  const [pay, setPay] = useState<PayFilter>("all");
  const [query, setQuery] = useState("");

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
        onToggle: () =>
          onCourts(courts.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
      ...clinics.map((b) => ({
        id: b.id,
        kind: "clinic" as const,
        date: b.date,
        name: b.clientName,
        label: b.clinicName,
        amount: b.amount,
        status: b.paymentStatus,
        onToggle: () =>
          onClinics(clinics.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
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
          onToggle: () =>
            onLessons(lessons.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
        })),
      ...events.map((b) => ({
        id: b.id,
        kind: "event" as const,
        date: b.eventDate,
        name: b.attendeeName,
        label: `${b.eventTitle} ×${b.guestCount}`,
        amount: b.amount,
        status: b.paymentStatus,
        onToggle: () =>
          onEvents(events.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
      ...stringing.map((b) => ({
        id: b.id,
        kind: "stringing" as const,
        date: b.pickupDate || b.createdAt.slice(0, 10),
        name: b.clientName,
        label: b.racket,
        amount: b.amount,
        status: b.paymentStatus,
        onToggle: () =>
          onStringing(stringing.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
      ...charges.map((b) => ({
        id: b.id,
        kind: "charge" as const,
        date: b.date,
        name: b.clientName,
        label: b.description,
        amount: b.amount,
        status: b.paymentStatus,
        onToggle: () =>
          onCharges(charges.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
    ];
    const q = query.trim().toLowerCase();
    return all
      .filter((row) => inRange(row.date, today, range))
      .filter((row) => kind === "all" || row.kind === kind)
      .filter((row) => {
        if (pay === "owed") return row.status === "pending";
        if (pay === "paid") return row.status === "paid";
        return true;
      })
      .filter((row) => !q || `${row.name} ${row.label}`.toLowerCase().includes(q))
      .sort((a, b) => `${b.date}${b.name}`.localeCompare(`${a.date}${a.name}`));
  }, [
    courts,
    clinics,
    lessons,
    events,
    stringing,
    charges,
    today,
    range,
    kind,
    pay,
    query,
    onCourts,
    onClinics,
    onLessons,
    onEvents,
    onStringing,
    onCharges,
  ]);

  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const owed = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

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
      owed: items.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0),
    }));
  }, [rows]);

  return (
    <div className="mt-4 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Finances</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">What came in, what’s still owed — tap to mark paid.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-4">
          <p className="text-[12px] font-medium text-[#6b665e]">Paid</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{money(paid)}</p>
        </div>
        <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-4">
          <p className="text-[12px] font-medium text-[#6b665e]">Still owed</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{money(owed)}</p>
          {owed > 0 ? (
            <button
              type="button"
              onClick={() => setPay("owed")}
              className="mt-2 text-[12px] font-medium text-[#b45309] underline-offset-2 hover:underline"
            >
              Show unpaid only
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={range}
            onChange={(v) => setRange(v as Range)}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "7 days" },
              { value: "month", label: "This month" },
              { value: "all", label: "All" },
            ]}
          />
        </div>
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={pay}
            onChange={(v) => setPay(v as PayFilter)}
            options={[
              { value: "all", label: "All" },
              { value: "owed", label: "Unpaid" },
              { value: "paid", label: "Paid" },
            ]}
          />
        </div>
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
                <p className="text-[13px] tabular-nums text-[#6b665e]">
                  {money(group.total)}
                  {group.owed > 0 ? <span className="ml-2 text-[#b45309]">{money(group.owed)} owed</span> : null}
                </p>
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
                      <PaidPill status={row.status} onToggle={row.onToggle} />
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
