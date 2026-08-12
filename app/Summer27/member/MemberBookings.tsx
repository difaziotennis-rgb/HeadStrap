"use client";

import { useMemo, useState } from "react";
import {
  BOOKING_HOURS,
  COURTS,
  clinicTimeLabel,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonProLabel,
  lessonRateForPro,
  type CourtId,
} from "../summer27-data";
import { getLiveClinics, getLiveCourtRates, getLiveEvents, getLivePros, getProgramBlock } from "../schedule";
import { lessonConflict } from "../lesson-slots";
import { canChangeBooking, CANCEL_WINDOW_HOURS, eventStartHour } from "../booking-policy";
import {
  KEYS,
  loadList,
  loadRecord,
  persistCourts,
  saveList,
  stringingShopStatus,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27StringingOrder,
} from "../storage";

const inputClass = "rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[13px]";

type Props = {
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  onChange: () => void;
};

function nextClinicDates(days: number[], count = 8) {
  const dates: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (days.includes(d.getDay()) && canChangeBooking(formatDateInput(d), 8)) {
      dates.push(formatDateInput(d));
    }
  }
  return dates;
}

function monthHeading(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shortPastDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MemberBookings({ courts, clinics, lessons, events, stringing, onChange }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const liveClinics = getLiveClinics();
  const liveEvents = getLiveEvents();
  const courtRates = getLiveCourtRates();

  const [courtDraft, setCourtDraft] = useState({ date: "", hour: "8", durationHours: "1", courtId: "court-2" as CourtId });
  const [lessonDraft, setLessonDraft] = useState({ date: "", hour: "8", duration: "60" as "60" | "90", focus: "" });
  const [clinicDraft, setClinicDraft] = useState("");
  const [eventDraft, setEventDraft] = useState("1");
  const [stringDraft, setStringDraft] = useState("");

  const rows = useMemo(() => {
    const items = [
      ...courts.map((b) => ({
        id: b.id,
        kind: "court" as const,
        date: b.date,
        hour: b.hour,
        label: `${b.courtName} · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
        detail: `${b.durationHours} hr`,
        amount: b.amount,
        status: b.paymentStatus,
        booking: b,
      })),
      ...clinics.map((b) => {
        const def = liveClinics.find((c) => c.id === b.clinicId);
        return {
          id: b.id,
          kind: "clinic" as const,
          date: b.date,
          hour: def?.startHour ?? 8,
          label: `${b.clinicName} · ${formatPrettyDate(b.date)}`,
          detail: def ? clinicTimeLabel(def) : "",
          amount: b.amount,
          status: b.paymentStatus,
          booking: b,
        };
      }),
      ...lessons.map((b) => ({
        id: b.id,
        kind: "lesson" as const,
        date: b.date,
        hour: b.hour,
        label: `${lessonProLabel(b)} · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
        detail: `${b.duration} min${b.focus ? ` · ${b.focus}` : ""}`,
        amount: b.amount,
        status: b.paymentStatus,
        booking: b,
      })),
      ...events.map((b) => {
        const def = liveEvents.find((e) => e.id === b.eventId);
        return {
          id: b.id,
          kind: "event" as const,
          date: b.eventDate,
          hour: eventStartHour(def?.timeLabel),
          label: `${b.eventTitle} · ${formatPrettyDate(b.eventDate)}`,
          detail: `${b.guestCount} player${b.guestCount === 1 ? "" : "s"}`,
          amount: b.amount,
          status: b.paymentStatus,
          booking: b,
        };
      }),
      ...stringing.map((b) => {
        const shop = stringingShopStatus(b);
        const shopLabel =
          shop === "ready" ? "Ready for pickup" : shop === "picked_up" ? "Picked up" : "In the shop";
        return {
          id: b.id,
          kind: "stringing" as const,
          date: b.pickupDate || b.createdAt.slice(0, 10),
          hour: 9,
          label: `Stringing · ${b.racket}`,
          detail: `${b.stringName} @ ${b.tension}${b.pickupDate ? ` · pickup ${formatPrettyDate(b.pickupDate)}` : ""} · ${shopLabel}`,
          amount: b.amount,
          status: b.paymentStatus,
          booking: b,
        };
      }),
    ];
    return items.sort((a, b) => `${a.date}${String(a.hour).padStart(5, "0")}`.localeCompare(`${b.date}${String(b.hour).padStart(5, "0")}`));
  }, [courts, clinics, lessons, events, stringing, liveClinics, liveEvents]);

  const today = formatDateInput(new Date());
  const upcoming = rows.filter((row) => row.date >= today || row.status === "pending");

  const pastByMonth = useMemo(() => {
    const pastRows = rows
      .filter((row) => row.date < today && row.status !== "pending")
      .slice()
      .reverse();
    const map = new Map<string, typeof pastRows>();
    for (const row of pastRows) {
      const key = row.date.slice(0, 7);
      const list = map.get(key);
      if (list) list.push(row);
      else map.set(key, [row]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: monthHeading(key),
      items,
      total: items.reduce((sum, row) => sum + row.amount, 0),
    }));
  }, [rows, today]);

  const pastCount = pastByMonth.reduce((sum, month) => sum + month.items.length, 0);

  const [openPastMonth, setOpenPastMonth] = useState<string | null>(null);
  const activePastMonth =
    openPastMonth && pastByMonth.some((m) => m.key === openPastMonth)
      ? openPastMonth
      : pastByMonth[0]?.key || null;

  function flash(text: string) {
    setMsg(text);
    setEditing(null);
    onChange();
  }

  function startEdit(row: (typeof rows)[number]) {
    setMsg(null);
    setEditing(row.id);
    if (row.kind === "court") {
      const b = row.booking as S27CourtBooking;
      setCourtDraft({
        date: b.date,
        hour: String(b.hour),
        durationHours: String(b.durationHours),
        courtId: b.courtId,
      });
    }
    if (row.kind === "lesson") {
      const b = row.booking as S27LessonBooking;
      setLessonDraft({ date: b.date, hour: String(b.hour), duration: b.duration, focus: b.focus || "" });
    }
    if (row.kind === "clinic") setClinicDraft(row.date);
    if (row.kind === "event") setEventDraft(String((row.booking as S27EventBooking).guestCount));
    if (row.kind === "stringing") setStringDraft(row.date);
  }

  function cancelBooking(row: (typeof rows)[number]) {
    if (!canChangeBooking(row.date, row.hour)) {
      setMsg(`Cancellations must be made at least ${CANCEL_WINDOW_HOURS} hours before start.`);
      return;
    }
    if (row.kind === "court") {
      persistCourts(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)).filter((b) => b.id !== row.id));
    } else if (row.kind === "clinic") {
      saveList(KEYS.clinics, loadList<S27ClinicBooking>(KEYS.clinics).filter((b) => b.id !== row.id));
    } else if (row.kind === "lesson") {
      saveList(KEYS.lessons, loadList<S27LessonBooking>(KEYS.lessons).filter((b) => b.id !== row.id));
    } else if (row.kind === "event") {
      saveList(KEYS.events, loadList<S27EventBooking>(KEYS.events).filter((b) => b.id !== row.id));
    } else {
      saveList(KEYS.stringing, loadList<S27StringingOrder>(KEYS.stringing).filter((b) => b.id !== row.id));
    }
    flash("Cancelled.");
  }

  function saveCourt(row: (typeof rows)[number]) {
    const hour = Number(courtDraft.hour);
    const durationHours = Number(courtDraft.durationHours) === 2 ? 2 : 1;
    if (!canChangeBooking(courtDraft.date, hour)) {
      setMsg(`New court time must also be at least ${CANCEL_WINDOW_HOURS} hours out.`);
      return;
    }
    const all = uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts));
    for (let i = 0; i < durationHours; i++) {
      const program = getProgramBlock(courtDraft.date, courtDraft.courtId, hour + i);
      if (program) {
        setMsg(`That hour is reserved (${program.label}).`);
        return;
      }
      const taken = all.find(
        (b) =>
          b.id !== row.id &&
          b.date === courtDraft.date &&
          b.courtId === courtDraft.courtId &&
          hour + i >= b.hour &&
          hour + i < b.hour + b.durationHours
      );
      if (taken) {
        setMsg("That court time is already booked.");
        return;
      }
    }
    persistCourts(
      all.map((b) =>
        b.id === row.id
          ? {
              ...b,
              date: courtDraft.date,
              hour,
              durationHours,
              courtId: courtDraft.courtId,
              courtName: COURTS.find((c) => c.id === courtDraft.courtId)?.name || b.courtName,
              amount: courtRates.member * durationHours,
            }
          : b
      )
    );
    flash("Court booking updated.");
  }

  function saveLesson(row: (typeof rows)[number]) {
    const hour = Number(lessonDraft.hour);
    if (!canChangeBooking(lessonDraft.date, hour)) {
      setMsg(`New lesson time must also be at least ${CANCEL_WINDOW_HOURS} hours out.`);
      return;
    }
    const booking = row.booking as S27LessonBooking;
    const pro = getLivePros().find((p) => p.id === (booking.proId || "derek")) || getLivePros()[0];
    if (!pro) {
      setMsg("That professional isn’t on the schedule.");
      return;
    }
    const conflict = lessonConflict({
      pro,
      date: lessonDraft.date,
      hour,
      duration: lessonDraft.duration,
      lessons: loadList<S27LessonBooking>(KEYS.lessons),
      courts: uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)),
      ignoreId: row.id,
    });
    if (conflict) {
      setMsg(conflict);
      return;
    }
    const all = loadList<S27LessonBooking>(KEYS.lessons);
    const hours = lessonDraft.duration === "90" ? 1.5 : 1;
    saveList(
      KEYS.lessons,
      all.map((b) =>
        b.id === row.id
          ? {
              ...b,
              date: lessonDraft.date,
              hour,
              duration: lessonDraft.duration,
              focus: lessonDraft.focus.trim(),
              proId: pro.id,
              proName: pro.name,
              courtId: pro.courtId,
              amount: Math.round(lessonRateForPro(pro, true) * hours),
            }
          : b
      )
    );
    flash("Lesson updated.");
  }

  function saveClinic(row: (typeof rows)[number]) {
    const booking = row.booking as S27ClinicBooking;
    const def = liveClinics.find((c) => c.id === booking.clinicId);
    const hour = def?.startHour ?? 8;
    if (!canChangeBooking(clinicDraft, hour)) {
      setMsg(`New clinic date must also be at least ${CANCEL_WINDOW_HOURS} hours out.`);
      return;
    }
    saveList(
      KEYS.clinics,
      loadList<S27ClinicBooking>(KEYS.clinics).map((b) => (b.id === row.id ? { ...b, date: clinicDraft } : b))
    );
    flash("Clinic date updated.");
  }

  function saveEvent(row: (typeof rows)[number]) {
    if (!canChangeBooking(row.date, row.hour)) {
      setMsg(`Changes must be made at least ${CANCEL_WINDOW_HOURS} hours before start.`);
      return;
    }
    const booking = row.booking as S27EventBooking;
    const guestCount = Math.max(1, Number(eventDraft) || 1);
    const def = liveEvents.find((e) => e.id === booking.eventId);
    const per = def?.memberPrice || Math.round(booking.amount / Math.max(1, booking.guestCount));
    saveList(
      KEYS.events,
      loadList<S27EventBooking>(KEYS.events).map((b) =>
        b.id === row.id ? { ...b, guestCount, amount: per * guestCount } : b
      )
    );
    flash("Event registration updated.");
  }

  function saveStringing(row: (typeof rows)[number]) {
    if (!canChangeBooking(stringDraft, 9)) {
      setMsg(`Pickup must be at least ${CANCEL_WINDOW_HOURS} hours out.`);
      return;
    }
    saveList(
      KEYS.stringing,
      loadList<S27StringingOrder>(KEYS.stringing).map((b) => (b.id === row.id ? { ...b, pickupDate: stringDraft } : b))
    );
    flash("Stringing pickup updated.");
  }

  function renderPastRow(row: (typeof rows)[number]) {
    const kindLabel = row.kind === "stringing" ? "Stringing" : row.kind;
    const title =
      row.kind === "court"
        ? (row.booking as S27CourtBooking).courtName
        : row.kind === "clinic"
          ? (row.booking as S27ClinicBooking).clinicName
          : row.kind === "lesson"
            ? lessonProLabel(row.booking as S27LessonBooking)
            : row.kind === "event"
              ? (row.booking as S27EventBooking).eventTitle
              : (row.booking as S27StringingOrder).racket;

    return (
      <li key={row.id} className="flex items-start justify-between gap-3 px-3 py-2.5 sm:px-3.5">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#1a1a1a]">
            <span className="text-[#8a8477]">{shortPastDate(row.date)}</span>
            <span className="text-[#cfc9bf]"> · </span>
            {title}
          </p>
          <p className="mt-0.5 text-[12px] capitalize text-[#6b665e]">
            {kindLabel}
            {row.detail ? ` · ${row.detail}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-[13px] tabular-nums text-[#4a4a4a]">${row.amount}</p>
      </li>
    );
  }

  function renderBooking(row: (typeof rows)[number], canEdit: boolean) {
        const open = canEdit && canChangeBooking(row.date, row.hour);
        const clinicDef = row.kind === "clinic" ? liveClinics.find((c) => c.id === (row.booking as S27ClinicBooking).clinicId) : null;
        return (
          <div key={row.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">
                  {row.kind === "stringing" ? "Stringing" : row.kind}
                </p>
                <p className="text-[13px] font-medium">{row.label}</p>
                <p className="text-[12px] text-[#6b665e]">
                  ${row.amount} · {row.status === "paid" ? "Paid" : "Pending"}
                  {row.detail ? ` · ${row.detail}` : ""}
                </p>
              </div>
              {open ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(row)} className="text-[12px] text-[#6b665e] underline-offset-2 hover:underline">
                    Change
                  </button>
                  <button type="button" onClick={() => cancelBooking(row)} className="text-[12px] text-[#991b1b]">
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>

            {editing === row.id && open && row.kind === "court" && (
              <form
                className="mt-3 grid gap-2 sm:grid-cols-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCourt(row);
                }}
              >
                <input type="date" className={inputClass} value={courtDraft.date} onChange={(e) => setCourtDraft({ ...courtDraft, date: e.target.value })} />
                <select className={inputClass} value={courtDraft.courtId} onChange={(e) => setCourtDraft({ ...courtDraft, courtId: e.target.value as CourtId })}>
                  {COURTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select className={inputClass} value={courtDraft.hour} onChange={(e) => setCourtDraft({ ...courtDraft, hour: e.target.value })}>
                  {BOOKING_HOURS.map((h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
                <select className={inputClass} value={courtDraft.durationHours} onChange={(e) => setCourtDraft({ ...courtDraft, durationHours: e.target.value })}>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                </select>
                <div className="flex gap-2 sm:col-span-4">
                  <button className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save change</button>
                  <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Close</button>
                </div>
              </form>
            )}

            {editing === row.id && open && row.kind === "lesson" && (
              <form
                className="mt-3 grid gap-2 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveLesson(row);
                }}
              >
                <input type="date" className={inputClass} value={lessonDraft.date} onChange={(e) => setLessonDraft({ ...lessonDraft, date: e.target.value })} />
                <select className={inputClass} value={lessonDraft.hour} onChange={(e) => setLessonDraft({ ...lessonDraft, hour: e.target.value })}>
                  {BOOKING_HOURS.map((h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
                <select className={inputClass} value={lessonDraft.duration} onChange={(e) => setLessonDraft({ ...lessonDraft, duration: e.target.value as "60" | "90" })}>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
                <input className={`${inputClass} sm:col-span-3`} value={lessonDraft.focus} onChange={(e) => setLessonDraft({ ...lessonDraft, focus: e.target.value })} placeholder="Focus" />
                <div className="flex gap-2 sm:col-span-3">
                  <button className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save change</button>
                  <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Close</button>
                </div>
              </form>
            )}

            {editing === row.id && open && row.kind === "clinic" && (
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveClinic(row);
                }}
              >
                <select className={inputClass} value={clinicDraft} onChange={(e) => setClinicDraft(e.target.value)}>
                  {nextClinicDates(clinicDef?.days || []).map((d) => (
                    <option key={d} value={d}>{formatPrettyDate(d)}</option>
                  ))}
                </select>
                <button className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save change</button>
                <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Close</button>
              </form>
            )}

            {editing === row.id && open && row.kind === "event" && (
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEvent(row);
                }}
              >
                <input className={`${inputClass} w-24`} type="number" min={1} max={6} value={eventDraft} onChange={(e) => setEventDraft(e.target.value)} />
                <button className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Update spots</button>
                <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Close</button>
              </form>
            )}

            {editing === row.id && open && row.kind === "stringing" && (
              <form
                className="mt-3 flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveStringing(row);
                }}
              >
                <input type="date" className={inputClass} value={stringDraft} onChange={(e) => setStringDraft(e.target.value)} />
                <button className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save pickup</button>
                <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Close</button>
              </form>
            )}
          </div>
        );
  }

  if (rows.length === 0) {
    return <p className="mt-3 text-[13px] text-[#8a8477]">No bookings yet.</p>;
  }

  return (
    <div className="mt-3 space-y-5">
      <p className="text-[12px] text-[#8a8477]">
        Changes until {CANCEL_WINDOW_HOURS} hours before.
      </p>
      {msg && <p className="rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[13px]">{msg}</p>}

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-[#8a8477]">None yet.</p>
        ) : (
          upcoming.map((row) => renderBooking(row, true))
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Past</p>
          {pastCount > 0 ? (
            <p className="text-[12px] text-[#8a8477]">{pastCount} booking{pastCount === 1 ? "" : "s"}</p>
          ) : null}
        </div>
        {pastCount === 0 ? (
          <p className="text-[13px] text-[#8a8477]">None yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#ece8e2]">
            {pastByMonth.map((month) => {
              const open = month.key === activePastMonth;
              return (
                <div key={month.key} className="border-b border-[#ece8e2] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpenPastMonth(open ? null : month.key)}
                    className="flex w-full items-center justify-between gap-3 bg-[#faf9f7] px-3.5 py-3 text-left transition hover:bg-[#f5f3ef]"
                    aria-expanded={open}
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-[#1a1a1a]">{month.label}</span>
                      <span className="mt-0.5 block text-[12px] text-[#8a8477]">
                        {month.items.length} booking{month.items.length === 1 ? "" : "s"} · ${month.total}
                      </span>
                    </span>
                    <span className="text-[16px] leading-none text-[#8a8477]" aria-hidden>
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open ? (
                    <ul className="divide-y divide-[#f0ede8] bg-white">{month.items.map(renderPastRow)}</ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
