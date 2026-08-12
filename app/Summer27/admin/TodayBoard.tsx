"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clinicTimeLabel,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonProLabel,
  parseDateInput,
} from "../summer27-data";
import type { S27Catalog } from "../schedule";
import type { S27AdminBlock } from "../schedule";
import {
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import { bookingProId } from "../lesson-slots";
import { PaidPill } from "./ui";

type Props = {
  today: string;
  members: S27MemberAccount[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  blocks: S27AdminBlock[];
  catalog: S27Catalog;
  onOpenMember: (memberNumber: string) => void;
  onToggleCourt: (id: string) => void;
  onToggleClinic: (id: string) => void;
  onToggleLesson: (id: string) => void;
  onAcceptLessonRequest: (id: string) => void;
  onDeclineLessonRequest: (id: string) => void;
  onToggleEvent: (id: string) => void;
  onToggleStringing: (id: string) => void;
};

type GlanceItem = {
  id: string;
  time: number;
  kind: string;
  title: string;
  name: string;
  extra?: string;
  status?: "paid" | "pending";
  memberNumber?: string;
  onToggle?: () => void;
};

type CourtLane = "court-1" | "court-2";

type ChipRef =
  | { type: "court"; id: string; date: string }
  | { type: "lesson"; id: string; date: string }
  | { type: "request"; id: string; date: string }
  | { type: "clinic"; clinicId: string; date: string }
  | { type: "event"; eventId: string; date: string }
  | { type: "hold"; id: string; date: string };

type DayChip = {
  key: string;
  time: number;
  kind: "court" | "lesson" | "clinic" | "event" | "hold" | "request";
  label: string;
  sub?: string;
  courts: CourtLane[];
  ref: ChipRef;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

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

function weekRangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const a = weekStart.toLocaleDateString("en-US", opts);
  const b = end.toLocaleDateString("en-US", {
    ...opts,
    year: weekStart.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  });
  return `${a} – ${b}`;
}

function memberNumberFor(
  members: S27MemberAccount[],
  memberNumber?: string,
  email?: string
) {
  if (memberNumber) return memberNumber;
  if (!email) return undefined;
  return members.find((m) => m.email.trim().toLowerCase() === email.trim().toLowerCase())?.memberNumber;
}

function shortClinicName(name: string): string {
  return name
    .replace(/\s+Clinic$/i, "")
    .replace(/^Weekend\s+/i, "")
    .replace(/^Weeknight\s+/i, "")
    .replace(/^Midweek\s+/i, "")
    .replace(/^Junior\s+/i, "Jr ");
}

function chipClass(kind: DayChip["kind"]): string {
  switch (kind) {
    case "lesson":
      return "border-[#3b82f6] bg-[#3b82f6] text-white";
    case "clinic":
      return "border-[#16a34a] bg-[#16a34a] text-white";
    case "event":
      return "border-[#a855f7] bg-[#a855f7] text-white";
    case "hold":
      return "border-[#64748b] bg-[#64748b] text-white";
    case "request":
      return "border-[#ea580c] bg-[#ea580c] text-white";
    default:
      return "border-[#ca8a04] bg-[#eab308] text-[#1a1a1a]";
  }
}

function ChipCard({ chip, onOpen }: { chip: DayChip; onOpen: (chip: DayChip) => void }) {
  const solid = chip.kind !== "court";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(chip);
      }}
      className={`w-full rounded-md border px-1 py-1 text-left sm:rounded-lg sm:px-1.5 sm:py-1.5 ${chipClass(chip.kind)}`}
    >
      <span
        className={`block text-[9px] font-semibold tabular-nums sm:text-[10px] ${
          solid ? "text-white/85" : "text-[#713f12]"
        }`}
      >
        {formatHour(chip.time)}
      </span>
      <span
        className={`mt-0.5 block truncate text-[10px] font-semibold leading-snug sm:text-[11px] ${
          solid ? "text-white" : "text-[#1a1a1a]"
        }`}
      >
        {chip.label}
      </span>
      {chip.sub ? (
        <span
          className={`mt-0.5 block truncate text-[9px] sm:text-[10px] ${
            solid ? "text-white/80" : "text-[#713f12]"
          }`}
        >
          {chip.sub}
        </span>
      ) : null}
    </button>
  );
}

function lanesForChip(chip: DayChip): { both: boolean; c1: boolean; c2: boolean } {
  const c1 = chip.courts.includes("court-1");
  const c2 = chip.courts.includes("court-2");
  return { both: c1 && c2, c1, c2 };
}

