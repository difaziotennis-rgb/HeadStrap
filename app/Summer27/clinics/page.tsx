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
import { getLiveClinics, getLiveEvents, weatherClosedOnDate } from "../schedule";
import { KEYS, findMemberAccount, loadList, saveList, type S27ClinicBooking, type S27MemberChild } from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";
import { canChangeBooking, CANCEL_WINDOW_HOURS } from "../booking-policy";
import { BookingPolicies } from "../BookingPolicies";

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
    if (clinicsSuspendedOnDate(iso, events) || weatherClosedOnDate(iso)) continue;
    dates.push(iso);
  }
  if (
    extra &&
    clinic.days.includes(parseDateInput(extra).getDay()) &&
    !clinicsSuspendedOnDate(extra, events) &&
    !weatherClosedOnDate(extra) &&
    !dates.includes(extra)
  ) {
    dates.push(extra);
    dates.sort();
  }
  return dates;
}

function occurrencesForWeek(clinics: ClinicDef[], weekStart: Date, events: EventDef[]): Occurrence[] {
  const out: Occurrence[] = [];
  for (let i = 0; i < 7; i++) {
    const date = formatDateInput(addDays(weekStart, i));
    if (clinicsSuspendedOnDate(date, events) || weatherClosedOnDate(date)) continue;
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
  const queryChild = searchParams.get("child") || "";

  const [bookings, setBookings] = useState<S27ClinicBooking[]>([]);
  const [clinics, setClinics] = useState<ClinicDef[]>(s27Clinics);
  const [events, setEvents] = useState<EventDef[]>(s27Events);
  const [audience, setAudience] = useState<"adult" | "junior">(() => {
    const q = s27Clinics.find((c) => c.id === queryClinic);
    if (queryChild) return "junior";
    return q?.kind === "junior" ? "junior" : "adult";
  });
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
  const [childName, setChildName] = useState(queryChild);
  const [familyChildren, setFamilyChildren] = useState<S27MemberChild[]>([]);
  const [addSecond, setAddSecond] = useState(false);
  const [extraName, setExtraName] = useState("");
  const [extraOther, setExtraOther] = useState(false);
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
  const filteredClinics = useMemo(
    () => clinics.filter((c) => c.kind === audience),
    [clinics, audience]
  );
  const occurrences = useMemo(
    () => occurrencesForWeek(filteredClinics, weekStart, events),
    [filteredClinics, weekStart, events]
  );
  const dayGroups = useMemo(() => {
    return days
      .map((iso, dayIndex) => ({
        iso,
        dayIndex,
        items: occurrences.filter((o) => o.dayIndex === dayIndex),
      }))
      .filter((g) => g.items.length > 0);
  }, [days, occurrences]);

  useEffect(() => {
    if (!session) {
      setFamilyChildren([]);
      return;
    }
    const account = findMemberAccount(session.memberNumber);
    const kids = Array.isArray(account?.children) ? account!.children! : [];
    setFamilyChildren(kids);
    if (kids.length && !childName) setChildName(queryChild || kids[0].name);
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
        const preferred = live.find((c) => c.id === (queryClinic || selectedId));
        if (preferred?.kind === "junior" || preferred?.kind === "adult") {
          setAudience(preferred.kind);
        }
      }
      const liveEvents = getLiveEvents();
      if (liveEvents.length) setEvents(liveEvents);
    } catch {
      // keep defaults
    }
    setBookings(loadList<S27ClinicBooking>(KEYS.clinics));
  }, [queryClinic]); // eslint-disable-line react-hooks/exhaustive-deps

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
        b.id === bookingId || b.paidWithId === bookingId
          ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const }
          : b
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
  const extraAlreadyIn =
    !!extraName.trim() &&
    roster.some((b) => b.clientName.trim().toLowerCase() === extraName.trim().toLowerCase());
  const extraSameAsFirst =
    !!extraName.trim() &&
    (isJunior
      ? extraName.trim().toLowerCase() === childName.trim().toLowerCase()
      : extraName.trim().toLowerCase() === (session?.memberName || guestName).trim().toLowerCase());
  const spotsToBook =
    (isJunior ? (childAlreadyIn ? 0 : 1) : alreadyIn ? 0 : 1) + (addSecond ? 1 : 0);
  const totalDue = price * Math.max(spotsToBook, 0);
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
    setAddSecond(false);
    setExtraName("");
    setExtraOther(false);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setMsg(null);
    setAddSecond(false);
    setExtraName("");
    setExtraOther(false);
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

    const names: string[] = [];
    if (isJunior) {
      const first = childName.trim();
      if (first && !childAlreadyIn) names.push(first);
      if (addSecond) {
        const second = extraName.trim();
        if (!second) {
          setMsg("Add the sibling’s name.");
          return;
        }
        if (extraSameAsFirst || extraAlreadyIn) {
          setMsg(extraAlreadyIn ? "That junior is already enrolled." : "Use two different names.");
          return;
        }
        names.push(second);
      }
      if (names.length === 0) {
        setMsg("That junior is already enrolled.");
        return;
      }
    } else {
      if (isMember && session) {
        if (!alreadyIn) names.push(session.memberName);
      } else {
        if (!guestName.trim() || !guestEmail.trim()) {
          setMsg("Enter your name and email to join as a guest.");
          return;
        }
        if (!alreadyIn) names.push(guestName.trim());
      }
      if (addSecond) {
        const second = extraName.trim();
        if (!second) {
          setMsg("Add the second player’s name.");
          return;
        }
        if (extraSameAsFirst || extraAlreadyIn) {
          setMsg(extraAlreadyIn ? "That player is already on the roster." : "Use a different name for the second spot.");
          return;
        }
        names.push(second);
      }
      if (names.length === 0) {
        setMsg("You’re already on this roster.");
        return;
      }
    }

    if (names.length > seatsLeft) {
      setMsg(seatsLeft <= 0 ? "This session is full." : "Not enough spots left for two players.");
      return;
    }

    let clientEmail = "";
    let memberNumber: string | undefined;

    if (isMember && session) {
      if (!savedCard && method === "saved-card") {
        setMsg("Add a card on file in My Account to book.");
        return;
      }
      clientEmail = session.memberEmail;
      memberNumber = session.memberNumber;
      if (isJunior && names.some((n) => !n.trim())) {
        setMsg("Please add the junior’s name.");
        return;
      }
    } else {
      if (isJunior) {
        setMsg("Sign in as a member to enroll a junior.");
        return;
      }
      clientEmail = guestEmail.trim();
    }

    const perSpot = price;
    const total = perSpot * names.length;
    const primaryId = `${isJunior ? "junior" : "clinic"}-${Date.now()}`;
    const newRows: S27ClinicBooking[] = names.map((name, i) => ({
      id: i === 0 ? primaryId : `${primaryId}-${i + 1}`,
      clinicId: clinic.id,
      clinicName: clinic.name,
      date,
      clientName: name,
      clientEmail,
      memberNumber,
      amount: perSpot,
      paymentStatus: method === "checkout" ? "pending" : "paid",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
      paidWithId: i === 0 ? undefined : primaryId,
    }));

    setPaying(true);
    const who = names.join(" & ");

    if (!isMember || method === "checkout") {
      const guestPay = await startGuestCheckout({
        amount: total,
        email: clientEmail,
        name: names[0],
        description: `${clinic.name} · ${date}${names.length > 1 ? ` · ${names.length} spots` : ""}`,
        successPath: "/Summer27/clinics",
        bookingId: primaryId,
        metadata: { type: "clinic", clinicId: clinic.id, date, spots: String(names.length) },
      });
      if (guestPay.kind === "error") {
        setPaying(false);
        setMsg(guestPay.error);
        return;
      }
      const nextPending = [...bookings, ...newRows];
      if (guestPay.kind === "checkout") {
        saveList(KEYS.clinics, nextPending);
        setBookings(nextPending);
        window.location.href = guestPay.url;
        return;
      }
      const paidRows = newRows.map((b) => ({ ...b, paymentStatus: "paid" as const }));
      const next = [...bookings, ...paidRows];
      saveList(KEYS.clinics, next);
      setBookings(next);
      setPaying(false);
      setAddSecond(false);
      setExtraName("");
      setExtraOther(false);
      setMsg(`You’re in (demo). ${who}. $${total}.`);
      return;
    }

    const result = await startMemberPayment({
      method,
      amount: total,
      email: clientEmail,
      description: `${clinic.name} · ${who} · ${date}`,
      successPath: "/Summer27/clinics",
      bookingId: primaryId,
      paymentProfile: savedCard,
      metadata: { type: isJunior ? "junior" : "clinic", clinicId: clinic.id, date, spots: String(names.length) },
    });

    if (result.kind === "error") {
      setPaying(false);
      setMsg(result.error);
      return;
    }
    if (result.kind === "checkout") {
      const nextPending = [...bookings, ...newRows];
      saveList(KEYS.clinics, nextPending);
      setBookings(nextPending);
      window.location.href = result.url;
      return;
    }

    const paidRows = newRows.map((b) => ({
      ...b,
      paymentStatus: "paid" as const,
      paymentIntentId: result.paymentIntentId,
    }));
    const next = [...bookings, ...paidRows];
    saveList(KEYS.clinics, next);
    setBookings(next);
    setPaying(false);
    setAddSecond(false);
    setExtraName("");
    setExtraOther(false);
    setMsg(
      names.length > 1
        ? `Enrolled ${who}. $${total} charged.`
        : isJunior
          ? `Enrolled. $${total} charged.`
          : `You’re in. $${total} charged.`
    );
  }

  const isThisWeek = formatDateInput(weekStart) === formatDateInput(thisWeekStart);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Weekly group play</h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
        Adult and junior sessions. Tap one to book. You can pay for a second spot — partner or sibling. Half hour $35 ·
        one hour $55 · 90 minutes $80.
      </p>

      <div className="mt-6 flex rounded-full border border-[#e8e5df] bg-white p-1">
        {(
          [
            { id: "adult" as const, label: "Adults" },
            { id: "junior" as const, label: "Juniors" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAudience(tab.id)}
            className={`flex-1 rounded-full px-4 py-2.5 text-[13px] font-medium transition ${
              audience === tab.id ? "bg-[#1a1a1a] text-white" : "text-[#6b665e] hover:text-[#1a1a1a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
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

      <div className="mt-5 space-y-6">
        {dayGroups.length === 0 ? (
          <p className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-8 text-center text-[14px] text-[#8a8477]">
            No {audience === "junior" ? "junior" : "adult"} clinics this week.
          </p>
        ) : (
          dayGroups.map((group) => {
            const d = parseDateInput(group.iso);
            const isToday = group.iso === todayIso;
            return (
              <section key={group.iso}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
                    {DAY_LABELS[group.dayIndex]} · {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </h3>
                  {isToday ? (
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#3d5c34]">Today</span>
                  ) : null}
                </div>
                <ul className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
                  {group.items.map((o, idx) => {
                    const dayRoster = rosterByClinicDate[`${o.clinic.id}|${o.date}`] || [];
                    const taken = dayRoster.length;
                    const open = Math.max(0, o.clinic.capacity - taken);
                    const mine =
                      !!session &&
                      dayRoster.some(
                        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
                      );
                    const priceLabel = isMember ? o.clinic.memberPrice : o.clinic.guestPrice;
                    return (
                      <li
                        key={`${o.clinic.id}-${o.date}`}
                        className={idx > 0 ? "border-t border-[#f0ede8]" : ""}
                      >
                        <button
                          type="button"
                          onClick={() => openClinic(o.clinic, o.date)}
                          className={`flex w-full min-w-0 items-start gap-2.5 overflow-hidden px-3 py-3.5 text-left transition hover:bg-[#faf9f7] sm:items-center sm:gap-4 sm:px-5 ${
                            mine ? "bg-[#f7f7f5]" : ""
                          }`}
                        >
                          <span className="shrink-0 whitespace-nowrap pt-0.5 text-[12px] font-medium tabular-nums text-[#6b665e] sm:w-16 sm:pt-0 sm:text-[14px]">
                            {formatHour(o.clinic.startHour)}
                          </span>
                          <span className="min-w-0 flex-1 overflow-hidden">
                            <span className="block break-words text-[14px] font-medium leading-snug text-[#1a1a1a] [overflow-wrap:anywhere] sm:text-[16px]">
                              {o.clinic.name}
                            </span>
                            <span className="mt-0.5 block text-[12px] leading-snug text-[#8a8477] sm:text-[13px]">
                              {o.clinic.level}
                              {mine ? " · You’re in" : open > 0 ? ` · ${open} open` : " · Full"}
                            </span>
                          </span>
                          <span className="shrink-0 pt-0.5 text-right sm:pt-0">
                            <span className="block text-[13px] font-medium tabular-nums text-[#1a1a1a] sm:text-[14px]">${priceLabel}</span>
                            <span className="mt-0.5 block text-[11px] font-medium text-[#6b665e]">
                              {mine ? "View" : open > 0 ? "Join →" : "Full"}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
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
                <h3 id="clinic-sheet-title" className="mt-0.5 break-words text-[17px] font-semibold leading-snug tracking-tight text-[#1a1a1a] [overflow-wrap:anywhere] sm:mt-1 sm:text-xl">
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
                {seatsLeft >= (alreadyIn ? 1 : 2) || addSecond ? (
                  <label className="flex cursor-pointer items-start gap-2 text-[13px] leading-snug text-[#4a4a4a]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={addSecond}
                      onChange={(e) => {
                        setAddSecond(e.target.checked);
                        if (!e.target.checked) {
                          setExtraName("");
                          setExtraOther(false);
                        }
                      }}
                      disabled={seatsLeft < (alreadyIn ? 1 : 2) && !addSecond}
                    />
                    <span>
                      {isJunior ? "Add a sibling — second spot, same card" : "Add a guest — second spot, same card"}
                      {price ? ` · +$${price}` : ""}
                    </span>
                  </label>
                ) : null}
                {addSecond &&
                  (isJunior && isMember && familyChildren.filter((c) => c.name !== childName).length > 0 ? (
                    <div>
                      <label className="block text-[11px] text-[#8a8477]">
                        Second junior
                        <select
                          value={
                            familyChildren.some((c) => c.name === extraName && c.name !== childName)
                              ? extraName
                              : extraOther || extraName
                                ? "__other"
                                : ""
                          }
                          onChange={(e) => {
                            if (e.target.value === "") {
                              setExtraOther(false);
                              setExtraName("");
                            } else if (e.target.value === "__other") {
                              setExtraOther(true);
                              setExtraName("");
                            } else {
                              setExtraOther(false);
                              setExtraName(e.target.value);
                            }
                          }}
                          className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                        >
                          <option value="">Choose…</option>
                          {familyChildren
                            .filter((c) => c.name !== childName)
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                                {c.birthYear ? ` (${c.birthYear})` : ""}
                              </option>
                            ))}
                          <option value="__other">Someone else…</option>
                        </select>
                      </label>
                      {(extraOther || (extraName !== "" && !familyChildren.some((c) => c.name === extraName))) && (
                        <input
                          value={extraName}
                          onChange={(e) => setExtraName(e.target.value)}
                          placeholder="Sibling’s full name"
                          className="mt-2 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      value={extraName}
                      onChange={(e) => setExtraName(e.target.value)}
                      placeholder={isJunior ? "Sibling’s name" : "Second player’s name"}
                      className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                    />
                  ))}
                {extraSameAsFirst ? (
                  <p className="text-[12px] text-[#991b1b]">Use a different name for the second spot.</p>
                ) : extraAlreadyIn ? (
                  <p className="text-[12px] text-[#991b1b]">
                    {isJunior ? "That junior is already enrolled." : "That player is already on the roster."}
                  </p>
                ) : null}
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
                ) : null}
                {seatsLeft <= 0 && spotsToBook > 0 ? (
                  <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">Full</p>
                ) : spotsToBook > seatsLeft ? (
                  <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">
                    Only {seatsLeft} spot{seatsLeft === 1 ? "" : "s"} left
                  </p>
                ) : spotsToBook > 0 ? (
                  <PayChooser
                    amount={totalDue}
                    savedCard={savedCard}
                    paying={paying}
                    disabled={addSecond && (!extraName.trim() || extraSameAsFirst || extraAlreadyIn)}
                    primaryLabel={
                      spotsToBook > 1 ? (isJunior ? "Enroll both" : "Join both") : isJunior ? "Enroll" : "Join"
                    }
                    allowGuestCheckout={!isJunior && !savedCard}
                    onPay={signUp}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      <BookingPolicies />
    </main>
  );
}
