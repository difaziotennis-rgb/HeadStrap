"use client";

import { useMemo, useState } from "react";
import { formatDateInput, formatPrettyDate, lessonProLabel, parseDateInput } from "../summer27-data";
import { getLiveClinics } from "../schedule";
import {
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27StringingOrder,
} from "../storage";
import { Segmented } from "../DateChips";
import { inputClass } from "./ui";

type Kind = "all" | "court" | "lesson" | "clinic" | "junior" | "event" | "stringing" | "charge";
type Mode = "today" | "week" | "month" | "all";

type Row = {
  id: string;
  kind: Exclude<Kind, "all">;
  date: string;
  name: string;
  label: string;
  amount: number;
};

type Props = {
  today: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  charges: S27Charge[];
};

const CATEGORIES: { key: Exclude<Kind, "all">; label: string; short: string }[] = [
  { key: "court", label: "Court bookings", short: "Courts" },
  { key: "lesson", label: "Private lessons", short: "Lessons" },
  { key: "clinic", label: "Adult clinics", short: "Clinics" },
  { key: "junior", label: "Junior programs", short: "Juniors" },
  { key: "event", label: "Events", short: "Events" },
  { key: "stringing", label: "Stringing", short: "Stringing" },
  { key: "charge", label: "Pro shop & misc", short: "Shop" },
];

