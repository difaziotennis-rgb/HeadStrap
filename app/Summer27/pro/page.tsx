"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BOOKING_HOURS,
  clinicProIds,
  clinicTimeLabel,
  findProByLogin,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonRateForPro,
  parseDateInput,
  proDayHours,
  s27Pros,
  syncProSchedule,
  type ProDef,
} from "../summer27-data";
import { getCatalog, getLivePros, saveCatalog } from "../schedule";
import { bookingProId, lessonConflict, lessonSpan } from "../lesson-slots";
import {
  KEYS,
  loadList,
  loadRecord,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27LessonBooking,
  type S27MemberAccount,
} from "../storage";
import { clientsForPro, persistLessons, type S27ProClient } from "../pro-clients";
import {
  clearS27ProSession,
  writeS27ProSession,
} from "../pro-session";
import { useS27ProSession } from "../use-s27-pro-session";
import ProHoursEditor from "../ProHoursEditor";
import { SHEET_HEIGHT, SHEET_ROWS, SheetHourLines, SheetTimeColumn, packOverlaps, sheetBlockStyle, sheetRowSpan } from "../sheet-grid";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Tab = "week" | "clients" | "hours";

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

function lessonHours(b: S27LessonBooking) {
  return lessonSpan(b.duration);
}

type DayItem = {
  key: string;
  time: number;
  durationHours: number;
  kind: "lesson" | "clinic" | "request";
  title: string;
  sub: string;
};

