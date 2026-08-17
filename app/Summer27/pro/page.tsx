"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  clinicProIds,
  clinicTimeLabel,
  findProByLogin,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  parseDateInput,
  proDayHours,
  s27Pros,
  syncProSchedule,
  type ProDef,
} from "../summer27-data";
import { getCatalog, getLivePros, saveCatalog } from "../schedule";
import { bookingProId, lessonSpan } from "../lesson-slots";
import {
  KEYS,
  loadList,
  saveList,
  type S27ClinicBooking,
  type S27LessonBooking,
} from "../storage";
import {
  clearS27ProSession,
  writeS27ProSession,
} from "../pro-session";
import { useS27ProSession } from "../use-s27-pro-session";
import ProHoursEditor from "../ProHoursEditor";

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
  kind: "lesson" | "clinic" | "request";
  title: string;
  sub: string;
};

export default function ProPortalPage() {
  const session = useS27ProSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pros, setPros] = useState<ProDef[]>(s27Pros);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [tab, setTab] = useState<Tab>("week");
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [hoursDraft, setHoursDraft] = useState(proDayHours(s27Pros[0]));
  const [savedNote, setSavedNote] = useState<string | null>(null);

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
  }

  useEffect(() => {
    reload();
  }, []);

  const pro = pros.find((p) => p.id === session?.proId) || null;

  useEffect(() => {
    if (pro) setHoursDraft(proDayHours(pro));
  }, [pro?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    const match = findProByLogin(pros.length ? pros : s27Pros, email, password);
    if (!match) {
      setMsg("Check email and password.");
      return;
    }
    writeS27ProSession({
      proId: match.id,
      proEmail: match.email || email.trim(),
      proName: match.name,
      signedInAt: new Date().toISOString(),
    });
    setMsg(null);
    setPassword("");
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
    const map = new Map<
      string,
      { name: string; email: string; count: number; hours: number; amount: number; last: string }
    >();
    for (const b of confirmed) {
      const key = (b.clientEmail || b.clientName).trim().toLowerCase();
      const row = map.get(key) || {
        name: b.clientName,
        email: b.clientEmail,
        count: 0,
        hours: 0,
        amount: 0,
        last: b.date,
      };
      row.count += 1;
      row.hours += lessonHours(b);
      row.amount += Number(b.amount) || 0;
      if (b.date > row.last) row.last = b.date;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last) || a.name.localeCompare(b.name));
  }, [confirmed]);

  function setLessonStatus(id: string, status: "accepted" | "declined") {
    const next = lessons.map((x) => (x.id === id ? { ...x, requestStatus: status } : x));
    saveList(KEYS.lessons, next);
    setLessons(next);
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
        <p className="mt-2 text-[13px] text-[#6b665e]">Use the portal email and password from Program Settings.</p>
        <form onSubmit={signIn} className="mt-5 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            autoComplete="current-password"
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
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="min-w-[52rem] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white sm:min-w-0">
              <div className="grid grid-cols-7 border-b border-[#ece8e2] bg-[#faf9f7]">
                {days.map((iso, i) => {
                  const d = parseDateInput(iso);
                  const isToday = iso === today;
                  return (
                    <div key={iso} className={`border-r border-[#ece8e2] px-1 py-2 text-center last:border-r-0 ${isToday ? "bg-[#dbeafe]" : ""}`}>
                      <p className="text-[9px] uppercase tracking-[0.1em] text-[#64748b]">{DAY_LABELS[i]}</p>
                      <p className={`mt-0.5 text-[13px] font-semibold ${isToday ? "text-[#1e3a8a]" : "text-[#0f172a]"}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7">
                {days.map((iso) => {
                  const items = itemsByDay[iso] || [];
                  return (
                    <div key={iso} className="min-h-[14rem] border-r border-[#ece8e2] p-1.5 last:border-r-0">
                      {items.length === 0 ? (
                        <p className="px-0.5 py-2 text-center text-[11px] text-[#d0cbc3]">—</p>
                      ) : (
                        <div className="space-y-1">
                          {items.map((item) => (
                            <div
                              key={item.key}
                              className={`rounded-md px-1.5 py-1.5 text-white ${
                                item.kind === "clinic"
                                  ? "bg-[#16a34a]"
                                  : item.kind === "request"
                                    ? "bg-[#ea580c]"
                                    : "bg-[#3b82f6]"
                              }`}
                            >
                              <p className="text-[9px] font-semibold tabular-nums text-white/85">{formatHour(item.time)}</p>
                              <p className="mt-0.5 truncate text-[10px] font-semibold leading-snug">{item.title}</p>
                              <p className="truncate text-[9px] text-white/80">{item.sub}</p>
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
        </section>
      ) : null}

      {tab === "clients" ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
          {clients.length === 0 ? (
            <p className="px-4 py-5 text-[14px] text-[#8a8477]">No lessons on the book yet.</p>
          ) : (
            <ul className="divide-y divide-[#f0ede8]">
              {clients.map((c) => (
                <li key={c.email || c.name} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-[15px] font-medium">{c.name}</p>
                    <p className="text-[12px] text-[#8a8477]">Last {formatPrettyDate(c.last)}</p>
                  </div>
                  <p className="text-[13px] text-[#6b665e]">
                    {c.count} lesson{c.count === 1 ? "" : "s"} · {formatHrs(c.hours)}
                  </p>
                </li>
              ))}
            </ul>
          )}
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