const KIND_LABEL: Record<Exclude<Kind, "all">, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.short])
) as Record<Exclude<Kind, "all">, string>;

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
  const rounded = Math.round(n * 100) / 100;
  if (Number.isInteger(rounded)) return `$${rounded.toLocaleString("en-US")}`;
  return `$${rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function clinicKind(clinicId: string): "clinic" | "junior" {
  const def = getLiveClinics().find((c) => c.id === clinicId);
  return def?.kind === "junior" ? "junior" : "clinic";
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

  const allRows = useMemo(() => {
    const rows: Row[] = [
      ...courts.map((b) => ({
        id: b.id,
        kind: "court" as const,
        date: b.date,
        name: b.clientName,
        label: `${b.courtName} · ${b.durationHours}h`,
        amount: b.amount,
      })),
      ...lessons
        .filter((b) => b.requestStatus !== "declined")
        .map((b) => ({
          id: b.id,
          kind: "lesson" as const,
          date: b.date,
          name: b.clientName,
          label:
            b.requestStatus === "requested"
              ? `${lessonProLabel(b)} · request`
              : `${lessonProLabel(b)} · ${b.duration} min`,
          amount: b.amount,
        })),
      ...clinics.map((b) => ({
        id: b.id,
        kind: clinicKind(b.clinicId),
        date: b.date,
        name: b.clientName,
        label: b.clinicName,
        amount: b.amount,
      })),
      ...events.map((b) => ({
        id: b.id,
        kind: "event" as const,
        date: b.eventDate,
        name: b.attendeeName,
        label: `${b.eventTitle} ×${b.guestCount}`,
        amount: b.amount,
      })),
      ...stringing.map((b) => ({
        id: b.id,
        kind: "stringing" as const,
        date: b.pickupDate || b.createdAt.slice(0, 10),
        name: b.clientName,
        label: `${b.racket} · ${b.stringName}`,
        amount: b.amount,
      })),
      ...charges.map((b) => ({
        id: b.id,
        kind: "charge" as const,
        date: b.date,
        name: b.clientName,
        label: b.description,
        amount: b.amount,
      })),
    ];
    return rows
      .filter((row) => {
        if (!window) return true;
        return row.date >= window.start && row.date <= window.end;
      })
      .sort((a, b) => `${b.date}${b.name}`.localeCompare(`${a.date}${a.name}`));
  }, [courts, clinics, lessons, events, stringing, charges, window]);

  const categories = useMemo(() => {
    const total = allRows.reduce((s, r) => s + r.amount, 0);
    return CATEGORIES.map((cat) => {
      const items = allRows.filter((r) => r.kind === cat.key);
      const amount = items.reduce((s, r) => s + r.amount, 0);
      return {
        ...cat,
        count: items.length,
        amount,
        share: total > 0 ? amount / total : 0,
      };
    });
  }, [allRows]);

  const total = categories.reduce((s, c) => s + c.amount, 0);
  const totalCount = allRows.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows
      .filter((row) => kind === "all" || row.kind === kind)
      .filter((row) => !q || `${row.name} ${row.label} ${KIND_LABEL[row.kind]}`.toLowerCase().includes(q));
  }, [allRows, kind, query]);

  const byCategory = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = filtered.filter((r) => r.kind === cat.key);
      return {
        ...cat,
        items,
        amount: items.reduce((s, r) => s + r.amount, 0),
      };
    }).filter((g) => g.items.length > 0);
  }, [filtered]);

  const activeLabel = kind === "all" ? "All categories" : CATEGORIES.find((c) => c.key === kind)?.label || kind;

  return (
    <div className="mt-4 space-y-5">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">Finances</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">
          Revenue by category — courts, lessons, clinics, juniors, events, stringing, and shop.
        </p>
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
      </div>

      <div className="rounded-2xl border border-[#d8e8d4] bg-[#f4faf2] px-4 py-4 sm:px-5">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#5f7358]">Brought in</p>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-[#1a1a1a] sm:text-4xl">
            {money(total)}
          </p>
          <p className="text-[13px] text-[#6b665e]">
            {totalCount} charge{totalCount === 1 ? "" : "s"}
            {window ? ` · ${window.label}` : " · all time"}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#f0ede8] px-4 py-3">
          <div>
            <p className="text-[15px] font-medium">By category</p>
            <p className="mt-0.5 text-[12px] text-[#6b665e]">Tap a category to filter the list below</p>
          </div>
          {kind !== "all" && (
            <button
              type="button"
              onClick={() => setKind("all")}
              className="text-[12px] font-medium text-[#6b665e] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
            >
              Show all
            </button>
          )}
        </div>
        <ul className="divide-y divide-[#f0ede8]">
          {categories.map((cat) => {
            const active = kind === cat.key;
            return (
              <li key={cat.key}>
                <button
                  type="button"
                  onClick={() => setKind(active ? "all" : cat.key)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    active ? "bg-[#faf9f7]" : "hover:bg-[#faf9f7]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`text-[15px] font-medium ${active ? "text-[#1a1a1a]" : "text-[#1a1a1a]"}`}>
                        {cat.label}
                      </p>
                      <p className="shrink-0 text-[15px] font-semibold tabular-nums">{money(cat.amount)}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ece8e2]">
                        <div
                          className={`h-full rounded-full ${active ? "bg-[#1a1a1a]" : "bg-[#8a8477]"}`}
                          style={{ width: `${Math.max(cat.share * 100, cat.amount > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <p className="w-24 shrink-0 text-right text-[12px] tabular-nums text-[#6b665e]">
                        {cat.count} · {total > 0 ? `${Math.round(cat.share * 100)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-[#6b665e]">
          <span className="font-medium text-[#1a1a1a]">{activeLabel}</span>
          {" · "}
          {filtered.length} item{filtered.length === 1 ? "" : "s"} · {money(filtered.reduce((s, r) => s + r.amount, 0))}
        </p>
        <input
          className={`${inputClass} sm:max-w-xs`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or note…"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-8 text-center text-[14px] text-[#8a8477]">
          Nothing in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {byCategory.map((group) => (
            <section key={group.key} className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
              <div className="flex items-baseline justify-between gap-3 border-b border-[#f0ede8] bg-[#faf9f7] px-4 py-2.5">
                <p className="text-[14px] font-medium">{group.label}</p>
                <p className="text-[13px] tabular-nums text-[#6b665e]">
                  {group.items.length} · {money(group.amount)}
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
                        {formatPrettyDate(row.date)} · {row.label}
                      </p>
                    </div>
                    <span className="text-[15px] font-medium tabular-nums">{money(row.amount)}</span>
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
