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

type Period = "this-week" | "last-week" | "this-month" | "last-month";

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

function rangeForPeriod(today: string, period: Period): { start: string; end: string; label: string } {
  const t = parseDateInput(today);
  if (period === "this-week") {
    const start = startOfWeekMonday(t);
    const end = addDays(start, 6);
    return {
      start: formatDateInput(start),
      end: formatDateInput(end),
      label: `${formatPrettyDate(formatDateInput(start))} – ${formatPrettyDate(formatDateInput(end))}`,
    };
  }
  if (period === "last-week") {
    const thisStart = startOfWeekMonday(t);
    const start = addDays(thisStart, -7);
    const end = addDays(start, 6);
    return {
      start: formatDateInput(start),
      end: formatDateInput(end),
      label: `${formatPrettyDate(formatDateInput(start))} – ${formatPrettyDate(formatDateInput(end))}`,
    };
  }
  if (period === "this-month") {
    const start = startOfMonth(t);
    const end = endOfMonth(t);
    return {
      start: formatDateInput(start),
      end: formatDateInput(end),
      label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }
  const prev = new Date(t.getFullYear(), t.getMonth() - 1, 15);
  const start = startOfMonth(prev);
  const end = endOfMonth(prev);
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

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#ece8e2]">
      <div className="h-full rounded-full bg-[#1a1a1a]" style={{ width: `${pct}%` }} />
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
  const [period, setPeriod] = useState<Period>("this-week");
  const { start, end, label } = useMemo(() => rangeForPeriod(today, period), [today, period]);

  const overview = useMemo(() => {
    const courtRows = courts.filter((b) => inRange(b.date, start, end));
    const clinicRows = clinics.filter((b) => inRange(b.date, start, end) && b.paymentStatus === "paid");
    const lessonRows = lessons.filter(
      (b) =>
        inRange(b.date, start, end) &&
        b.requestStatus !== "declined" &&
        b.requestStatus !== "requested"
    );
    const eventRows = events.filter((b) => inRange(b.eventDate, start, end));
    const stringRows = stringing.filter((b) => inRange(b.pickupDate || b.createdAt.slice(0, 10), start, end));
    const chargeRows = charges.filter((b) => inRange(b.date, start, end));

    const allMoney = [...courtRows, ...clinicRows, ...lessonRows, ...eventRows, ...stringRows, ...chargeRows];
    const paid = allMoney.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0);
    const unpaid = allMoney.filter((b) => b.paymentStatus === "pending").reduce((s, b) => s + b.amount, 0);
    const courtHours = courtRows.reduce((s, b) => s + (Number(b.durationHours) || 1), 0);
    const lessonHours = lessonRows.reduce((s, b) => s + lessonSpan(b.duration), 0);

    return {
      paid,
      unpaid,
      courtBookings: courtRows.length,
      courtHours,
      clinicSignups: clinicRows.length,
      lessons: lessonRows.length,
      lessonHours,
      events: eventRows.length,
      stringing: stringRows.length,
      charges: chargeRows.length,
      chargeRevenue: chargeRows.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0),
    };
  }, [courts, clinics, lessons, events, stringing, charges, start, end]);

  const clinicStats = useMemo(() => {
    const paidInRange = clinics.filter((b) => inRange(b.date, start, end) && b.paymentStatus === "paid");
    const rows = clinicsCatalog.map((def) => {
      const signups = paidInRange.filter((b) => b.clinicId === def.id);
      const dates = new Set(signups.map((b) => b.date));
      // Also count scheduled sessions in range even with 0 signups
      const scheduledDates = new Set<string>();
      const cursor = parseDateInput(start);
      const last = parseDateInput(end);
      for (let d = new Date(cursor); d <= last; d.setDate(d.getDate() + 1)) {
        if (def.days.includes(d.getDay())) scheduledDates.add(formatDateInput(d));
      }
      const sessions = Math.max(dates.size, 0);
      const scheduled = scheduledDates.size;
      const capacityTotal = scheduled * def.capacity;
      const fill = capacityTotal > 0 ? signups.length / capacityTotal : 0;
      const revenue = signups.reduce((s, b) => s + b.amount, 0);
      const avgPerSession = sessions > 0 ? signups.length / sessions : 0;
      return {
        id: def.id,
        name: def.name,
        kind: def.kind,
        capacity: def.capacity,
        signups: signups.length,
        sessions: sessions || (signups.length ? 1 : 0),
        scheduled,
        fill,
        revenue,
        avgPerSession,
      };
    });
    return rows.sort((a, b) => b.signups - a.signups || b.revenue - a.revenue);
  }, [clinics, clinicsCatalog, start, end]);

  const maxClinicSignups = Math.max(1, ...clinicStats.map((c) => c.signups));

  const proStats = useMemo(() => {
    const inWindow = lessons.filter((b) => inRange(b.date, start, end));
    const rows = pros.map((pro) => {
      const mine = inWindow.filter((b) => bookingProId(b) === pro.id);
      const taught = mine.filter((b) => b.requestStatus !== "declined" && b.requestStatus !== "requested");
      const requested = mine.filter((b) => b.requestStatus === "requested").length;
      const accepted = mine.filter((b) => b.requestStatus === "accepted").length;
      const declined = mine.filter((b) => b.requestStatus === "declined").length;
      const hours = taught.reduce((s, b) => s + lessonSpan(b.duration), 0);
      const revenue = taught.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.amount, 0);
      const unpaid = taught.filter((b) => b.paymentStatus === "pending").reduce((s, b) => s + b.amount, 0);
      const decided = accepted + declined;
      const acceptRate = decided > 0 ? accepted / decided : null;
      return {
        id: pro.id,
        name: pro.name,
        title: pro.title,
        lessons: taught.length,
        hours,
        revenue,
        unpaid,
        requested,
        accepted,
        declined,
        acceptRate,
        requestMode: pro.lessonMode === "request",
      };
    });
    return rows.sort((a, b) => b.revenue - a.revenue || b.lessons - a.lessons);
  }, [lessons, pros, start, end]);

  const maxProLessons = Math.max(1, ...proStats.map((p) => p.lessons));

  return (
    <div className="mt-4 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Tracking</p>
          <h3 className="mt-0.5 text-xl font-semibold tracking-tight">Club numbers</h3>
          <p className="mt-1 text-[13px] text-[#6b665e]">{label}</p>
        </div>
        <div className="w-full overflow-x-auto sm:w-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={[
              { value: "this-week", label: "This week" },
              { value: "last-week", label: "Last week" },
              { value: "this-month", label: "This month" },
              { value: "last-month", label: "Last month" },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paid" value={money(overview.paid)} note={`${money(overview.unpaid)} unpaid`} />
        <StatCard
          label="Court time"
          value={`${overview.courtHours}h`}
          note={`${overview.courtBookings} booking${overview.courtBookings === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Clinic signups"
          value={String(overview.clinicSignups)}
          note={`${overview.lessons} lessons · ${overview.lessonHours}h`}
        />
        <StatCard
          label="Shop & stringing"
          value={money(overview.chargeRevenue)}
          note={`${overview.charges} charges · ${overview.stringing} string`}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="border-b border-[#f0ede8] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinic popularity</p>
          <p className="mt-0.5 text-[13px] text-[#6b665e]">Signups, fill rate vs capacity, and revenue in this period.</p>
        </div>
        {clinicStats.every((c) => c.signups === 0) ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">No clinic signups in this period.</p>
        ) : (
          <ul className="divide-y divide-[#f0ede8]">
            {clinicStats.map((row, i) => (
              <li key={row.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">
                      <span className="mr-2 text-[12px] text-[#8a8477]">#{i + 1}</span>
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-[12px] capitalize text-[#6b665e]">
                      {row.kind} · {row.signups} signup{row.signups === 1 ? "" : "s"}
                      {row.scheduled > 0 ? ` · ${Math.round(row.fill * 100)}% of ${row.scheduled} session capacity` : ""}
                      {row.sessions > 0 ? ` · avg ${row.avgPerSession.toFixed(1)} / session` : ""}
                    </p>
                  </div>
                  <p className="text-[15px] font-medium tabular-nums">{money(row.revenue)}</p>
                </div>
                <div className="mt-2">
                  <Bar value={row.signups} max={maxClinicSignups} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="border-b border-[#f0ede8] px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Pro performance</p>
          <p className="mt-0.5 text-[13px] text-[#6b665e]">Lessons taught, hours, revenue — plus request accept rate for Derek.</p>
        </div>
        <ul className="divide-y divide-[#f0ede8]">
          {proStats.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{row.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#6b665e]">
                    {row.title} · {row.lessons} lesson{row.lessons === 1 ? "" : "s"} · {row.hours}h taught
                    {row.unpaid > 0 ? ` · ${money(row.unpaid)} unpaid` : ""}
                  </p>
                  {row.requestMode && (row.accepted > 0 || row.declined > 0 || row.requested > 0) && (
                    <p className="mt-1 text-[12px] text-[#6b665e]">
                      Requests: {row.accepted} accepted · {row.declined} declined
                      {row.requested > 0 ? ` · ${row.requested} open` : ""}
                      {row.acceptRate != null ? ` · ${Math.round(row.acceptRate * 100)}% accept` : ""}
                    </p>
                  )}
                </div>
                <p className="text-[15px] font-medium tabular-nums">{money(row.revenue)}</p>
              </div>
              <div className="mt-2">
                <Bar value={row.lessons} max={maxProLessons} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {note ? <p className="mt-0.5 text-[12px] text-[#6b665e]">{note}</p> : null}
    </div>
  );
}
