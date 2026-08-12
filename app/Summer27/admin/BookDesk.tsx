"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BOOKING_HOURS,
  COURTS,
  STRING_OPTIONS,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonProLabel,
  lessonRateForPro,
  type CourtId,
} from "../summer27-data";
import { getLiveClinics, getLiveEvents, getLiveCourtRates, getLiveStringingLabor, getLivePros, getProgramBlock } from "../schedule";
import {
  rememberStringing,
  stringPrefForMember,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import type { S27AdminBlock } from "../schedule";
import { PaidPill, inputClass, uid } from "./ui";

type Section = "courts" | "clinics" | "lessons" | "events" | "stringing" | "holds";
type Range = "today" | "upcoming" | "all";

type Props = {
  members: S27MemberAccount[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  blocks: S27AdminBlock[];
  onCourts: (next: S27CourtBooking[]) => void;
  onClinics: (next: S27ClinicBooking[]) => void;
  onLessons: (next: S27LessonBooking[]) => void;
  onEvents: (next: S27EventBooking[]) => void;
  onStringing: (next: S27StringingOrder[]) => void;
  onHolds: (next: S27AdminBlock[]) => void;
};

const today = () => formatDateInput(new Date());

function inRangeDate(date: string, range: Range) {
  if (range === "all") return true;
  const t = today();
  if (range === "today") return date === t;
  return date >= t;
}

export default function BookDesk(props: Props) {
  const [section, setSection] = useState<Section>("courts");
  const [range, setRange] = useState<Range>("today");
  const [memberNo, setMemberNo] = useState("");
  const member = props.members.find((m) => m.memberNumber === memberNo) || null;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={inputClass} value={section} onChange={(e) => setSection(e.target.value as Section)}>
          <option value="courts">Courts</option>
          <option value="clinics">Clinics</option>
          <option value="lessons">Lessons</option>
          <option value="events">Events</option>
          <option value="stringing">Stringing</option>
          <option value="holds">Holds</option>
        </select>
        <select className={inputClass} value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="today">Today</option>
          <option value="upcoming">Upcoming</option>
          <option value="all">All records</option>
        </select>
        <select className={inputClass} value={memberNo} onChange={(e) => setMemberNo(e.target.value)}>
          <option value="">Guest / walk-up</option>
          {props.members
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((m) => (
              <option key={m.memberNumber} value={m.memberNumber}>
                #{m.memberNumber} · {m.name}
              </option>
            ))}
        </select>
      </div>

      {section === "courts" && <CourtsBlock {...props} range={range} member={member} />}
      {section === "clinics" && <ClinicsBlock {...props} range={range} member={member} />}
      {section === "lessons" && <LessonsBlock {...props} range={range} member={member} />}
      {section === "events" && <EventsBlock {...props} range={range} member={member} />}
      {section === "stringing" && <StringingBlock {...props} range={range} member={member} />}
      {section === "holds" && <HoldsBlock blocks={props.blocks} onHolds={props.onHolds} range={range} />}
    </div>
  );
}

function CourtsBlock({
  courts,
  onCourts,
  range,
  member,
}: Pick<Props, "courts" | "onCourts"> & { range: Range; member: S27MemberAccount | null }) {
  const [date, setDate] = useState(today());
  const [hour, setHour] = useState("8");
  const [courtId, setCourtId] = useState<CourtId>("court-2");
  const [guestName, setGuestName] = useState("");
  const list = useMemo(
    () =>
      courts
        .filter((b) => inRangeDate(b.date, range))
        .slice()
        .sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`)),
    [courts, range]
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = member?.name || guestName.trim();
    if (!name) return;
    const hours = 1 as const;
    const rates = getLiveCourtRates();
    onCourts([
      ...courts,
      {
        id: uid("court"),
        date,
        hour: Number(hour),
        durationHours: hours,
        courtId,
        courtName: COURTS.find((c) => c.id === courtId)?.name || courtId,
        clientName: name,
        clientEmail: member?.email || "",
        clientPhone: member?.phone || "",
        memberNumber: member?.memberNumber,
        amount: (member ? rates.member : rates.guest) * hours,
        paymentStatus: "paid",
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setGuestName("");
  }

  return (
    <>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-4">
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        <select className={inputClass} value={courtId} onChange={(e) => setCourtId(e.target.value as CourtId)}>
          {COURTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={inputClass} value={hour} onChange={(e) => setHour(e.target.value)}>
          {BOOKING_HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
        </select>
        {!member && <input className={`${inputClass} sm:col-span-2`} placeholder="Walk-up name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />}
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add court</button>
      </form>
      <SimpleList
        empty="No court bookings in this view."
        rows={list.map((b) => ({
          id: b.id,
          title: `${b.courtName} · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
          detail: `${b.clientName} · ${b.durationHours}h · $${b.amount}${getProgramBlock(b.date, b.courtId, b.hour)?.type === "clinic" ? " · overlaps clinic" : ""}`,
          status: b.paymentStatus,
          onDelete: () => onCourts(courts.filter((x) => x.id !== b.id)),
        }))}
      />
    </>
  );
}

