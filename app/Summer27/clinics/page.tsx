"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { PayChooser } from "../PayChooser";
import {
  clinicTimeLabel,
  formatDateInput,
  formatHour,
  parseDateInput,
  s27Clinics,
  type ClinicDef,
} from "../summer27-data";
import { getLiveClinics } from "../schedule";
import { KEYS, loadList, saveList, type S27ClinicBooking } from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Occurrence = {
  clinic: ClinicDef;
  date: string;
  dayIndex: number; // 0 = Mon … 6 = Sun
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

function weekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => formatDateInput(addDays(weekStart, i)));
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

function nextDatesForClinic(clinic: ClinicDef | undefined, count = 8, extra?: string): string[] {
  const dates: string[] = [];
  if (!clinic || !Array.isArray(clinic.days)) return dates;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (clinic.days.includes(d.getDay())) dates.push(formatDateInput(d));
  }
  if (extra && clinic.days.includes(parseDateInput(extra).getDay()) && !dates.includes(extra)) {
    dates.push(extra);
    dates.sort();
  }
  return dates;
}

function shortClinicName(name: string): string {
  return name
    .replace(/\s+Clinic$/i, "")
    .replace(/^Weekend\s+/i, "")
    .replace(/^Weeknight\s+/i, "")
    .replace(/^Midweek\s+/i, "");
}

function occurrencesForWeek(clinics: ClinicDef[], weekStart: Date): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 0; i < 7; i++) {
    const date = formatDateInput(addDays(weekStart, i));
    const jsDay = parseDateInput(date).getDay();
    for (const clinic of clinics) {
      if (!clinic.days.includes(jsDay)) continue;
      out.push({ clinic, date, dayIndex: i });
    }
  }
  return out.sort((a, b) => a.dayIndex - b.dayIndex || a.clinic.startHour - b.clinic.startHour);
}

export default function Summer27ClinicsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading clinics…</div>}>
      <Summer27ClinicsInner />
    </Suspense>
  );
}