export default function ProPortalPage() {
  const session = useS27ProSession();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pros, setPros] = useState<ProDef[]>(s27Pros);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [savedClients, setSavedClients] = useState<S27ProClient[]>([]);
  const [tab, setTab] = useState<Tab>("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [hoursDraft, setHoursDraft] = useState(proDayHours(s27Pros[0]));
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [bookMember, setBookMember] = useState("");
  const [bookDate, setBookDate] = useState(() => formatDateInput(new Date()));
  const [bookHour, setBookHour] = useState("9");
  const [bookMsg, setBookMsg] = useState<string | null>(null);

  const today = formatDateInput(new Date());
  const thisWeekStart = useMemo(() => startOfWeekMonday(parseDateInput(today)), [today]);

  function reload() {
    try {
      const live = getLivePros();
      if (live.length) setPros(live);
    } catch {
      setPros(s27Pros);
    }
    setLessons(loadList<S27LessonBooking>(KEYS.lessons));
    setClinics(loadList<S27ClinicBooking>(KEYS.clinics));
    setMembers(loadList<S27MemberAccount>(KEYS.members));
    setCourts(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)));
  }

  useEffect(() => {
    reload();
  }, []);

  const pro = pros.find((p) => p.id === session?.proId) || null;

  useEffect(() => {
    if (pro) setHoursDraft(proDayHours(pro));
  }, [pro?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pro) return;
    persistLessons(loadList<S27LessonBooking>(KEYS.lessons));
    setSavedClients(clientsForPro(pro.id));
  }, [pro?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    const match = findProByLogin(pros.length ? pros : s27Pros, name);
    if (!match) {
      setMsg("Try your first name — Jonah, Maya, Derek.");
      return;
    }
    writeS27ProSession({
      proId: match.id,
      proEmail: match.email || name.trim(),
      proName: match.name,
      signedInAt: new Date().toISOString(),
    });
    setMsg(null);
    setName("");
  }

  const mine = useMemo(
    () =>
      lessons.filter((b) => pro && bookingProId(b) === pro.id && b.requestStatus !== "declined"),
    [lessons, pro]
  );
  const requests = mine.filter((b) => b.requestStatus === "requested");
  const confirmed = mine.filter((b) => b.requestStatus !== "requested");

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formatDateInput(addDays(weekStart, i))),
    [weekStart]
  );

  const assignedClinics = useMemo(() => {
    if (!pro) return [];
    try {
      return getCatalog().clinics.filter((c) => clinicProIds(c).includes(pro.id));
    } catch {
      return [];
    }
  }, [pro]);

  const itemsByDay = useMemo(() => {
    const map: Record<string, DayItem[]> = {};
    for (const iso of days) map[iso] = [];
    if (!pro) return map;

    for (const b of mine) {
      if (!map[b.date]) continue;
      const requested = b.requestStatus === "requested";
      map[b.date].push({
        key: `lesson-${b.id}`,
        time: b.hour,
        durationHours: lessonHours(b),
        kind: requested ? "request" : "lesson",
        title: requested ? "Request" : "Lesson",
        sub: `${b.clientName.split(" ")[0]} · ${b.duration}m`,
      });
    }

    for (const iso of days) {
      const jsDay = parseDateInput(iso).getDay();
      for (const clinic of assignedClinics) {
        if (!clinic.days.includes(jsDay)) continue;
        const count = clinics.filter((x) => x.clinicId === clinic.id && x.date === iso).length;
        map[iso].push({
          key: `clinic-${clinic.id}-${iso}`,
          time: Number(clinic.startHour) || 8,
          durationHours: Number(clinic.durationHours) || 1,
          kind: "clinic",
          title: clinic.name.replace(/\s+Clinic$/i, ""),
          sub: `${clinicTimeLabel(clinic)} · ${count} in`,
        });
      }
    }

    for (const iso of days) {
      map[iso].sort((a, b) => a.time - b.time || a.title.localeCompare(b.title));
    }
    return map;
  }, [days, mine, assignedClinics, clinics, pro]);

  function hoursInRange(from: string, to: string) {
    let total = 0;
    for (const b of confirmed) {
      if (b.date < from || b.date > to) continue;
      total += lessonHours(b);
    }
    for (const iso of daysInRange(from, to)) {
      const jsDay = parseDateInput(iso).getDay();
      for (const clinic of assignedClinics) {
        if (!clinic.days.includes(jsDay)) continue;
        total += Number(clinic.durationHours) || 0;
      }
    }
    return total;
  }

  const thisWeekEnd = formatDateInput(addDays(thisWeekStart, 6));
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = today.slice(0, 7) + "-31";
  const weekHrs = hoursInRange(formatDateInput(thisWeekStart), thisWeekEnd);
  const monthHrs = hoursInRange(monthStart, monthEnd);
  const lessonHrsAll = confirmed.reduce((sum, b) => sum + lessonHours(b), 0);

  const clients = useMemo(() => {
    const stats = new Map<string, { count: number; hours: number; last: string }>();
    const keyFor = (memberNumber?: string, email?: string, name?: string) =>
      memberNumber ? `m:${memberNumber}` : email?.trim() ? `e:${email.trim().toLowerCase()}` : `n:${(name || "").trim().toLowerCase()}`;
    for (const b of confirmed) {
      const key = keyFor(b.memberNumber, b.clientEmail, b.clientName);
      const row = stats.get(key) || { count: 0, hours: 0, last: b.date };
      row.count += 1;
      row.hours += lessonHours(b);
      if (b.date > row.last) row.last = b.date;
      stats.set(key, row);
    }
    const fromSaved = savedClients.map((c) => {
      const key = keyFor(c.memberNumber, c.email, c.name);
      const s = stats.get(key);
      return {
        key: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        memberNumber: c.memberNumber,
        count: s?.count || 0,
        hours: s?.hours || 0,
        last: s?.last || "",
      };
    });
    const seen = new Set(fromSaved.map((c) => keyFor(c.memberNumber, c.email, c.name)));
    for (const b of confirmed) {
      const key = keyFor(b.memberNumber, b.clientEmail, b.clientName);
      if (seen.has(key)) continue;
      seen.add(key);
      const s = stats.get(key);
      fromSaved.push({
        key,
        name: b.clientName,
        email: b.clientEmail,
        phone: b.clientPhone || "",
        memberNumber: b.memberNumber,
        count: s?.count || 1,
        hours: s?.hours || lessonHours(b),
        last: s?.last || b.date,
      });
    }
    return fromSaved.sort((a, b) => (b.last || "").localeCompare(a.last || "") || a.name.localeCompare(b.name));
  }, [confirmed, savedClients]);

  function setLessonStatus(id: string, status: "accepted" | "declined") {
    const next = lessons.map((x) => (x.id === id ? { ...x, requestStatus: status } : x));
    persistLessons(next);
    setLessons(next);
    if (pro) setSavedClients(clientsForPro(pro.id));
  }

  function scheduleLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!pro) return;
    const member = members.find((m) => m.memberNumber === bookMember);
    if (!member) {
      setBookMsg("Pick a member.");
      return;
    }
    const hour = Number(bookHour);
    const conflict = lessonConflict({
      pro,
      date: bookDate,
      hour,
      duration: "60",
      lessons,
      courts,
    });
    if (conflict) {
      setBookMsg(conflict);
      return;
    }
    const booking: S27LessonBooking = {
      id: `lesson-${Date.now()}`,
      date: bookDate,
      hour,
      duration: "60",
      clientName: member.name,
      clientEmail: member.email,
      clientPhone: member.phone || "",
      memberNumber: member.memberNumber,
      proId: pro.id,
      proName: pro.name,
      courtId: pro.courtId,
      focus: "",
      amount: lessonRateForPro(pro, true),
      paymentStatus: "paid",
      paymentMethod: "manual",
      requestStatus: "accepted",
      createdAt: new Date().toISOString(),
    };
    const next = [...lessons, booking];
    persistLessons(next);
    setLessons(next);
    setSavedClients(clientsForPro(pro.id));
    setBookMember("");
    setBookMsg(`Saved ${member.name} · ${formatPrettyDate(bookDate)} ${formatHour(hour)}.`);
  }

  function saveHours() {
    if (!pro) return;
    const catalog = getCatalog();
    const nextPro = syncProSchedule({ ...pro, dayHours: hoursDraft });
    saveCatalog({
      ...catalog,
      pros: catalog.pros.map((p) => (p.id === pro.id ? nextPro : p)),
    });
    setPros((list) => list.map((p) => (p.id === pro.id ? nextPro : p)));
    setSavedNote("Hours saved.");
    window.setTimeout(() => setSavedNote(null), 2000);
  }

  if (!session || !pro) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Pro desk</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-2 text-[13px] text-[#6b665e]">Type your first name.</p>
        <form onSubmit={signIn} className="mt-5 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jonah"
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            autoComplete="username"
            autoFocus
          />
          {msg ? <p className="text-[13px] text-[#991b1b]">{msg}</p> : null}
          <button type="submit" className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white">
            Open desk
          </button>
        </form>
      </main>
    );
  }

  const isThisWeek = formatDateInput(weekStart) === formatDateInput(thisWeekStart);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Pro desk</p>
          <h2 className="text-2xl font-semibold tracking-tight">{pro.name.split(" ")[0]}</h2>
          <p className="mt-1 text-[13px] text-[#6b665e]">{pro.title}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            clearS27ProSession();
          }}
          className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px] text-[#6b665e]"
        >
          Sign out
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="This week" value={`${formatHrs(weekHrs)}`} />
        <Stat label="This month" value={`${formatHrs(monthHrs)}`} />
        <Stat label="Lesson hours" value={`${formatHrs(lessonHrsAll)}`} />
      </div>

      {requests.length > 0 ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
            Requests
          </p>
          <ul className="divide-y divide-[#f0ede8]">
            {requests.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="text-[15px] font-medium">{b.clientName}</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {formatPrettyDate(b.date)} · {formatHour(b.hour)} · {b.duration} min
                    {b.focus ? ` · ${b.focus}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLessonStatus(b.id, "accepted")}
                    className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] font-medium text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonStatus(b.id, "declined")}
                    className="rounded-lg border border-[#e8e5df] px-3 py-1.5 text-[12px] text-[#6b665e]"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-4 flex rounded-full border border-[#e8e5df] bg-white p-1">
        {(
          [
            { id: "week" as const, label: "Week" },
            { id: "clients" as const, label: "Clients" },
            { id: "hours" as const, label: "Hours" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-full px-3 py-2 text-[13px] font-medium ${
              tab === item.id ? "bg-[#1a1a1a] text-white" : "text-[#6b665e]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "week" ? (
        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[13px] text-[#4a4a4a]"
              aria-label="Previous week"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-[15px] font-medium">{weekRangeLabel(weekStart)}</p>
              {!isThisWeek ? (
                <button
                  type="button"
                  onClick={() => setWeekStart(thisWeekStart)}
                  className="text-[12px] text-[#8a8477] underline-offset-2 hover:underline"
                >
                  This week
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[13px] text-[#4a4a4a]"
              aria-label="Next week"
            >
              →
            </button>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-x-auto sm:px-0">
            <div className="min-w-[52rem] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
              <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] border-b border-[#ece8e2] bg-[#faf9f7] sm:grid-cols-[3.75rem_repeat(7,minmax(0,1fr))]">
                <div className="sticky left-0 z-10 border-r border-[#ece8e2] bg-[#faf9f7] px-1 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#8a8477] sm:px-2 sm:py-2.5">
                  Time
                </div>
                {days.map((iso, i) => {
                  const d = parseDateInput(iso);
                  const isToday = iso === today;
                  return (
                    <div
                      key={iso}
                      className={`border-r border-[#ece8e2] px-1 py-2 text-center last:border-r-0 sm:px-2 sm:py-2.5 ${
                        isToday ? "bg-[#dbeafe]" : ""
                      }`}
                    >
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#64748b]">{DAY_LABELS[i]}</p>
                      <p className={`mt-0.5 text-[13px] font-semibold ${isToday ? "text-[#1e3a8a]" : "text-[#0f172a]"}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div
                className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.75rem_repeat(7,minmax(0,1fr))]"
                style={{ minHeight: SHEET_HEIGHT }}
              >
                <SheetTimeColumn />
                {days.map((iso) => {
                  const items = itemsByDay[iso] || [];
                  const placed = packOverlaps(items);
                  const isToday = iso === today;
                  return (
                    <div
                      key={iso}
                      className={`relative border-r border-[#ece8e2] last:border-r-0 ${
                        isToday ? "bg-[#f0f9ff]" : "bg-white"
                      }`}
                      style={{ height: SHEET_HEIGHT, minHeight: SHEET_HEIGHT }}
                    >
                      <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateRows: SHEET_ROWS }}>
                        <SheetHourLines />
                      </div>
                      {placed.map((slot) => {
                        const span = sheetRowSpan(slot.item.time, slot.item.durationHours);
                        const widthPct = 100 / slot.cols;
                        const leftPct = (slot.col / slot.cols) * 100;
                        return (
                          <div
                            key={slot.item.key}
                            className="absolute z-[2] box-border py-px"
                            style={sheetBlockStyle(slot.item.time, slot.item.durationHours, leftPct, widthPct)}
                          >
                            <div
                              className={`flex h-full w-full flex-col justify-center overflow-hidden rounded-md px-1 py-0.5 text-white sm:px-1.5 ${
                                slot.item.kind === "clinic"
                                  ? "bg-[#16a34a]"
                                  : slot.item.kind === "request"
                                    ? "bg-[#ea580c]"
                                    : "bg-[#3b82f6]"
                              }`}
                            >
                              <p className="truncate text-[10px] font-semibold leading-tight sm:text-[11px]">{slot.item.title}</p>
                              {span > 1 && slot.cols === 1 ? (
                                <p className="mt-0.5 truncate text-[9px] text-white/80 sm:text-[10px]">{slot.item.sub}</p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "clients" ? (
        <section className="mt-4 space-y-3">
          <form onSubmit={scheduleLesson} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-4">
            <select
              className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-2 text-[13px]"
              value={bookMember}
              onChange={(e) => setBookMember(e.target.value)}
            >
              <option value="">Member</option>
              {members
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.memberNumber} value={m.memberNumber}>
                    {m.name} · #{m.memberNumber}
                  </option>
                ))}
            </select>
            <input
              type="date"
              className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-2 text-[13px]"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
            />
            <select
              className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-2 text-[13px]"
              value={bookHour}
              onChange={(e) => setBookHour(e.target.value)}
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">
              Schedule lesson
            </button>
            {bookMsg ? (
              <p className={`sm:col-span-4 text-[13px] ${bookMsg.startsWith("Saved") ? "text-[#3d5c34]" : "text-[#991b1b]"}`}>
                {bookMsg}
              </p>
            ) : null}
          </form>
          <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
            <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              {clients.length} client{clients.length === 1 ? "" : "s"}
            </p>
            {clients.length === 0 ? (
              <p className="px-4 py-5 text-[14px] text-[#8a8477]">No clients yet — schedule a lesson to add one.</p>
            ) : (
              <ul className="divide-y divide-[#f0ede8]">
                {clients.map((c) => (
                  <li key={c.key} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                    <div>
                      <p className="text-[15px] font-medium">{c.name}</p>
                      <p className="text-[12px] text-[#8a8477]">
                        {c.memberNumber ? `#${c.memberNumber}` : "Guest"}
                        {c.phone ? ` · ${c.phone}` : ""}
                        {c.email ? ` · ${c.email}` : ""}
                      </p>
                    </div>
                    <p className="text-[13px] text-[#6b665e]">
                      {c.count
                        ? `${c.count} lesson${c.count === 1 ? "" : "s"} · ${formatHrs(c.hours)}${c.last ? ` · last ${formatPrettyDate(c.last)}` : ""}`
                        : "Saved"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "hours" ? (
        <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
          <p className="text-[13px] text-[#6b665e]">
            Set the hours you’re available to teach. Members only see open times inside these windows.
          </p>
          <div className="mt-4">
            <ProHoursEditor value={hoursDraft} onChange={setHoursDraft} />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={saveHours}
              className="rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-medium text-white"
            >
              Save hours
            </button>
            {savedNote ? <p className="text-[13px] text-[#3d5c34]">{savedNote}</p> : null}
          </div>
        </section>
      ) : null}

      <p className="mt-6 text-[12px] text-[#8a8477]">
        <Link href="/Summer27" className="hover:text-[#1a1a1a]">
          ← Club site
        </Link>
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e8e5df] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{label}</p>
      <p className="mt-1 text-[18px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function formatHrs(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return `${rounded}h`;
}

function daysInRange(from: string, to: string): string[] {
  const out: string[] = [];
  let d = parseDateInput(from);
  const end = parseDateInput(to);
  for (let i = 0; i < 40 && d <= end; i++) {
    out.push(formatDateInput(d));
    d = addDays(d, 1);
  }
  return out;
}