function ClinicsBlock({
  clinics,
  onClinics,
  range,
  member,
}: Pick<Props, "clinics" | "onClinics"> & { range: Range; member: S27MemberAccount | null }) {
  const defs = getLiveClinics();
  const [clinicId, setClinicId] = useState(defs[0]?.id || "");
  const [date, setDate] = useState(today());
  const [guestName, setGuestName] = useState("");
    const def = defs.find((c) => c.id === clinicId);
  const list = clinics
    .filter((b) => inRangeDate(b.date, range))
    .slice()
    .sort((a, b) => `${a.date}${a.clinicName}`.localeCompare(`${b.date}${b.clinicName}`));

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!def) return;
    const name = member?.name || guestName.trim();
    if (!name) return;
    onClinics([
      ...clinics,
      {
        id: uid("clinic"),
        clinicId: def.id,
        clinicName: def.name,
        date,
        clientName: name,
        clientEmail: member?.email || "",
        memberNumber: member?.memberNumber,
        amount: member ? def.memberPrice : def.guestPrice,
        paymentStatus: "paid",
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setGuestName("");
  }

  return (
    <>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <select className={inputClass} value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          {defs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        {!member && <input className={inputClass} placeholder="Walk-up name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />}
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add to roster</button>
      </form>
      <SimpleList
        empty="No clinic signups in this view."
        rows={list.map((b) => ({
          id: b.id,
          title: b.clinicName,
          detail: `${formatPrettyDate(b.date)} · ${b.clientName} · $${b.amount}`,
          status: b.paymentStatus,
          onDelete: () => onClinics(clinics.filter((x) => x.id !== b.id)),
        }))}
      />
    </>
  );
}

function LessonsBlock({
  lessons,
  onLessons,
  range,
  member,
}: Pick<Props, "lessons" | "onLessons"> & { range: Range; member: S27MemberAccount | null }) {
  const pros = getLivePros();
  const [proId, setProId] = useState(pros[0]?.id || "derek");
  const [date, setDate] = useState(today());
  const [hour, setHour] = useState("8");
  const duration = "60" as const;
  const [guestName, setGuestName] = useState("");
  const [focus, setFocus] = useState("");
    const pro = pros.find((p) => p.id === proId) || pros[0];
  const list = lessons
    .filter((b) => inRangeDate(b.date, range) || b.requestStatus === "requested")
    .slice()
    .sort((a, b) => {
      const req = Number(b.requestStatus === "requested") - Number(a.requestStatus === "requested");
      if (req) return req;
      return `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`);
    });

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = member?.name || guestName.trim();
    if (!name || !pro) return;
    const hourly = lessonRateForPro(pro, !!member);
    onLessons([
      ...lessons,
      {
        id: uid("lesson"),
        date,
        hour: Number(hour),
        duration,
        clientName: name,
        clientEmail: member?.email || "",
        clientPhone: member?.phone || "",
        memberNumber: member?.memberNumber,
        proId: pro.id,
        proName: pro.name,
        courtId: pro.courtId,
        focus,
        amount: hourly,
        paymentStatus: "paid",
        paymentMethod: "manual",
        requestStatus: "accepted",
        createdAt: new Date().toISOString(),
      },
    ]);
    setGuestName("");
    setFocus("");
  }

  return (
    <>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <select className={inputClass} value={proId} onChange={(e) => setProId(e.target.value)}>
          {pros.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        <select className={inputClass} value={hour} onChange={(e) => setHour(e.target.value)}>
          {BOOKING_HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
        </select>
        <p className="flex items-center text-[13px] text-[#6b665e]">60 minutes</p>
        {!member && <input className={inputClass} placeholder="Walk-up name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />}
        <input className={inputClass} placeholder="Focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add lesson</button>
      </form>
      <SimpleList
        empty="No lessons in this view."
        rows={list.map((b) => {
          const requested = b.requestStatus === "requested";
          return {
            id: b.id,
            title: `${lessonProLabel(b)} · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
            detail: `${b.clientName} · ${b.duration} min${b.focus ? ` · ${b.focus}` : ""} · $${b.amount}${
              requested ? " · REQUEST" : b.requestStatus === "accepted" ? " · accepted" : ""
            }`,
            status: b.paymentStatus,
            actions: requested ? (
              <>
                <button
                  type="button"
                  className="text-[12px] font-medium text-[#3d5c34]"
                  onClick={() =>
                    onLessons(lessons.map((x) => (x.id === b.id ? { ...x, requestStatus: "accepted" as const } : x)))
                  }
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="text-[12px] font-medium text-[#991b1b]"
                  onClick={() =>
                    onLessons(lessons.map((x) => (x.id === b.id ? { ...x, requestStatus: "declined" as const } : x)))
                  }
                >
                  Decline
                </button>
              </>
            ) : null,
            onDelete: () => onLessons(lessons.filter((x) => x.id !== b.id)),
          };
        })}
      />
    </>
  );
}

function EventsBlock({
  events,
  onEvents,
  range,
  member,
}: Pick<Props, "events" | "onEvents"> & { range: Range; member: S27MemberAccount | null }) {
  const defs = getLiveEvents();
  const [eventId, setEventId] = useState(defs[0]?.id || "");
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("1");
    const def = defs.find((e) => e.id === eventId);
  const list = events
    .filter((b) => inRangeDate(b.eventDate, range))
    .slice()
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!def) return;
    const name = member?.name || guestName.trim();
    if (!name) return;
    const spots = Math.max(1, Number(guestCount) || 1);
    onEvents([
      ...events,
      {
        id: uid("event"),
        eventId: def.id,
        eventTitle: def.title,
        eventDate: def.date,
        attendeeName: name,
        attendeeEmail: member?.email || "",
        guestCount: spots,
        memberNumber: member?.memberNumber,
        amount: (member ? def.memberPrice : def.guestPrice) * spots,
        paymentStatus: "paid",
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setGuestName("");
  }

  return (
    <>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {defs.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {!member && <input className={inputClass} placeholder="Walk-up name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />}
        <select className={inputClass} value={guestCount} onChange={(e) => setGuestCount(e.target.value)}>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} spot{n > 1 ? "s" : ""}</option>)}
        </select>
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add reservation</button>
      </form>
      <SimpleList
        empty="No event reservations in this view."
        rows={list.map((b) => ({
          id: b.id,
          title: b.eventTitle,
          detail: `${b.attendeeName} ×${b.guestCount} · $${b.amount}`,
          status: b.paymentStatus,
          onDelete: () => onEvents(events.filter((x) => x.id !== b.id)),
        }))}
      />
    </>
  );
}

function StringingBlock({
  stringing,
  onStringing,
  range,
  member,
}: Pick<Props, "stringing" | "onStringing"> & { range: Range; member: S27MemberAccount | null }) {
  const [racket, setRacket] = useState("");
  const [stringId, setStringId] = useState(STRING_OPTIONS[0].id);
  const [tension, setTension] = useState("52");
  const [guestName, setGuestName] = useState("");
    const stringOpt = STRING_OPTIONS.find((s) => s.id === stringId) || STRING_OPTIONS[0];

  useEffect(() => {
    if (!member) return;
    const pref = stringPrefForMember(member.memberNumber, stringing);
    if (!pref) return;
    setRacket(pref.racket);
    if (STRING_OPTIONS.some((s) => s.id === pref.stringId)) setStringId(pref.stringId);
    else {
      const match = STRING_OPTIONS.find((s) => s.name === pref.stringName);
      if (match) setStringId(match.id);
    }
    if (pref.tension) setTension(String(pref.tension).replace(/[^\d.]/g, "") || pref.tension);
  }, [member?.memberNumber]);
  const list = stringing
    .filter((b) => inRangeDate(b.pickupDate || b.createdAt.slice(0, 10), range))
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = member?.name || guestName.trim();
    if (!racket.trim() || !name) return;
    const order = {
        id: uid("string"),
        racket: racket.trim(),
        stringId: stringOpt.id,
        stringName: stringOpt.name,
        tension,
        clientName: name,
        clientEmail: member?.email || "",
        memberNumber: member?.memberNumber,
        amount: getLiveStringingLabor() + stringOpt.extra,
        paymentStatus: "paid" as const,
        paymentMethod: "manual" as const,
        createdAt: new Date().toISOString(),
        shopStatus: "in_shop" as const,
      };
    rememberStringing(member?.memberNumber, order);
    onStringing([...stringing, order]);
    setRacket("");
    setGuestName("");
  }

  return (
    <>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <input className={inputClass} placeholder="Racket" value={racket} onChange={(e) => setRacket(e.target.value)} />
        <select className={inputClass} value={stringId} onChange={(e) => setStringId(e.target.value)}>
          {STRING_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={inputClass} value={tension} onChange={(e) => setTension(e.target.value)}>
          {["48", "50", "52", "54", "56", "58"].map((t) => <option key={t} value={t}>{t} lbs</option>)}
        </select>
        {!member && <input className={inputClass} placeholder="Walk-up name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />}
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add order</button>
      </form>
      <SimpleList
        empty="No stringing orders in this view."
        rows={list.map((b) => ({
          id: b.id,
          title: `${b.racket} · ${b.stringName} @ ${b.tension}`,
          detail: `${b.clientName} · $${b.amount}`,
          status: b.paymentStatus,
          onDelete: () => onStringing(stringing.filter((x) => x.id !== b.id)),
        }))}
      />
    </>
  );
}

function HoldsBlock({
  blocks,
  onHolds,
  range,
}: {
  blocks: S27AdminBlock[];
  onHolds: (next: S27AdminBlock[]) => void;
  range: Range;
}) {
  const [date, setDate] = useState(today());
  const [courtId, setCourtId] = useState<CourtId | "both">("both");
  const [kind, setKind] = useState<"hold" | "open">("hold");
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(9);
  const [reason, setReason] = useState("");
  const list = blocks
    .filter((b) => inRangeDate(b.date, range))
    .slice()
    .sort((a, b) =>
      `${b.date}${String(b.startHour).padStart(2, "0")}`.localeCompare(
        `${a.date}${String(a.startHour).padStart(2, "0")}`
      )
    );

  const endOptions = BOOKING_HOURS.filter((h) => h > startHour).concat([Math.max(...BOOKING_HOURS) + 1]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const durationHours = Math.max(1, endHour - startHour);
    onHolds([
      ...blocks,
      {
        id: uid("hold"),
        date,
        courtId,
        startHour,
        durationHours,
        reason:
          reason.trim() ||
          (kind === "open" ? "Open for public play" : "Director hold"),
        kind,
        createdAt: new Date().toISOString(),
      },
    ]);
    setReason("");
  }

  return (
    <>
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-4">
        <div>
          <p className="text-[14px] font-medium">Hold or open a court</p>
          <p className="mt-0.5 text-[12px] text-[#6b665e]">
            Any reason, any hours. “Open” releases a recurring lesson hold for that window.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as "hold" | "open")}>
            <option value="hold">Hold (block booking)</option>
            <option value="open">Open (release hold)</option>
          </select>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          <select className={inputClass} value={courtId} onChange={(e) => setCourtId(e.target.value as CourtId | "both")}>
            <option value="both">Both courts</option>
            <option value="court-1">Court 3</option>
            <option value="court-2">Court 4</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputClass}
              value={startHour}
              onChange={(e) => {
                const next = Number(e.target.value);
                setStartHour(next);
                if (endHour <= next) setEndHour(next + 1);
              }}
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
            <select className={inputClass} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
              {endOptions.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </div>
          <input
            className={`${inputClass} sm:col-span-2`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={kind === "open" ? "Reason (optional) — e.g. Open Court 3 for members" : "Reason — e.g. Resurface, private event, rain…"}
          />
        </div>
        <button type="submit" className="w-full rounded-xl bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white">
          {kind === "open" ? "Open court" : "Add hold"}
        </button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {list.length === 0 ? (
          <p className="p-4 text-[13px] text-[#8a8477]">No holds or opens in this view.</p>
        ) : (
          list.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ede8] p-3 last:border-0">
              <div className="min-w-0">
                <p className="text-[14px] font-medium">
                  <span className={b.kind === "open" ? "text-[#166534]" : "text-[#1a1a1a]"}>
                    {b.kind === "open" ? "Open" : "Hold"}
                  </span>
                  <span className="text-[#8a8477]"> · </span>
                  {formatPrettyDate(b.date)} {formatHour(b.startHour)}–{formatHour(b.startHour + b.durationHours)}
                </p>
                <p className="text-[12px] text-[#6b665e]">
                  {b.courtId === "both" ? "Both courts" : b.courtId === "court-1" ? "Court 3" : "Court 4"}
                  {b.reason ? ` · ${b.reason}` : ""}
                </p>
              </div>
              <button type="button" onClick={() => onHolds(blocks.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function SimpleList({
  empty,
  rows,
}: {
  empty: string;
  rows: Array<{
    id: string;
    title: string;
    detail: string;
    status: "paid" | "pending";
    actions?: ReactNode;
    onDelete: () => void;
  }>;
}) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-[#e8e5df] bg-white p-4 text-[13px] text-[#8a8477]">{empty}</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0ede8] px-3 py-2.5 last:border-0">
          <div className="min-w-0">
            <p className="text-[14px] font-medium">{row.title}</p>
            <p className="text-[12px] text-[#6b665e]">{row.detail}</p>
          </div>
          <div className="flex items-center gap-2">
            {row.actions}
            <PaidPill status={row.status} />
            <button type="button" onClick={row.onDelete} className="text-[12px] text-[#991b1b]">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
