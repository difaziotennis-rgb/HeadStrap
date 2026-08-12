"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startStripeCheckout } from "../payments";
import {
  COURTS,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  parseDateInput,
  proScheduleLabel,
  s27Pros,
  type ProDef,
} from "../summer27-data";
import { getLiveLessonRates, getLivePros } from "../schedule";
import { openLessonHours } from "../lesson-slots";
import {
  KEYS,
  loadList,
  uniqueCourts,
  loadRecord,
  saveList,
  type S27CourtBooking,
  type S27LessonBooking,
} from "../storage";

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
  const [pros, setPros] = useState<ProDef[]>(s27Pros);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [date, setDate] = useState(() => formatDateInput(new Date()));
  const [hour, setHour] = useState(8);
  const [duration, setDuration] = useState<"60" | "90">("60");
  const [focus, setFocus] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const selectedId = searchParams.get("pro");
  const pro = pros.find((p) => p.id === selectedId) || null;

  const isMember = !!session;
  const savedCard = canOneClick(session);
  const hours = duration === "90" ? 1.5 : 1;
  const rates = getLiveLessonRates();
  const amount = Math.round((isMember ? rates.member : rates.guest) * hours);
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
      saveList(KEYS.lessons, all);
      setLessons(all);
      setMsg("Lesson confirmed and paid.");
    }
  }, [searchParams]);

  const openHours = useMemo(() => {
    if (!pro) return [];
    return openLessonHours({ pro, date, duration, lessons, courts });
  }, [pro, date, duration, lessons, courts]);

  useEffect(() => {
    if (openHours.length && !openHours.includes(hour)) setHour(openHours[0]);
  }, [openHours, hour]);

  async function bookLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!pro) return;
    const name = isMember ? session!.memberName : guestName.trim();
    const email = isMember ? session!.memberEmail : guestEmail.trim();
    const phone = isMember ? session!.memberPhone || "" : guestPhone.trim();
    if (!name || !email) {
      setMsg("Name and email required.");
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
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      memberNumber: session?.memberNumber,
      proId: pro.id,
      proName: pro.name,
      courtId: pro.courtId,
      focus: focus.trim(),
      amount,
      paymentStatus: "pending",
      paymentMethod: savedCard ? "saved-card" : "stripe",
      createdAt: new Date().toISOString(),
    };

    if (savedCard) {
      booking.paymentStatus = "paid";
      const next = [...lessons, booking];
      saveList(KEYS.lessons, next);
      setLessons(next);
      setMsg(`Lesson with ${pro.name} · ${formatPrettyDate(date)} ${formatHour(hour)}. Charged $${amount}.`);
      return;
    }

    const next = [...lessons, booking];
    saveList(KEYS.lessons, next);
    setLessons(next);
    setPaying(true);
    const checkout = await startStripeCheckout({
      amount,
      email,
      description: `Private lesson · ${pro.name} · ${formatPrettyDate(date)} ${formatHour(hour)}`,
      successPath: `/Summer27/lessons?pro=${encodeURIComponent(pro.id)}`,
      bookingId: id,
      metadata: { type: "lesson", proId: pro.id, date, hour: String(hour) },
    });
    setPaying(false);
    if (checkout.url) window.location.href = checkout.url;
    else setMsg(checkout.error || "Checkout failed.");
  }

  if (!pro) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Private lessons</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose a professional</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6b665e]">
          Members ${rates.member}/hour · guests ${rates.guest}/hour. Pick your pro first, then choose a time on their court.
          Change or cancel from My Account until 24 hours before.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((item) => (
            <Link
              key={item.id}
              href={`/Summer27/lessons?pro=${encodeURIComponent(item.id)}`}
              className="rounded-2xl border border-[#e8e5df] bg-white p-5 transition hover:border-[#d8d3cb] hover:bg-[#faf9f7]"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{item.title}</p>
              <p className="mt-1 text-[18px] font-semibold tracking-tight">{item.name}</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">{item.focus}</p>
              <p className="mt-3 text-[12px] text-[#8a8477]">
                {COURTS.find((c) => c.id === item.courtId)?.name || item.courtId} · {proScheduleLabel(item)}
              </p>
              <p className="mt-4 text-[13px] font-medium text-[#1a1a1a]">Book with {item.name.split(" ")[0]} →</p>
            </Link>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/Summer27/lessons" className="text-[12px] text-[#8a8477] hover:text-[#1a1a1a]">
        ← All professionals
      </Link>
      <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{pro.title}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{pro.name}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6b665e]">{pro.bio}</p>
      <p className="mt-2 text-[13px] text-[#6b665e]">
        {courtName} · {proScheduleLabel(pro)} · members ${rates.member}/hour · guests ${rates.guest}/hour
      </p>

      <form onSubmit={bookLesson} className="mt-6 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] text-[#6b665e]">
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </label>
          <label className="text-[12px] text-[#6b665e]">
            Length
            <select value={duration} onChange={(e) => setDuration(e.target.value as "60" | "90")} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </label>
        </div>
        <label className="block text-[12px] text-[#6b665e]">
          Time on {courtName}
          <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
            {openHours.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </label>
        {!isMember && (
          <>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Phone" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </>
        )}
        <textarea
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="What would you like to work on?"
          rows={3}
          className="w-full resize-none rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />
        <p className="text-[12px] text-[#8a8477]">
          {parseDateInput(date).toLocaleDateString("en-US", { weekday: "long" })} · {pro.name} · ${amount}
          {savedCard ? ` · one-click ${savedCard.brand} •••• ${savedCard.last4}` : ""}
        </p>
        {msg && <p className="text-[13px]">{msg}</p>}
        <button disabled={paying || openHours.length === 0} className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white disabled:opacity-40">
          {openHours.length === 0 ? "No open times this day" : savedCard ? `One-click · $${amount}` : `Pay $${amount} & book`}
        </button>
      </form>
    </main>
  );
}
