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
import { PaidPill, inputClass } from "./ui";

type Kind = "all" | "court" | "clinic" | "lesson" | "event" | "stringing" | "charge";
type Range = "today" | "week" | "month" | "all";
type Status = "all" | "paid" | "pending";

type Row = {
  id: string;
  kind: Exclude<Kind, "all">;
  date: string;
  name: string;
  label: string;
  amount: number;
  status: "paid" | "pending";
  method: string;
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
  const [range, setRange] = useState<Range>("today");
  const [kind, setKind] = useState<Kind>("all");
  const [status, setStatus] = useState<Status>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const all: Row[] = [
      ...courts.map((b) => ({
        id: b.id,
        kind: "court" as const,
        date: b.date,
        name: b.clientName,
        label: `${b.courtName}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
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
        method: b.paymentMethod,
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
          method: b.paymentMethod,
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
        method: b.paymentMethod,
        onToggle: () =>
          onEvents(events.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
      ...stringing.map((b) => ({
        id: b.id,
        kind: "stringing" as const,
        date: b.pickupDate || b.createdAt.slice(0, 10),
        name: b.clientName,
        label: `Stringing · ${b.racket}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
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
        method: b.paymentMethod,
        onToggle: () =>
          onCharges(charges.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x))),
      })),
    ];
    const q = query.trim().toLowerCase();
    return all
      .filter((row) => inRange(row.date, today, range))
      .filter((row) => kind === "all" || row.kind === kind)
      .filter((row) => status === "all" || row.status === status)
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
    status,
    query,
    onCourts,
    onClinics,
    onLessons,
    onEvents,
    onStringing,
    onCharges,
  ]);

  const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <select className={inputClass} value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
          <option value="all">All records</option>
        </select>
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          <option value="all">All types</option>
          <option value="court">Courts</option>
          <option value="clinic">Clinics</option>
          <option value="lesson">Lessons</option>
          <option value="event">Events</option>
          <option value="stringing">Stringing</option>
          <option value="charge">Shop / misc</option>
        </select>
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="all">Paid + pending</option>
          <option value="paid">Paid only</option>
          <option value="pending">Pending only</option>
        </select>
        <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">In this view</p>
          <p className="mt-1 text-xl font-medium">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Paid</p>
          <p className="mt-1 text-xl font-medium">${paid}</p>
        </div>
        <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Pending</p>
          <p className="mt-1 text-xl font-medium">${pending}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {rows.length === 0 ? (
          <p className="p-4 text-[13px] text-[#8a8477]">No charges in this view.</p>
        ) : (
          rows.map((row) => (
            <div
              key={`${row.kind}-${row.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ede8] px-4 py-2.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-medium">
                  {row.name}
                  <span className="ml-2 text-[11px] font-normal uppercase tracking-[0.1em] text-[#8a8477]">{row.kind}</span>
                </p>
                <p className="text-[12px] text-[#6b665e]">
                  {formatPrettyDate(row.date)} · {row.label} · {row.method}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#6b665e]">
                ${row.amount}
                <PaidPill status={row.status} onToggle={row.onToggle} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