function clinicDefFor(
  catalog: S27Catalog,
  clinicId?: string,
  clinicName?: string
) {
  return (
    catalog.clinics.find((c) => c.id === clinicId) ||
    catalog.clinics.find((c) => c.name === clinicName) ||
    null
  );
}

function clinicStartHour(catalog: S27Catalog, clinicId?: string, clinicName?: string) {
  const def = clinicDefFor(catalog, clinicId, clinicName);
  const h = Number(def?.startHour);
  return Number.isFinite(h) ? h : 8;
}

/** Keep both-court + single-court chips in true time order (not both dumped at top). */
function dayChipBands(chips: DayChip[]) {
  const times = Array.from(new Set(chips.map((c) => c.time))).sort((a, b) => a - b);
  return times.map((time) => {
    const at = chips.filter((c) => c.time === time);
    const both = at.filter((c) => lanesForChip(c).both);
    const c1 = at.filter((c) => {
      const l = lanesForChip(c);
      return l.c1 && !l.both;
    });
    const c2 = at.filter((c) => {
      const l = lanesForChip(c);
      return l.c2 && !l.both;
    });
    return { time, both, c1, c2 };
  });
}

export default function TodayBoard({
  today,
  members,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  blocks,
  catalog,
  onOpenMember,
  onToggleCourt,
  onToggleClinic,
  onToggleLesson,
  onAcceptLessonRequest,
  onDeclineLessonRequest,
  onToggleEvent,
  onToggleStringing,
}: Props) {
  const thisWeekStart = useMemo(() => startOfWeekMonday(parseDateInput(today)), [today]);
  const [weekStart, setWeekStart] = useState(thisWeekStart);
  const [selectedDate, setSelectedDate] = useState(today);
  const [detail, setDetail] = useState<ChipRef | null>(null);

  useEffect(() => {
    if (!detail) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDetail(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  function openChip(chip: DayChip) {
    setSelectedDate(chip.ref.date);
    setDetail(chip.ref);
  }

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formatDateInput(addDays(weekStart, i))),
    [weekStart]
  );
  const isThisWeek = formatDateInput(weekStart) === formatDateInput(thisWeekStart);
  const nowHour = new Date().getHours();
  const selectedIsToday = selectedDate === today;

  const chipsByDay = useMemo(() => {
    const map: Record<string, DayChip[]> = {};
    for (const iso of days) map[iso] = [];

    for (const b of courts) {
      if (!map[b.date]) continue;
      map[b.date].push({
        key: `court-${b.id}`,
        time: b.hour,
        kind: "court",
        label: b.clientName.split(" ")[0],
        sub: `${b.durationHours}h`,
        courts: [b.courtId === "court-2" ? "court-2" : "court-1"],
        ref: { type: "court", id: b.id, date: b.date },
      });
    }

    for (const b of lessons) {
      if (!map[b.date]) continue;
      if (b.requestStatus === "declined") continue;
      const pro = catalog.pros.find((p) => p.id === bookingProId(b));
      const lane: CourtLane = (b.courtId || pro?.courtId) === "court-2" ? "court-2" : "court-1";
      if (b.requestStatus === "requested") {
        map[b.date].push({
          key: `req-${b.id}`,
          time: b.hour,
          kind: "request",
          label: "Request",
          sub: b.clientName.split(" ")[0],
          courts: [lane],
          ref: { type: "request", id: b.id, date: b.date },
        });
        continue;
      }
      map[b.date].push({
        key: `lesson-${b.id}`,
        time: b.hour,
        kind: "lesson",
        label: "Lesson",
        sub: b.clientName.split(" ")[0],
        courts: [lane],
        ref: { type: "lesson", id: b.id, date: b.date },
      });
    }

    const clinicKeys = new Set<string>();
    for (const b of clinics) {
      if (!map[b.date]) continue;
      const key = `${b.clinicId}|${b.date}`;
      if (clinicKeys.has(key)) continue;
      clinicKeys.add(key);
      const def = clinicDefFor(catalog, b.clinicId, b.clinicName);
      const count = clinics.filter((x) => x.clinicId === b.clinicId && x.date === b.date).length;
      const courtsForClinic = (def?.blockCourts || ["court-1", "court-2"]).filter(
        (c): c is CourtLane => c === "court-1" || c === "court-2"
      );
      map[b.date].push({
        key: `clinic-${key}`,
        time: clinicStartHour(catalog, b.clinicId, b.clinicName),
        kind: "clinic",
        label: shortClinicName(b.clinicName),
        sub: `${count} in`,
        courts: courtsForClinic.length ? courtsForClinic : ["court-1", "court-2"],
        ref: { type: "clinic", clinicId: b.clinicId || def?.id || b.clinicName, date: b.date },
      });
    }

    // Upcoming schedule only — past weeks keep real signups, not empty shells.
    for (const iso of days) {
      if (iso < today) continue;
      const jsDay = parseDateInput(iso).getDay();
      for (const def of catalog.clinics) {
        if (!def.days.includes(jsDay)) continue;
        const key = `${def.id}|${iso}`;
        if (clinicKeys.has(key)) continue;
        clinicKeys.add(key);
        const courtsForClinic = (def.blockCourts || ["court-1", "court-2"]).filter(
          (c): c is CourtLane => c === "court-1" || c === "court-2"
        );
        const start = Number(def.startHour);
        map[iso].push({
          key: `clinic-${key}`,
          time: Number.isFinite(start) ? start : 8,
          kind: "clinic",
          label: shortClinicName(def.name),
          sub: "0 in",
          courts: courtsForClinic.length ? courtsForClinic : ["court-1", "court-2"],
          ref: { type: "clinic", clinicId: def.id, date: iso },
        });
      }
    }

    for (const b of events) {
      if (!map[b.eventDate]) continue;
      const already = map[b.eventDate].some((c) => c.kind === "event" && c.key.includes(b.eventId));
      if (already) continue;
      const count = events.filter((x) => x.eventDate === b.eventDate && x.eventId === b.eventId).length;
      map[b.eventDate].push({
        key: `event-${b.eventId}-${b.eventDate}`,
        time: 16,
        kind: "event",
        label: b.eventTitle.length > 18 ? `${b.eventTitle.slice(0, 16)}…` : b.eventTitle,
        sub: `${count} RSVP`,
        courts: ["court-1", "court-2"],
        ref: { type: "event", eventId: b.eventId, date: b.eventDate },
      });
    }

    for (const def of catalog.events) {
      if (!map[def.date]) continue;
      if (map[def.date].some((c) => c.kind === "event" && c.key.includes(def.id))) continue;
      map[def.date].push({
        key: `event-${def.id}-${def.date}`,
        time: 16,
        kind: "event",
        label: def.title.length > 18 ? `${def.title.slice(0, 16)}…` : def.title,
        sub: "Event",
        courts: ["court-1", "court-2"],
        ref: { type: "event", eventId: def.id, date: def.date },
      });
    }

    for (const b of blocks) {
      if (!map[b.date]) continue;
      const courtsForHold: CourtLane[] =
        b.courtId === "both" ? ["court-1", "court-2"] : b.courtId === "court-2" ? ["court-2"] : ["court-1"];
      map[b.date].push({
        key: `hold-${b.id}`,
        time: b.startHour,
        kind: "hold",
        label: b.kind === "open" ? "Open" : "Hold",
        sub: (b.kind === "open" ? "Released" : b.reason).slice(0, 12),
        courts: courtsForHold,
        ref: { type: "hold", id: b.id, date: b.date },
      });
    }

    for (const iso of days) {
      map[iso].sort((a, b) => a.time - b.time || a.label.localeCompare(b.label));
    }
    return map;
  }, [days, today, courts, lessons, clinics, events, blocks, catalog]);

  const courtItems: GlanceItem[] = courts
    .filter((b) => b.date === selectedDate)
    .map((b) => ({
      id: b.id,
      time: b.hour,
      kind: b.courtName,
      title: `${b.courtName} · ${b.durationHours}h`,
      name: b.clientName,
      extra: `$${b.amount}`,
      status: b.paymentStatus,
      memberNumber: memberNumberFor(members, b.memberNumber, b.clientEmail),
      onToggle: () => onToggleCourt(b.id),
    }));
  const lessonItems: GlanceItem[] = lessons
    .filter((b) => b.date === selectedDate && b.requestStatus !== "declined" && b.requestStatus !== "requested")
    .map((b) => ({
      id: b.id,
      time: b.hour,
      kind: "Lesson",
      title: `${lessonProLabel(b)} · ${b.duration} min`,
      name: b.clientName,
      extra: b.focus || `$${b.amount}`,
      status: b.paymentStatus,
      memberNumber: memberNumberFor(members, b.memberNumber, b.clientEmail),
      onToggle: () => onToggleLesson(b.id),
    }));
  const lessonRequests = lessons
    .filter((b) => b.requestStatus === "requested" && days.includes(b.date))
    .slice()
    .sort((a, b) =>
      `${a.date}${String(a.hour).padStart(2, "0")}`.localeCompare(`${b.date}${String(b.hour).padStart(2, "0")}`)
    );
  const holdItems: GlanceItem[] = blocks
    .filter((b) => b.date === selectedDate)
    .map((b) => ({
      id: b.id,
      time: b.startHour,
      kind: "Hold",
      title: `${b.courtId === "both" ? "Both courts" : b.courtId === "court-1" ? "Court 1" : "Court 2"} · ${b.durationHours}h`,
      name: b.reason,
    }));

  const clinicGroups = Object.values(
    clinics
      .filter((b) => b.date === selectedDate)
      .reduce<Record<string, { clinicId: string; name: string; time: number; rows: S27ClinicBooking[] }>>(
        (acc, b) => {
          const key = b.clinicId || b.clinicName;
          if (!acc[key]) {
            acc[key] = {
              clinicId: b.clinicId,
              name: b.clinicName,
              time: clinicStartHour(catalog, b.clinicId, b.clinicName),
              rows: [],
            };
          }
          acc[key].rows.push(b);
          return acc;
        },
        {}
      )
  ).sort((a, b) => a.time - b.time);

  const dayEvents = events.filter((b) => b.eventDate === selectedDate);
  const timeline = [...courtItems, ...lessonItems, ...holdItems].sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));
  const hourGroups = timeline.reduce<Array<{ hour: number; items: GlanceItem[] }>>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.hour === item.time) last.items.push(item);
    else acc.push({ hour: item.time, items: [item] });
    return acc;
  }, []);

  const pendingRows = [
    ...courts
      .filter((b) => b.date === selectedDate && b.paymentStatus === "pending")
      .map((b) => ({ id: b.id, name: b.clientName, label: b.courtName, amount: b.amount, onToggle: () => onToggleCourt(b.id) })),
    ...clinics
      .filter((b) => b.date === selectedDate && b.paymentStatus === "pending")
      .map((b) => ({ id: b.id, name: b.clientName, label: b.clinicName, amount: b.amount, onToggle: () => onToggleClinic(b.id) })),
    ...lessons
      .filter(
        (b) =>
          b.date === selectedDate &&
          b.paymentStatus === "pending" &&
          b.requestStatus !== "requested" &&
          b.requestStatus !== "declined"
      )
      .map((b) => ({ id: b.id, name: b.clientName, label: lessonProLabel(b), amount: b.amount, onToggle: () => onToggleLesson(b.id) })),
    ...events
      .filter((b) => b.eventDate === selectedDate && b.paymentStatus === "pending")
      .map((b) => ({ id: b.id, name: b.attendeeName, label: b.eventTitle, amount: b.amount, onToggle: () => onToggleEvent(b.id) })),
    ...stringing
      .filter((b) => b.pickupDate === selectedDate && b.paymentStatus === "pending")
      .map((b) => ({ id: b.id, name: b.clientName, label: "Stringing", amount: b.amount, onToggle: () => onToggleStringing(b.id) })),
  ];
  const pendingTotal = pendingRows.reduce((sum, row) => sum + row.amount, 0);

  function goWeek(delta: number) {
    setWeekStart((w) => {
      const next = addDays(w, delta * 7);
      const nextDays = Array.from({ length: 7 }, (_, i) => formatDateInput(addDays(next, i)));
      if (!nextDays.includes(selectedDate)) setSelectedDate(nextDays[0]);
      return next;
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goWeek(-1)}
          className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
          aria-label="Previous week"
        >
          ←
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[15px] font-medium tracking-tight text-[#1a1a1a]">{weekRangeLabel(weekStart)}</p>
          {!isThisWeek && (
            <button
              type="button"
              onClick={() => {
                setWeekStart(thisWeekStart);
                setSelectedDate(today);
              }}
              className="mt-0.5 text-[12px] text-[#8a8477] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
            >
              This week
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => goWeek(1)}
          className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="min-w-[52rem] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white sm:min-w-0">
          <div className="grid grid-cols-7 border-b border-[#ece8e2] bg-[#faf9f7]">
            {days.map((iso, i) => {
              const d = parseDateInput(iso);
              const isToday = iso === today;
              const selected = iso === selectedDate;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={`border-r border-[#ece8e2] px-1 py-2 text-center last:border-r-0 sm:px-2 sm:py-2.5 ${
                    selected
                      ? "bg-[#1d4ed8] text-white"
                      : isToday
                        ? "bg-[#dbeafe] text-[#1e3a8a]"
                        : "bg-[#f8fafc]"
                  }`}
                >
                  <p
                    className={`text-[9px] uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.12em] ${
                      selected ? "text-white/75" : isToday ? "text-[#1d4ed8]" : "text-[#64748b]"
                    }`}
                  >
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`mt-0.5 text-[13px] font-semibold sm:text-[15px] ${
                      selected ? "text-white" : isToday ? "text-[#1e3a8a]" : "text-[#0f172a]"
                    }`}
                  >
                    {d.getDate()}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-7">
            {days.map((iso) => {
              const chips = chipsByDay[iso] || [];
              const isToday = iso === today;
              const selected = iso === selectedDate;
              const bands = dayChipBands(chips);
              const empty = chips.length === 0;
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDate(iso)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDate(iso);
                    }
                  }}
                  className={`min-h-[14rem] cursor-pointer border-r border-[#ece8e2] p-1 text-left last:border-r-0 sm:min-h-[16rem] sm:p-1.5 ${
                    selected
                      ? "bg-[#eff6ff] ring-2 ring-inset ring-[#3b82f6]"
                      : isToday
                        ? "bg-[#f0f9ff]"
                        : "bg-white hover:bg-[#f8fafc]"
                  }`}
                >
                  {empty ? (
                    <p className="px-0.5 py-2 text-center text-[10px] text-[#d0cbc3] sm:text-[11px]">—</p>
                  ) : (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        <p className="text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8a8477] sm:text-[9px]">
                          Ct 1
                        </p>
                        <p className="border-l border-[#ece8e2] pl-1 text-center text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8a8477] sm:text-[9px]">
                          Ct 2
                        </p>
                      </div>
                      {bands.map((band) => (
                        <div key={`${iso}-${band.time}`} className="space-y-1">
                          {band.both.map((chip) => (
                            <ChipCard key={chip.key} chip={chip} onOpen={openChip} />
                          ))}
                          {(band.c1.length > 0 || band.c2.length > 0) && (
                            <div className="grid grid-cols-2 gap-1">
                              <div className="min-w-0 space-y-1">
                                {band.c1.map((chip) => (
                                  <ChipCard key={chip.key} chip={chip} onOpen={openChip} />
                                ))}
                              </div>
                              <div className="min-w-0 space-y-1 border-l border-[#ece8e2] pl-1">
                                {band.c2.map((chip) => (
                                  <ChipCard key={chip.key} chip={chip} onOpen={openChip} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[#334155]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#eab308] ring-1 ring-[#ca8a04]" /> Court
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#3b82f6]" /> Lesson
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#16a34a]" /> Clinic
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#ea580c]" /> Request
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#a855f7]" /> Event
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#64748b]" /> Hold
        </span>
      </p>

      {lessonRequests.length > 0 && (
        <section className="rounded-2xl border border-[#d7e0ef] bg-[#f4f7fb] p-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#3d5273]">
            Lesson requests · {lessonRequests.length}
          </p>
          <ul className="mt-2 space-y-2">
            {lessonRequests.map((b) => (
              <li key={b.id} className="flex flex-wrap items-start justify-between gap-2 text-[15px]">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{b.clientName}</p>
                  <p className="text-[13px] text-[#6b665e]">
                    {lessonProLabel(b)} · {formatPrettyDate(b.date)} {formatHour(b.hour)} · {b.duration} min
                    {b.focus ? ` · ${b.focus}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAcceptLessonRequest(b.id)}
                    className="text-[13px] font-medium text-[#3d5c34]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineLessonRequest(b.id)}
                    className="text-[13px] font-medium text-[#991b1b]"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Day detail</p>
          <p className="text-[18px] font-semibold tracking-tight text-[#1a1a1a]">
            {formatPrettyDate(selectedDate)}
            {selectedIsToday ? <span className="ml-2 text-[12px] font-medium text-[#3d5c34]">Today</span> : null}
          </p>
        </div>
        {!selectedIsToday && (
          <button
            type="button"
            onClick={() => {
              setWeekStart(thisWeekStart);
              setSelectedDate(today);
            }}
            className="text-[12px] text-[#8a8477] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
          >
            Jump to today
          </button>
        )}
      </div>

      {pendingRows.length > 0 && (
        <section className="rounded-2xl border border-[#ead9c2] bg-[#fbf6ee] p-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#8a6230]">
            Unpaid · ${pendingTotal}
          </p>
          <ul className="mt-2 space-y-1.5">
            {pendingRows.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-2 text-[15px]">
                <span>
                  {row.name}
                  <span className="text-[#8a8477]"> · {row.label}</span>
                </span>
                <button type="button" onClick={row.onToggle} className="text-[13px] font-medium text-[#8a6230]">
                  ${row.amount} · mark paid
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
          Courts & lessons
        </p>
        {hourGroups.length === 0 ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">No court or lesson bookings this day.</p>
        ) : (
          hourGroups.map((group) => {
            const current = selectedIsToday && Math.floor(nowHour) === Math.floor(group.hour);
            return (
              <div key={group.hour} className={`border-b border-[#f0ede8] last:border-0 ${current ? "bg-[#faf9f7]" : ""}`}>
                <p className="px-4 pt-3 text-[20px] font-semibold tracking-tight">
                  {formatHour(group.hour)}
                  {current ? <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#3d5c34]">Now</span> : null}
                </p>
                <ul className="px-4 pb-3">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                      <div>
                        <p className="text-[16px] font-medium leading-tight">{item.name}</p>
                        <p className="text-[13px] text-[#6b665e]">
                          {item.title}
                          {item.extra ? ` · ${item.extra}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status && <PaidPill status={item.status} onToggle={item.onToggle} />}
                        {item.memberNumber && (
                          <button
                            type="button"
                            onClick={() => onOpenMember(item.memberNumber!)}
                            className="text-[12px] text-[#8a8477]"
                          >
                            File
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {clinicGroups.map((group) => (
        <section key={group.clinicId || group.name} className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="border-b border-[#f0ede8] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinic · {formatHour(group.time)}</p>
            <p className="text-[18px] font-semibold tracking-tight">{group.name}</p>
            <p className="text-[13px] text-[#6b665e]">{group.rows.length} signed up</p>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {group.rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const n = memberNumberFor(members, row.memberNumber, row.clientEmail);
                    if (n) onOpenMember(n);
                  }}
                  className="text-left text-[16px] font-medium"
                >
                  {row.clientName}
                </button>
                <PaidPill status={row.paymentStatus} onToggle={() => onToggleClinic(row.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {dayEvents.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Events</p>
          {Object.values(
            dayEvents.reduce<Record<string, S27EventBooking[]>>((acc, row) => {
              acc[row.eventTitle] = acc[row.eventTitle] || [];
              acc[row.eventTitle].push(row);
              return acc;
            }, {})
          ).map((rows) => (
            <div key={rows[0].eventTitle} className="border-b border-[#f0ede8] px-4 py-3 last:border-0">
              <p className="text-[18px] font-semibold tracking-tight">{rows[0].eventTitle}</p>
              <ul className="mt-1">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
                    <span className="text-[15px]">
                      {row.attendeeName}
                      <span className="text-[#8a8477]"> ×{row.guestCount}</span>
                    </span>
                    <PaidPill status={row.paymentStatus} onToggle={() => onToggleEvent(row.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {detail && (
        <CalendarDetailSheet
          detail={detail}
          members={members}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          blocks={blocks}
          catalog={catalog}
          onClose={() => setDetail(null)}
          onOpenMember={(n) => {
            setDetail(null);
            onOpenMember(n);
          }}
          onToggleCourt={onToggleCourt}
          onToggleClinic={onToggleClinic}
          onToggleLesson={onToggleLesson}
          onAcceptLessonRequest={(id) => {
            onAcceptLessonRequest(id);
            setDetail(null);
          }}
          onDeclineLessonRequest={(id) => {
            onDeclineLessonRequest(id);
            setDetail(null);
          }}
          onToggleEvent={onToggleEvent}
        />
      )}
    </div>
  );
}

function DetailSheet({
  eyebrow,
  title,
  onClose,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1a1a1a]/35" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[80dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{eyebrow}</p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-[#1a1a1a]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8e5df] text-[16px] leading-none text-[#6b665e] hover:bg-[#faf9f7]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        <div className="border-t border-[#ece8e2] px-4 py-3 sm:px-5">
          {footer || (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[14px] font-medium text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <p className="shrink-0 text-[12px] text-[#8a8477]">{label}</p>
      <div className="min-w-0 text-right text-[14px] font-medium text-[#1a1a1a]">{value}</div>
    </div>
  );
}

function PersonRow({
  name,
  detail,
  status,
  onToggle,
  onFile,
}: {
  name: string;
  detail?: string;
  status?: "paid" | "pending";
  onToggle?: () => void;
  onFile?: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <div className="min-w-0">
        {onFile ? (
          <button type="button" onClick={onFile} className="text-left text-[15px] font-medium hover:underline">
            {name}
          </button>
        ) : (
          <p className="text-[15px] font-medium">{name}</p>
        )}
        {detail ? <p className="text-[12px] text-[#6b665e]">{detail}</p> : null}
      </div>
      {status ? <PaidPill status={status} onToggle={onToggle} /> : null}
    </li>
  );
}

function CalendarDetailSheet({
  detail,
  members,
  courts,
  clinics,
  lessons,
  events,
  blocks,
  catalog,
  onClose,
  onOpenMember,
  onToggleCourt,
  onToggleClinic,
  onToggleLesson,
  onAcceptLessonRequest,
  onDeclineLessonRequest,
  onToggleEvent,
}: {
  detail: ChipRef;
  members: S27MemberAccount[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  blocks: S27AdminBlock[];
  catalog: S27Catalog;
  onClose: () => void;
  onOpenMember: (memberNumber: string) => void;
  onToggleCourt: (id: string) => void;
  onToggleClinic: (id: string) => void;
  onToggleLesson: (id: string) => void;
  onAcceptLessonRequest: (id: string) => void;
  onDeclineLessonRequest: (id: string) => void;
  onToggleEvent: (id: string) => void;
}) {
  if (detail.type === "court") {
    const b = courts.find((x) => x.id === detail.id);
    if (!b) {
      return (
        <DetailSheet eyebrow="Court" title="Booking not found" onClose={onClose}>
          <p className="text-[14px] text-[#8a8477]">This booking may have been removed.</p>
        </DetailSheet>
      );
    }
    const memberNo = memberNumberFor(members, b.memberNumber, b.clientEmail);
    return (
      <DetailSheet eyebrow="Court booking" title={b.clientName} onClose={onClose}>
        <div className="divide-y divide-[#f0ede8]">
          <DetailRow label="When" value={`${formatPrettyDate(b.date)} · ${formatHour(b.hour)}`} />
          <DetailRow label="Court" value={`${b.courtName} · ${b.durationHours}h`} />
          <DetailRow label="Phone" value={b.clientPhone || "—"} />
          <DetailRow label="Email" value={b.clientEmail || "—"} />
          <DetailRow label="Amount" value={`$${b.amount} · ${b.paymentMethod}`} />
          <DetailRow
            label="Payment"
            value={<PaidPill status={b.paymentStatus} onToggle={() => onToggleCourt(b.id)} />}
          />
        </div>
        {memberNo ? (
          <button
            type="button"
            onClick={() => onOpenMember(memberNo)}
            className="mt-4 w-full rounded-xl border border-[#e8e5df] py-2.5 text-[14px] font-medium"
          >
            Open member file
          </button>
        ) : null}
      </DetailSheet>
    );
  }

  if (detail.type === "lesson" || detail.type === "request") {
    const b = lessons.find((x) => x.id === detail.id);
    if (!b) {
      return (
        <DetailSheet eyebrow="Lesson" title="Booking not found" onClose={onClose}>
          <p className="text-[14px] text-[#8a8477]">This booking may have been removed.</p>
        </DetailSheet>
      );
    }
    const memberNo = memberNumberFor(members, b.memberNumber, b.clientEmail);
    const isRequest = b.requestStatus === "requested";
    return (
      <DetailSheet
        eyebrow={isRequest ? "Lesson request" : "Lesson"}
        title={b.clientName}
        onClose={onClose}
        footer={
          isRequest ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDeclineLessonRequest(b.id)}
                className="rounded-xl border border-[#fecaca] bg-[#fef2f2] py-3 text-[14px] font-medium text-[#991b1b]"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onAcceptLessonRequest(b.id)}
                className="rounded-xl bg-[#166534] py-3 text-[14px] font-medium text-white"
              >
                Accept
              </button>
            </div>
          ) : undefined
        }
      >
        <div className="divide-y divide-[#f0ede8]">
          <DetailRow label="When" value={`${formatPrettyDate(b.date)} · ${formatHour(b.hour)}`} />
          <DetailRow label="Pro" value={lessonProLabel(b)} />
          <DetailRow label="Length" value={`${b.duration} min`} />
          <DetailRow label="Focus" value={b.focus || "—"} />
          <DetailRow label="Phone" value={b.clientPhone || "—"} />
          <DetailRow label="Email" value={b.clientEmail || "—"} />
          <DetailRow label="Amount" value={`$${b.amount} · ${b.paymentMethod}`} />
          {!isRequest ? (
            <DetailRow
              label="Payment"
              value={<PaidPill status={b.paymentStatus} onToggle={() => onToggleLesson(b.id)} />}
            />
          ) : null}
        </div>
        {memberNo ? (
          <button
            type="button"
            onClick={() => onOpenMember(memberNo)}
            className="mt-4 w-full rounded-xl border border-[#e8e5df] py-2.5 text-[14px] font-medium"
          >
            Open member file
          </button>
        ) : null}
      </DetailSheet>
    );
  }

  if (detail.type === "clinic") {
    const def = clinicDefFor(catalog, detail.clinicId);
    const roster = clinics
      .filter(
        (x) =>
          x.date === detail.date &&
          (x.clinicId === detail.clinicId || (!!def && x.clinicId === def.id) || x.clinicName === def?.name)
      )
      .slice()
      .sort((a, b) => a.clientName.localeCompare(b.clientName));
    const name = def?.name || roster[0]?.clinicName || "Clinic";
    const timeLabel = def
      ? clinicTimeLabel(def)
      : formatHour(clinicStartHour(catalog, detail.clinicId, name));
    const paid = roster.filter((r) => r.paymentStatus === "paid").length;
    const owed = roster.filter((r) => r.paymentStatus === "pending").length;
    return (
      <DetailSheet eyebrow="Clinic" title={name} onClose={onClose}>
        <div className="divide-y divide-[#f0ede8] border-b border-[#f0ede8] pb-2">
          <DetailRow label="When" value={`${formatPrettyDate(detail.date)} · ${timeLabel}`} />
          <DetailRow label="Level" value={def?.level || "—"} />
          <DetailRow
            label="Signed up"
            value={`${roster.length}${def ? ` / ${def.capacity}` : ""}${owed ? ` · ${owed} unpaid` : ""}`}
          />
          <DetailRow label="Paid" value={`${paid}`} />
        </div>
        {roster.length === 0 ? (
          <p className="mt-4 text-[14px] text-[#8a8477]">Nobody signed up yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-[#f0ede8]">
            {roster.map((row) => {
              const n = memberNumberFor(members, row.memberNumber, row.clientEmail);
              return (
                <PersonRow
                  key={row.id}
                  name={row.clientName}
                  detail={`$${row.amount}`}
                  status={row.paymentStatus}
                  onToggle={() => onToggleClinic(row.id)}
                  onFile={n ? () => onOpenMember(n) : undefined}
                />
              );
            })}
          </ul>
        )}
      </DetailSheet>
    );
  }

  if (detail.type === "event") {
    const def = catalog.events.find((e) => e.id === detail.eventId);
    const roster = events
      .filter((x) => x.eventDate === detail.date && (x.eventId === detail.eventId || x.eventTitle === def?.title))
      .slice()
      .sort((a, b) => a.attendeeName.localeCompare(b.attendeeName));
    const title = def?.title || roster[0]?.eventTitle || "Event";
    const guests = roster.reduce((s, r) => s + (r.guestCount || 1), 0);
    return (
      <DetailSheet eyebrow="Event" title={title} onClose={onClose}>
        <div className="divide-y divide-[#f0ede8] border-b border-[#f0ede8] pb-2">
          <DetailRow label="When" value={formatPrettyDate(detail.date)} />
          <DetailRow label="RSVPs" value={`${roster.length} · ${guests} guest${guests === 1 ? "" : "s"}`} />
          {def?.capacity ? <DetailRow label="Capacity" value={String(def.capacity)} /> : null}
        </div>
        {roster.length === 0 ? (
          <p className="mt-4 text-[14px] text-[#8a8477]">No RSVPs yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-[#f0ede8]">
            {roster.map((row) => {
              const n = memberNumberFor(members, row.memberNumber, row.attendeeEmail);
              return (
                <PersonRow
                  key={row.id}
                  name={row.attendeeName}
                  detail={`×${row.guestCount} · $${row.amount}`}
                  status={row.paymentStatus}
                  onToggle={() => onToggleEvent(row.id)}
                  onFile={n ? () => onOpenMember(n) : undefined}
                />
              );
            })}
          </ul>
        )}
      </DetailSheet>
    );
  }

  const hold = blocks.find((x) => x.id === detail.id);
  if (!hold) {
    return (
      <DetailSheet eyebrow="Hold" title="Hold not found" onClose={onClose}>
        <p className="text-[14px] text-[#8a8477]">This hold may have been removed.</p>
      </DetailSheet>
    );
  }
  return (
    <DetailSheet
      eyebrow={hold.kind === "open" ? "Court open" : "Court hold"}
      title={hold.reason || (hold.kind === "open" ? "Open for play" : "Hold")}
      onClose={onClose}
    >
      <div className="divide-y divide-[#f0ede8]">
        <DetailRow label="When" value={`${formatPrettyDate(hold.date)} · ${formatHour(hold.startHour)}–${formatHour(hold.startHour + hold.durationHours)}`} />
        <DetailRow
          label="Courts"
          value={hold.courtId === "both" ? "Both courts" : hold.courtId === "court-2" ? "Court 2" : "Court 1"}
        />
        <DetailRow label="Type" value={hold.kind === "open" ? "Open (releases recurring hold)" : "Hold (blocks booking)"} />
      </div>
    </DetailSheet>
  );
}
