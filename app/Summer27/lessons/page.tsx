"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { PayChooser } from "../PayChooser";
import { BookingPolicies } from "../BookingPolicies";
import {
  BOOKING_HOURS,
  COURTS,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonRateForPro,
  parseDateInput,
  proScheduleLabel,
  proUsesLessonRequests,
  s27Pros,
  type ProDef,
} from "../summer27-data";
import { getLivePros } from "../schedule";
import { openLessonHours } from "../lesson-slots";
import {
  KEYS,
  loadList,
  uniqueCourts,
  loadRecord,
  type S27CourtBooking,
  type S27LessonBooking,
} from "../storage";
import { persistLessons } from "../pro-clients";

export default function Summer27LessonsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading lessons…</div>}>
      <Summer27LessonsInner />
    </Suspense>
  );
}

function Summer27LessonsInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("pro");
  const queryDate = searchParams.get("date") || "";
  const queryHour = Number(searchParams.get("hour") || "");
  const [pros, setPros] = useState<ProDef[]>(s27Pros);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [date, setDate] = useState(() =>
    queryDate && /^\d{4}-\d{2}-\d{2}$/.test(queryDate) ? queryDate : formatDateInput(new Date())
  );
  const [hour, setHour] = useState(() => (BOOKING_HOURS.includes(queryHour) ? queryHour : 7));
  const duration = "60" as const;
  const [focus, setFocus] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pro = pros.find((p) => p.id === selectedId) || null;
  const requestMode = proUsesLessonRequests(pro);

  const isMember = !!session;
  const savedCard = canOneClick(session);
  const hours = 1;
  const hourly = lessonRateForPro(pro, isMember);
  const amount = Math.round(hourly * hours);
  const courtName = pro ? COURTS.find((c) => c.id === pro.courtId)?.name || pro.courtId : "";

  useEffect(() => {
    try {
      const live = getLivePros();
      if (live.length) setPros(live);
    } catch {
      // keep defaults
    }
    setLessons(loadList<S27LessonBooking>(KEYS.lessons));
    setCourts(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)));
  }, []);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27LessonBooking>(KEYS.lessons).map((b) =>
        b.id === bookingId ? { ...b, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : b
      );
      persistLessons(all);
      setLessons(all);
      setMsg("Lesson confirmed.");
    }
  }, [searchParams]);

  const openHours = useMemo(() => {
    if (!pro || requestMode) return [];
    return openLessonHours({ pro, date, duration, lessons, courts });
  }, [pro, date, duration, lessons, courts, requestMode]);

  const preferredHours = requestMode ? BOOKING_HOURS : openHours;

  useEffect(() => {
    if (preferredHours.length && !preferredHours.includes(hour)) setHour(preferredHours[0]);
  }, [preferredHours, hour]);

  function submitRequest() {
    if (!pro || !requestMode) return;
    if (!isMember || !session) {
      setMsg("Sign in as a member to request a lesson.");
      return;
    }
    if (!savedCard) {
      setMsg("Add a card on file in My Account to request a lesson.");
      return;
    }
    if (!preferredHours.includes(hour)) {
      setMsg("Pick a preferred time.");
      return;
    }

    setSubmitting(true);
    const id = `lesson-${Date.now()}`;
    const booking: S27LessonBooking = {
      id,
      date,
      hour,
      duration,
      clientName: session.memberName,
      clientEmail: session.memberEmail,
      clientPhone: session.memberPhone || "",
      memberNumber: session.memberNumber,
      proId: pro.id,
      proName: pro.name,
      courtId: pro.courtId,
      focus: focus.trim(),
      amount,
      paymentStatus: "paid",
      paymentMethod: "saved-card",
      requestStatus: "requested",
      createdAt: new Date().toISOString(),
    };
    const next = [...lessons, booking];
    persistLessons(next);
    setLessons(next);
    setSubmitting(false);
    setFocus("");
    setMsg(
      `Request sent for ${formatPrettyDate(date)} · ${formatHour(hour)}. $${amount} charged — you’ll hear back if a time works.`
    );
  }

  async function bookLesson(method: S27PayMethod) {
    if (!pro || requestMode) return;
    if (!isMember || !session) {
      setMsg("Sign in as a member to book.");
      return;
    }
    if (!savedCard) {
      setMsg("Add a card on file in My Account to book.");
      return;
    }
    if (!openHours.includes(hour)) {
      setMsg("That time isn’t available.");
      return;
    }

    const id = `lesson-${Date.now()}`;
    const booking: S27LessonBooking = {
      id,
      date,
      hour,
      duration,
      clientName: session.memberName,
      clientEmail: session.memberEmail,
      clientPhone: session.memberPhone || "",
      memberNumber: session.memberNumber,
      proId: pro.id,
      proName: pro.name,
      courtId: pro.courtId,
      focus: focus.trim(),
      amount,
      paymentStatus: "paid",
      paymentMethod: storageMethodFor(method),
      createdAt: new Date().toISOString(),
    };

    setPaying(true);
    const result = await startMemberPayment({
      method,
      amount,
      email: session.memberEmail,
      description: `Private lesson · ${pro.name} · ${formatPrettyDate(date)} ${formatHour(hour)}`,
      successPath: `/Summer27/lessons?pro=${encodeURIComponent(pro.id)}`,
      bookingId: id,
      paymentProfile: savedCard,
      metadata: { type: "lesson", proId: pro.id, date, hour: String(hour) },
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

    const next = [...lessons, booking];
    persistLessons(next);
    setLessons(next);
    setPaying(false);
    setMsg(`Lesson booked · ${formatPrettyDate(date)} ${formatHour(hour)}. $${amount} charged.`);
  }

  if (!pro) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Lessons</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose a professional</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
          Request a preferred time with Derek, or book other pros when their calendars are open.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((item) => {
            const byRequest = proUsesLessonRequests(item);
            return (
              <div
                key={item.id}
                className="flex flex-col rounded-2xl border border-[#e8e5df] bg-white p-5 transition hover:border-[#d8d3cb]"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{item.title}</p>
                <p className="mt-1 text-[18px] font-semibold tracking-tight">{item.name}</p>
                <p className="mt-1 text-[13px] text-[#6b665e]">{item.focus}</p>
                <p className="mt-3 text-[12px] text-[#8a8477]">
                  {COURTS.find((c) => c.id === item.courtId)?.name || item.courtId} · {proScheduleLabel(item)}
                </p>
                <p className="mt-2 text-[13px] font-medium text-[#1a1a1a]">
                  ${lessonRateForPro(item, isMember)}/hr
                  {isMember ? "" : (
                    <span className="font-normal text-[#8a8477]"> guest (log in for member rates)</span>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/Summer27/pros/${encodeURIComponent(item.id)}`}
                    className="text-[13px] font-medium text-[#6b665e] underline-offset-2 hover:text-[#1a1a1a] hover:underline"
                  >
                    Bio
                  </Link>
                  <Link
                    href={`/Summer27/lessons?pro=${encodeURIComponent(item.id)}`}
                    className="text-[13px] font-medium text-[#1a1a1a]"
                  >
                    {byRequest ? "Request a time →" : "View times →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/Summer27/lessons" className="text-[12px] text-[#8a8477] hover:text-[#1a1a1a]">
        ← Pros
      </Link>
      <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{pro.title}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{pro.name}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6b665e]">{pro.bio}</p>
      <p className="mt-2 text-[13px] text-[#6b665e]">
        {courtName}
        {requestMode ? "" : ` · ${proScheduleLabel(pro)}`} · ${hourly}/hr
        {isMember ? "" : " guest (log in for member rates)"}
      </p>
      <Link
        href={`/Summer27/pros/${encodeURIComponent(pro.id)}`}
        className="mt-2 inline-block text-[13px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
      >
        Full bio →
      </Link>

      {requestMode && (
        <p className="mt-5 rounded-xl border border-[#e8e5df] bg-[#faf9f7] px-3.5 py-3 text-[13px] leading-relaxed text-[#4a4a4a]">
          Members can request a preferred date and time. Derek reviews each request and confirms only when a
          lesson fits — no open calendar for now.
        </p>
      )}

      <div className="mt-6 space-y-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-[12px] text-[#6b665e]">
            {requestMode ? "Preferred date" : "Date"}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            />
          </label>
          <p className="text-[13px] text-[#6b665e]">60 minutes</p>
        </div>
        <div>
          <p className="mb-2 text-[12px] text-[#6b665e]">
            {requestMode ? "Preferred time" : `Time on ${courtName}`}
          </p>
          {preferredHours.length === 0 ? (
            <p className="text-[13px] text-[#8a8477]">No open times this day.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferredHours.map((h) => {
                const active = h === hour;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    className={`rounded-xl border px-3 py-2 text-[13px] font-medium ${
                      active ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#e8e5df] bg-[#faf9f7] text-[#1a1a1a]"
                    }`}
                  >
                    {formatHour(h)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {!requestMode && !isMember && (
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
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            />
          </>
        )}
        <textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder={requestMode ? "Anything helpful — goals, level, flexibility on times…" : "What would you like to work on?"}
          rows={3}
          className="w-full resize-none rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
        />
        <p className="text-[12px] text-[#8a8477]">
          {parseDateInput(date).toLocaleDateString("en-US", { weekday: "long" })} · ${amount}
          {!requestMode && savedCard ? ` · ${savedCard.brand} •••• ${savedCard.last4}` : ""}
          {requestMode ? " · billed if confirmed" : ""}
        </p>
        {msg && <p className="text-[13px]">{msg}</p>}
        {requestMode ? (
          !isMember ? (
            <div className="space-y-2 rounded-xl bg-[#faf9f7] px-3 py-3 text-center">
              <p className="text-[13px] text-[#4a4a4a]">Members request lesson times.</p>
              <Link href="/Summer27/member" className="text-[13px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline">
                Sign in or join →
              </Link>
            </div>
          ) : (
            <button
              type="button"
              disabled={submitting || preferredHours.length === 0}
              onClick={submitRequest}
              className="w-full rounded-xl bg-[#1a1a1a] px-4 py-3.5 text-[15px] font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Request this time"}
            </button>
          )
        ) : preferredHours.length === 0 ? (
          <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">No open times this day</p>
        ) : (
          <PayChooser amount={amount} savedCard={savedCard} paying={paying} primaryLabel="Book" onPay={bookLesson} />
        )}
      </div>

      <BookingPolicies />
    </main>
  );
}