function Summer27ClinicsInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const queryClinic = searchParams.get("clinic") || "";
  const queryDate = searchParams.get("date") || "";

  const [bookings, setBookings] = useState<S27ClinicBooking[]>([]);
  const [clinics, setClinics] = useState<ClinicDef[]>(s27Clinics.filter((c) => c.kind === "adult"));
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(queryDate ? parseDateInput(queryDate) : new Date())
  );
  const [selectedId, setSelectedId] = useState(
    () =>
      (queryClinic && s27Clinics.some((c) => c.id === queryClinic && c.kind === "adult")
        ? queryClinic
        : "") || ""
  );
  const [sheetOpen, setSheetOpen] = useState(() => Boolean(queryClinic));
  const [date, setDate] = useState(queryDate);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clinic = clinics.find((c) => c.id === selectedId);
  const dates = useMemo(() => nextDatesForClinic(clinic, 8, queryDate || date), [clinic, queryDate, date]);
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const price = clinic ? (isMember ? clinic.memberPrice : clinic.guestPrice) : 0;
  const todayIso = formatDateInput(new Date());
  const thisWeekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const occurrences = useMemo(() => occurrencesForWeek(clinics, weekStart), [clinics, weekStart]);

  useEffect(() => {
    try {
      const live = getLiveClinics().filter((c) => c.kind === "adult");
      if (live.length) {
        setClinics(live);
        setSelectedId((id) => {
          const preferred = queryClinic || id;
          if (preferred && live.some((c) => c.id === preferred)) return preferred;
          return id;
        });
      }
    } catch {
      // keep defaults
    }
    setBookings(loadList<S27ClinicBooking>(KEYS.clinics));
  }, [queryClinic]);

  useEffect(() => {
    if (!sheetOpen || !clinic) return;
    if (queryDate && dates.includes(queryDate)) {
      setDate(queryDate);
      return;
    }
    if (!date || !dates.includes(date)) setDate(dates[0] || "");
  }, [dates, date, queryDate, sheetOpen, clinic]);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27ClinicBooking>(KEYS.clinics).map((b) =>
        b.id === bookingId ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : b
      );
      saveList(KEYS.clinics, all);
      setBookings(all);
      setMsg("You’re on the roster.");
      setSheetOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  const rosterByClinicDate = useMemo(() => {
    const map: Record<string, S27ClinicBooking[]> = {};
    for (const b of bookings) {
      if (b.paymentStatus !== "paid") continue;
      const key = `${b.clinicId}|${b.date}`;
      (map[key] ||= []).push(b);
    }
    return map;
  }, [bookings]);

  const roster = clinic && date ? rosterByClinicDate[`${clinic.id}|${date}`] || [] : [];
  const seatsLeft = clinic ? Math.max(0, clinic.capacity - roster.length) : 0;
  const alreadyIn =
    !!session && roster.some((b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail);

  const dateChips = useMemo(
    () =>
      dates.map((d) => {
        if (!clinic) return dateChipFromIso(d);
        const taken = (rosterByClinicDate[`${clinic.id}|${d}`] || []).length;
        const open = Math.max(0, clinic.capacity - taken);
        return dateChipFromIso(d, open <= 0 ? "Full" : `${open} open`);
      }),
    [dates, rosterByClinicDate, clinic]
  );

  function openClinic(c: ClinicDef, occurrenceDate: string) {
    setSelectedId(c.id);
    setDate(occurrenceDate);
    setMsg(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setMsg(null);
  }

  async function signUp(method: S27PayMethod) {
    const name = isMember ? session!.memberName : guestName.trim();
    const email = isMember ? session!.memberEmail : guestEmail.trim();
    if (!name || !email) {
      setMsg("Name and email required.");
      return;
    }
    if (seatsLeft <= 0) {
      setMsg("This session is full.");
      return;
    }
    if (alreadyIn) {
      setMsg("You’re already on this roster.");
      return;
    }

    if (!clinic) return;
    const id = `clinic-${Date.now()}`;
    const booking: S27ClinicBooking = {
      id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date,
      clientName: name,
      clientEmail: email,
      memberNumber: session?.memberNumber,
      amount: price,
      paymentStatus: "pending",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    setPaying(true);
    const result = await startMemberPayment({
      method,
      amount: price,
      email,
      description: `${clinic.name} · ${date}`,
      successPath: "/Summer27/clinics",
      bookingId: id,
      metadata: { type: "clinic", clinicId: clinic.id, date },
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }

    if (result.kind === "saved-card") {
      booking.paymentStatus = "paid";
      booking.paymentMethod = "saved-card";
      const next = [...bookings, booking];
      saveList(KEYS.clinics, next);
      setBookings(next);
      setPaying(false);
      setMsg(`You’re in. $${price} charged.`);
      return;
    }

    const next = [...bookings, booking];
    saveList(KEYS.clinics, next);
    setBookings(next);
    setPaying(false);

    if (result.kind === "redirect") {
      window.location.href = result.url;
      return;
    }

    setMsg(
      result.method === "venmo"
        ? "Booking held. Finish in Venmo — we’ll confirm once it arrives."
        : "Booking held. Finish in PayPal — we’ll confirm once it arrives."
    );
  }

  const isThisWeek = formatDateInput(weekStart) === formatDateInput(thisWeekStart);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Weekly group play</h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
        Tap a session to book. One hour $50 · 90 minutes $80.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
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
              onClick={() => setWeekStart(thisWeekStart)}
              className="mt-0.5 text-[12px] text-[#8a8477] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
            >
              This week
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
          className="rounded-full border border-[#e8e5df] bg-white px-3.5 py-2 text-[13px] text-[#4a4a4a] hover:bg-[#faf9f7]"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      {/* Mobile / tablet: day agenda */}
      <div className="mt-5 space-y-3 md:hidden">
        {days.map((iso, dayIndex) => {
          const dayOcc = occurrences.filter((o) => o.dayIndex === dayIndex);
          const d = parseDateInput(iso);
          const isToday = iso === todayIso;
          return (
            <section
              key={iso}
              className={`rounded-2xl border px-3 py-3 ${
                isToday ? "border-[#1a1a1a]/25 bg-white" : "border-[#e8e5df] bg-[#faf9f7]"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-[#1a1a1a]">
                  {DAY_LABELS[dayIndex]}{" "}
                  <span className="text-[#8a8477]">
                    {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </p>
                {isToday && <span className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Today</span>}
              </div>
              {dayOcc.length === 0 ? (
                <p className="py-1 text-[12px] text-[#b0a99f]">No clinics</p>
              ) : (
                <ul className="space-y-2">
                  {dayOcc.map((o) => {
                    const taken = (rosterByClinicDate[`${o.clinic.id}|${o.date}`] || []).length;
                    const open = Math.max(0, o.clinic.capacity - taken);
                    return (
                      <li key={`${o.clinic.id}-${o.date}`}>
                        <button
                          type="button"
                          onClick={() => openClinic(o.clinic, o.date)}
                          className="flex w-full items-start gap-3 rounded-xl border border-[#ece8e2] bg-white px-3 py-3 text-left transition hover:border-[#1a1a1a]/40"
                        >
                          <span className="w-14 shrink-0 pt-0.5 text-[12px] font-medium tabular-nums text-[#6b665e]">
                            {formatHour(o.clinic.startHour)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium text-[#1a1a1a]">{o.clinic.name}</span>
                            <span className="mt-0.5 block text-[12px] text-[#8a8477]">
                              {clinicTimeLabel(o.clinic)} · {open > 0 ? `${open} open` : "Full"} · $
                              {o.clinic.memberPrice}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {/* Desktop: week grid */}
      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-[#e8e5df] bg-white md:block">
        <div className="grid grid-cols-7 border-b border-[#ece8e2] bg-[#faf9f7]">
          {days.map((iso, i) => {
            const d = parseDateInput(iso);
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`border-r border-[#ece8e2] px-2 py-2.5 text-center last:border-r-0 ${
                  isToday ? "bg-white" : ""
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{DAY_LABELS[i]}</p>
                <p className={`mt-0.5 text-[15px] font-semibold ${isToday ? "text-[#1a1a1a]" : "text-[#4a4a4a]"}`}>
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7">
          {days.map((iso, dayIndex) => {
            const dayOcc = occurrences.filter((o) => o.dayIndex === dayIndex);
            const isToday = iso === todayIso;
            return (
              <div
                key={iso}
                className={`min-h-[14rem] border-r border-[#ece8e2] p-2 last:border-r-0 ${
                  isToday ? "bg-[#faf9f7]/60" : ""
                }`}
              >
                {dayOcc.length === 0 ? (
                  <p className="px-1 py-2 text-center text-[11px] text-[#d0cbc3]">—</p>
                ) : (
                  <ul className="space-y-1.5">
                    {dayOcc.map((o) => {
                      const taken = (rosterByClinicDate[`${o.clinic.id}|${o.date}`] || []).length;
                      const open = Math.max(0, o.clinic.capacity - taken);
                      return (
                        <li key={`${o.clinic.id}-${o.date}`}>
                          <button
                            type="button"
                            onClick={() => openClinic(o.clinic, o.date)}
                            className="w-full rounded-lg border border-[#e8e5df] bg-[#f7f7f5] px-2 py-2 text-left transition hover:border-[#1a1a1a] hover:bg-white"
                          >
                            <span className="block text-[11px] font-medium tabular-nums text-[#6b665e]">
                              {formatHour(o.clinic.startHour)}
                            </span>
                            <span className="mt-0.5 block text-[12px] font-medium leading-snug text-[#1a1a1a]">
                              {shortClinicName(o.clinic.name)}
                            </span>
                            <span className="mt-1 block text-[10px] text-[#8a8477]">
                              {open > 0 ? `${open} open` : "Full"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-[#8a8477]">
        <Link href="/Summer27/juniors" className="hover:text-[#1a1a1a]">
          Junior hours →
        </Link>
      </p>

      {sheetOpen && clinic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close clinic details"
            className="absolute inset-0 bg-[#1a1a1a]/40"
            onClick={closeSheet}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clinic-sheet-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#e8e5df] bg-white shadow-xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-5 pb-4 pt-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Book clinic</p>
                <h3 id="clinic-sheet-title" className="mt-1 text-xl font-semibold tracking-tight text-[#1a1a1a]">
                  {clinic.name}
                </h3>
                <p className="mt-1 text-[13px] text-[#6b665e]">{clinic.level}</p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8e5df] text-[18px] leading-none text-[#6b665e] hover:bg-[#faf9f7] hover:text-[#1a1a1a]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <p className="text-[13px] leading-relaxed text-[#6b665e]">{clinic.description}</p>
              <p className="mt-2 text-[12px] text-[#8a8477]">
                {clinicTimeLabel(clinic)} · ${clinic.memberPrice} members · ${clinic.guestPrice} guests
              </p>

              <p className="mb-2 mt-5 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Choose a date</p>
              <DateChips items={dateChips} value={date} onChange={setDate} ariaLabel="Clinic dates" />

              <div className="mt-4 rounded-xl bg-[#faf9f7] px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Roster</p>
                  <p className="text-[12px] text-[#6b665e]">
                    {roster.length}/{clinic.capacity} · {seatsLeft} open
                  </p>
                </div>
                {roster.length === 0 ? (
                  <p className="mt-2 text-[13px] text-[#8a8477]">None yet.</p>
                ) : (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {roster.map((b) => (
                      <li key={b.id} className="text-[13px] text-[#4a4a4a]">
                        {b.clientName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 space-y-3 pb-2">
                {!isMember && (
                  <>
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Name"
                      className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                    />
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                    />
                  </>
                )}
                {msg && <p className="text-[13px] text-[#4a4a4a]">{msg}</p>}
                {seatsLeft <= 0 ? (
                  <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">Full</p>
                ) : alreadyIn ? (
                  <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">
                    You’re signed up
                  </p>
                ) : (
                  <PayChooser
                    amount={price}
                    savedCard={savedCard}
                    paying={paying}
                    primaryLabel={`Join · $${price}`}
                    onPay={signUp}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
