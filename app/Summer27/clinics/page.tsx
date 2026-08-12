"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startMemberPayment, storageMethodFor, type S27PayMethod } from "../payments";
import { PayChooser } from "../PayChooser";
import {
  clinicDayLabel,
  clinicTimeLabel,
  formatDateInput,
  parseDateInput,
  s27Clinics,
  type ClinicDef,
} from "../summer27-data";
import { getLiveClinics } from "../schedule";
import { KEYS, loadList, saveList, type S27ClinicBooking } from "../storage";
import { DateChips, dateChipFromIso } from "../DateChips";

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

function clinicGroup(clinic: ClinicDef): "Weekend" | "Daytime" | "Evening" {
  const weekend = clinic.days.every((d) => d === 0 || d === 6);
  if (weekend) return "Weekend";
  if (clinic.startHour < 16) return "Daytime";
  return "Evening";
}

const CLINIC_GROUPS: Array<"Weekend" | "Daytime" | "Evening"> = ["Weekend", "Daytime", "Evening"];

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
  const [selectedId, setSelectedId] = useState(
    () =>
      (queryClinic && s27Clinics.some((c) => c.id === queryClinic && c.kind === "adult")
        ? queryClinic
        : s27Clinics.find((c) => c.kind === "adult")?.id) || ""
  );
  const [date, setDate] = useState(queryDate);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const clinic = clinics.find((c) => c.id === selectedId) || clinics[0];
  const dates = useMemo(() => nextDatesForClinic(clinic, 8, queryDate), [clinic, queryDate]);
  const isMember = !!session;
  const savedCard = canOneClick(session);
  const price = clinic ? (isMember ? clinic.memberPrice : clinic.guestPrice) : 0;

  useEffect(() => {
    try {
      const live = getLiveClinics().filter((c) => c.kind === "adult");
      if (live.length) {
        setClinics(live);
        setSelectedId((id) => {
          const preferred = queryClinic || id;
          return live.some((c) => c.id === preferred) ? preferred : live[0].id;
        });
      }
    } catch {
      // keep defaults
    }
    setBookings(loadList<S27ClinicBooking>(KEYS.clinics));
  }, [queryClinic]);

  useEffect(() => {
    if (queryDate && dates.includes(queryDate)) {
      setDate(queryDate);
      return;
    }
    if (!date || !dates.includes(date)) setDate(dates[0] || "");
  }, [dates, date, queryDate]);

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
    }
  }, [searchParams]);

  const rosterByDate = useMemo(() => {
    const map: Record<string, S27ClinicBooking[]> = {};
    if (!clinic) return map;
    for (const b of bookings) {
      if (b.clinicId !== clinic.id || b.paymentStatus !== "paid") continue;
      (map[b.date] ||= []).push(b);
    }
    return map;
  }, [bookings, clinic]);

  const roster = rosterByDate[date] || [];
  const seatsLeft = clinic ? Math.max(0, clinic.capacity - roster.length) : 0;
  const alreadyIn =
    !!session && roster.some((b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail);

  const dateChips = useMemo(
    () =>
      dates.map((d) => {
        const taken = (rosterByDate[d] || []).length;
        const open = clinic ? Math.max(0, clinic.capacity - taken) : 0;
        return dateChipFromIso(d, open <= 0 ? "Full" : `${open} open`);
      }),
    [dates, rosterByDate, clinic]
  );

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

  if (!clinic) return null;

  const grouped = CLINIC_GROUPS.map((group) => ({
    group,
    items: clinics.filter((c) => clinicGroup(c) === group),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Clinics</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Weekly group play</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6b665e]">
        Choose a clinic below, then a date. One hour $50 · 90 minutes $80.
      </p>

      <div className="mt-6 space-y-6">
        {grouped.map(({ group, items }) => (
          <section key={group}>
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{group}</p>
            <div className="space-y-2">
              {items.map((c) => {
                const active = c.id === clinic.id;
                return (
                  <div
                    key={c.id}
                    className={`overflow-hidden rounded-2xl border ${
                      active ? "border-[#1a1a1a] bg-white" : "border-[#e8e5df] bg-[#faf9f7]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(c.id);
                        setMsg(null);
                      }}
                      className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                    >
                      <span
                        className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
                          active ? "border-[#1a1a1a] bg-[#1a1a1a]" : "border-[#cfc9bf] bg-white"
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-medium text-[#1a1a1a]">{c.name}</span>
                        <span className="mt-0.5 block text-[12px] text-[#6b665e]">
                          {c.level}
                        </span>
                        <span className="mt-1 block text-[12px] text-[#8a8477]">
                          {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · ${c.memberPrice}
                        </span>
                      </span>
                    </button>

                    {active && (
                      <div className="border-t border-[#ece8e2] bg-white px-4 pb-4 pt-3">
                        <p className="text-[13px] leading-relaxed text-[#6b665e]">{c.description}</p>

                        <p className="mb-2 mt-4 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Choose a date</p>
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

                        <div className="mt-4 space-y-3">
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
                            <p className="rounded-xl bg-[#faf9f7] px-3 py-3 text-center text-[13px] text-[#8a8477]">You’re signed up</p>
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
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-center text-[12px] text-[#8a8477]">
        <Link href="/Summer27/juniors" className="hover:text-[#1a1a1a]">
          Junior hours →
        </Link>
      </p>
    </main>
  );
}
