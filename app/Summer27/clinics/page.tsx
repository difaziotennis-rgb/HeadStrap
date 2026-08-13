"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startGuestCheckout, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { PayChooser } from "../PayChooser";
import {
  clinicTimeLabel,
  clinicsSuspendedOnDate,
  formatDateInput,
  formatHour,
  parseDateInput,
  s27Clinics,
  s27Events,
  type ClinicDef,
  type EventDef,
} from "../summer27-data";
import { getLiveClinics, getLiveEvents } from "../schedule";
import { KEYS, findMemberAccount, loadList, saveList, type S27ClinicBooking, type S27MemberChild } from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";
import { canChangeBooking, CANCEL_WINDOW_HOURS } from "../booking-policy";

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

function nextDatesForClinic(
  clinic: ClinicDef | undefined,
  count = 8,
  extra?: string,
  events: EventDef[] = s27Events
): string[] {
  const dates: string[] = [];
  if (!clinic || !Array.isArray(clinic.days)) return dates;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = formatDateInput(d);
    if (!clinic.days.includes(d.getDay())) continue;
    if (clinicsSuspendedOnDate(iso, events)) continue;
    dates.push(iso);
  }
  if (
    extra &&
    clinic.days.includes(parseDateInput(extra).getDay()) &&
    !clinicsSuspendedOnDate(extra, events) &&
    !dates.includes(extra)
  ) {
    dates.push(extra);
    dates.sort();
  }
  return dates;
}

function shortClinicName(name: string): string {
  return name
    .replace(/^Weekend\s+/i, "")
    .replace(/^Weeknight\s+/i, "")
    .replace(/^Morning\s+/i, "")
    .replace(/^Thursday\s+/i, "Thu ")
    .replace(/^Wednesday Morning\s+/i, "Wed AM ")
    .replace(/^Tuesday Morning\s+/i, "Tue AM ")
    .replace(/^Tuesday\s+/i, "Tue ")
    .replace(/^Saturday Night\s+/i, "Sat Night ")
    .replace(/^Saturday\s+/i, "")
    .replace(/^Wednesday\s+/i, "Wed ")
    .replace(/\s+Juniors$/i, " Jrs")
    .replace(/\s+Junior\s+/i, " ");
}

function occurrencesForWeek(clinics: ClinicDef[], weekStart: Date, events: EventDef[]): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 0; i < 7; i++) {
    const date = formatDateInput(addDays(weekStart, i));
    if (clinicsSuspendedOnDate(date, events)) continue;
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
  const [clinics, setClinics] = useState<ClinicDef[]>(s27Clinics);
  const [events, setEvents] = useState<EventDef[]>(s27Events);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(queryDate ? parseDateInput(queryDate) : new Date())
  );
  const [selectedId, setSelectedId] = useState(
    () => (queryClinic && s27Clinics.some((c) => c.id === queryClinic) ? queryClinic : "") || ""
  );
  const [sheetOpen, setSheetOpen] = useState(() => Boolean(queryClinic));
  const [date, setDate] = useState(queryDate);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [familyChildren, setFamilyChildren] = useState<S27MemberChild[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clinic = clinics.find((c) => c.id === selectedId);
  const dates = useMemo(
    () => nextDatesForClinic(clinic, 8, queryDate || date, events),
    [clinic, queryDate, date, events]
  );
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const price = clinic ? (isMember ? clinic.memberPrice : clinic.guestPrice) : 0;
  const todayIso = formatDateInput(new Date());
  const thisWeekStart = useMemo(() => startOfWeekMonday(new Date()), []);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);
  const occurrences = useMemo(
    () => occurrencesForWeek(clinics, weekStart, events),
    [clinics, weekStart, events]
  );

  useEffect(() => {
    if (!session) {
      setFamilyChildren([]);
      return;
    }
    const account = findMemberAccount(session.memberNumber);
    const kids = Array.isArray(account?.children) ? account!.children! : [];
    setFamilyChildren(kids);
    if (kids.length && !childName) setChildName(kids[0].name);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps — refresh kids when session changes

  useEffect(() => {
    try {
      const live = getLiveClinics();
      if (live.length) {
        setClinics(live);
        setSelectedId((id) => {
          const preferred = queryClinic || id;
          if (preferred && live.some((c) => c.id === preferred)) return preferred;
          return id;
        });
      }
      const liveEvents = getLiveEvents();
      if (liveEvents.length) setEvents(liveEvents);
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
  const isJunior = clinic?.kind === "junior";
  const myBookings =
    session && clinic
      ? roster.filter((b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail)
      : [];
  const myBooking = !isJunior ? myBookings[0] : undefined;
  const childAlreadyIn =
    isJunior &&
    !!childName.trim() &&
    roster.some((b) => b.clientName.trim().toLowerCase() === childName.trim().toLowerCase());
  const alreadyIn = isJunior ? childAlreadyIn : !!myBooking;
  const cancellable = !!(clinic && canChangeBooking(date, clinic.startHour));

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

  function cancelSignup(booking?: S27ClinicBooking) {
    const target = booking || myBooking;
    if (!target || !clinic) return;
    if (!canChangeBooking(date, clinic.startHour)) {
      setMsg(`Cancellations need at least ${CANCEL_WINDOW_HOURS} hours’ notice.`);
      return;
    }
    const next = loadList<S27ClinicBooking>(KEYS.clinics).filter((b) => b.id !== target.id);
    saveList(KEYS.clinics, next);
    setBookings(next);
    setMsg(isJunior ? `Cancelled ${target.clientName}.` : "Signup cancelled.");
  }

  async function signUp(method: S27PayMethod) {
    if (!clinic) return;
    if (seatsLeft <= 0) {
      setMsg("This session is full.");
      return;
    }
    if (alreadyIn) {
      setMsg(isJunior ? "That junior is already enrolled." : "You’re already on this roster.");
      return;
    }

    let clientName = "";
    let clientEmail = "";
    let memberNumber: string | undefined;

    if (isMember && session) {
      if (!savedCard && method === "saved-card") {
        setMsg("Add a card on file in My Account to book.");
        return;
      }
      clientName = isJunior
        ? childName.trim() || `${session.memberName}'s junior`
        : session.memberName;
      clientEmail = session.memberEmail;
      memberNumber = session.memberNumber;
      if (isJunior && !childName.trim() && !clientName.trim()) {
        setMsg("Please add the junior’s name.");
        return;
      }
    } else {
      if (isJunior) {
        setMsg("Sign in as a member to enroll a junior.");
        return;
      }
      if (!guestName.trim() || !guestEmail.trim()) {
        setMsg("Enter your name and email to join as a guest.");
        return;
      }
      clientName = guestName.trim();
      clientEmail = guestEmail.trim();
    }

    const id = `${isJunior ? "junior" : "clinic"}-${Date.now()}`;
    const booking: S27ClinicBooking = {
      id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date,
      clientName,
      clientEmail,
      memberNumber,
      amount: price,
      paymentStatus: method === "checkout" ? "pending" : "paid",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    setPaying(true);

    if (!isMember || method === "checkout") {
      const guestPay = await startGuestCheckout({
        amount: price,
        email: clientEmail,
        name: clientName,
        description: `${clinic.name} · ${date}`,
        successPath: "/Summer27/clinics",
        bookingId: id,
        metadata: { type: "clinic", clinicId: clinic.id, date },
      });
      if (guestPay.kind === "error") {
        setPaying(false);
        setMsg(guestPay.error);
        return;
      }
      const nextPending = [...bookings, booking];
      if (guestPay.kind === "checkout") {
        saveList(KEYS.clinics, nextPending);
        setBookings(nextPending);
        window.location.href = guestPay.url;
        return;
      }
      booking.paymentStatus = "paid";
      const next = [...bookings, booking];
      saveList(KEYS.clinics, next);
      setBookings(next);
      setPaying(false);
      setMsg(`You’re in (demo). $${price}.`);
      return;
    }

    const result = await startMemberPayment({
      method,
      amount: price,
      email: clientEmail,
      description: isJunior ? `${clinic.name} · ${clientName} · ${date}` : `${clinic.name} · ${date}`,
      successPath: "/Summer27/clinics",
      bookingId: id,
      paymentProfile: savedCard,
      metadata: { type: isJunior ? "junior" : "clinic", clinicId: clinic.id, date },
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }
    if (result.kind === "checkout") {
      window.location.href = result.url;
      return;
    }

    booking.paymentStatus = "paid";
    const next = [...bookings, booking];
    saveList(KEYS.clinics, next);
    setBookings(next);
    setPaying(false);
    setMsg(isJunior ? `Enrolled. $${price} charged.` : `You’re in. $${price} charged.`);
  }

  const isThisWeek = formatDateInput(weekStart) === formatDateInput(thisWeekStart);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Weekly group play</h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
        Adult and junior sessions. Tap one to book. Half hour $35 · one hour $55 · 90 minutes $80.
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

      <div className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="min-w-[37rem] overflow-hidden rounded-2xl border border-[#e8e5df] bg-white sm:min-w-0">
          <div className="grid grid-cols-7 border-b border-[#ece8e2] bg-[#faf9f7]">
            {days.map((iso, i) => {
              const d = parseDateInput(iso);
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={`border-r border-[#ece8e2] px-1.5 py-2.5 text-center last:border-r-0 sm:px-2 sm:py-2.5 ${
                    isToday ? "bg-white" : ""
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477] sm:text-[10px] sm:tracking-[0.12em]">
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`mt-0.5 text-[14px] font-semibold sm:text-[15px] ${
                      isToday ? "text-[#1a1a1a]" : "text-[#4a4a4a]"
                    }`}
                  >
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
                  className={`min-h-[12.5rem] border-r border-[#ece8e2] p-1.5 last:border-r-0 sm:min-h-[14rem] sm:p-2 ${
                    isToday ? "bg-[#faf9f7]/60" : ""
                  }`}
                >
                  {dayOcc.length === 0 ? (
                    <p className="px-0.5 py-2 text-center text-[10px] text-[#d0cbc3] sm:text-[11px]">—</p>
                  ) : (
                    <ul className="space-y-1 sm:space-y-1.5">
                      {dayOcc.map((o) => {
                        const dayRoster = rosterByClinicDate[`${o.clinic.id}|${o.date}`] || [];
                        const taken = dayRoster.length;
                        const open = Math.max(0, o.clinic.capacity - taken);
                        const mine =
                          !!session &&
                          dayRoster.some(
                            (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
                          );
                        return (
                          <li key={`${o.clinic.id}-${o.date}`}>
                            <button
                              type="button"
                              onClick={() => openClinic(o.clinic, o.date)}
                              className={`w-full rounded-md border px-1.5 py-2 text-left transition sm:rounded-lg sm:px-2 sm:py-2 ${
                                mine
                                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]"
                                  : "border-[#e8e5df] bg-[#f7f7f5] hover:border-[#1a1a1a] hover:bg-white"
                              }`}
                            >
                              <span
                                className={`block text-[10px] font-medium tabular-nums sm:text-[11px] ${
                                  mine ? "text-white/70" : "text-[#6b665e]"
                                }`}
                              >
                                {formatHour(o.clinic.startHour)}
                              </span>
                              <span
                                className={`mt-0.5 block text-[11px] font-medium leading-snug sm:text-[12px] ${
                                  mine ? "text-white" : "text-[#1a1a1a]"
                                }`}
                              >
                                {o.clinic.kind === "junior" ? "Jr · " : ""}
                                {shortClinicName(o.clinic.name)}
                              </span>
                              <span
                                className={`mt-0.5 block text-[9px] sm:mt-1 sm:text-[10px] ${
                                  mine ? "text-white/65" : "text-[#8a8477]"
                                }`}
                              >
                                {mine ? "Yours" : open > 0 ? `${open} open` : "Full"}
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
      </div>

      {sheetOpen && clinic && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close clinic details"
            className="absolute inset-0 bg-[#1a1a1a]/30"
            onClick={closeSheet}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clinic-sheet-title"
            className="relative z-10 flex max-h-[68dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl sm:max-h-[85vh] sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-4 pb-3 pt-3.5 sm:px-5 sm:pb-4 sm:pt-5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
                  {isJunior ? "Enroll" : "Book clinic"}
                </p>
                <h3 id="clinic-sheet-title" className="mt-0.5 text-lg font-semibold tracking-tight text-[#1a1a1a] sm:mt-1 sm:text-xl">
                  {clinic.name}
                </h3>
                <p className="mt-0.5 text-[12px] text-[#6b665e] sm:mt-1 sm:text-[13px]">{clinic.level}</p>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8e5df] text-[16px] leading-none text-[#6b665e] hover:bg-[#faf9f7] hover:text-[#1a1a1a] sm:h-9 sm:w-9 sm:text-[18px]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
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
                  <ul className="mt-2 space-y-1.5">
                    {roster.map((b) => (
                      <li key={b.id} className="text-[14px] font-medium text-[#1a1a1a]">
                        {b.clientName.trim() || "Player"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 space-y-3 pb-2">
                {isJunior && isMember && familyChildren.length > 0 ? (
                  <div>
                    <label className="block text-[11px] text-[#8a8477]">
                      Child on your account
                      <select
                        value={familyChildren.some((c) => c.name === childName) ? childName : "__other"}
                        onChange={(e) => {
                          if (e.target.value === "__other") setChildName("");
                          else setChildName(e.target.value);
                        }}
                        className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                      >
                        {familyChildren.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                            {c.birthYear ? ` (${c.birthYear})` : ""}
                          </option>
                        ))}
                        <option value="__other">Someone else…</option>
                      </select>
                    </label>
                    {!familyChildren.some((c) => c.name === childName) && (
                      <input
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="Junior’s full name"
                        className="mt-2 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                      />
                    )}
                    <p className="mt-1.5 text-[12px] text-[#8a8477]">
                      Manage kids in{" "}
                      <Link href="/Summer27/member/portal" className="text-[#1a1a1a] underline-offset-2 hover:underline">
                        My Account → Family
                      </Link>
                      .
                    </p>
                  </div>
                ) : isJunior ? (
                  <input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Junior’s name"
                    className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  />
                ) : null}
                {!isMember && !isJunior && (
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
                {isJunior && myBookings.length > 0 && (
                  <div className="space-y-2 rounded-xl bg-[#faf9f7] px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Your enrollments</p>
                    <ul className="space-y-2">
                      {myBookings.map((b) => (
                        <li key={b.id} className="flex items-center justify-between gap-2">
                          <span className="text-[13px] text-[#4a4a4a]">{b.clientName}</span>
                          {cancellable ? (
                            <button
                              type="button"
                              onClick={() => cancelSignup(b)}
                              className="shrink-0 text-[12px] font-medium text-[#991b1b] hover:underline"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#8a8477]">Locked</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {!cancellable && (
                      <p className="text-[12px] text-[#8a8477]">
                        Locked within {CANCEL_WINDOW_HOURS} hours of start
                      </p>
                    )}
                  </div>
                )}
                {!isJunior && alreadyIn ? (
                  <div className="space-y-2 rounded-xl bg-[#faf9f7] px-3 py-3 text-center">
                    <p className="text-[13px] text-[#4a4a4a]">You’re signed up</p>
                    {cancellable ? (
                      <button
                        type="button"
                        onClick={() => cancelSignup()}
                        className="text-[13px] font-medium text-[#991b1b] hover:underline"
                      >
                        Cancel signup
                      </button>
                    ) : (
                      <p className="text-[12px] text-[#8a8477]">
                        Locked within {CANCEL_WINDOW_HOURS} hours of start
                      </p>
                    )}
                  </div>
                ) : seatsLeft <= 0 ? (
                  <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">Full</p>
                ) : alreadyIn && isJunior ? null : (
                  <PayChooser
                    amount={price}
                    savedCard={savedCard}
                    paying={paying}
                    primaryLabel={isJunior ? "Enroll" : "Join"}
                    allowGuestCheckout={!isJunior && !savedCard}
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
