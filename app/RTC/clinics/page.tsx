"use client";

import { useEffect, useMemo, useState } from "react";
import { rtcClinics } from "../rtc-data";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
} from "../member-session";

const SESSION_WINDOWS = [
  {
    value: "this_week",
    label: "This Week",
    detail: "Current week schedule",
  },
  {
    value: "next_week",
    label: "Next Week",
    detail: "Following week schedule",
  },
];

const BASE_CAPACITY = 12;
const CLINIC_STORAGE_KEY = "rtc_clinic_bookings_v1";
const CLINIC_SLOT_TEMPLATES: Record<
  string,
  { weekday: number; startHour: number; durationHours: number }
> = {
  "Monday Nights with Derek": { weekday: 1, startHour: 18, durationHours: 2 },
  "Wednesday Nights with Jay": { weekday: 3, startHour: 18, durationHours: 2 },
  "Friday Nights with Derek": { weekday: 5, startHour: 18, durationHours: 2 },
  "Saturday Advanced": { weekday: 6, startHour: 9, durationHours: 2 },
  "Saturday Intermediate": { weekday: 6, startHour: 11, durationHours: 2 },
  "Sunday Advanced Intermediate": { weekday: 0, startHour: 9, durationHours: 2 },
  "Sunday Advanced": { weekday: 0, startHour: 11, durationHours: 2 },
};

type ClinicBooking = {
  id: string;
  clinicNames: string[];
  clinicCount: number;
  sessionWindow: string;
  subtotal: number;
  discount: number;
  total: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  isMember: boolean;
  memberNumber?: string;
  reservedSlots?: Array<{
    date: string;
    courtId: "indoor-1";
    startHour: number;
    durationHours: number;
  }>;
  createdAt: string;
};

function parsePrice(value: string): number {
  const n = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function RTCClinicsPage() {
  const [selectedClinics, setSelectedClinics] = useState<Record<string, boolean>>({});
  const [sessionWindow, setSessionWindow] = useState(SESSION_WINDOWS[0].value);
  const [memberSession, setMemberSession] = useState<ReturnType<typeof parseMemberSession>>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ClinicBooking[]>([]);
  const [lastBooking, setLastBooking] = useState<ClinicBooking | null>(null);
  const isMember = !!memberSession;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CLINIC_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ClinicBooking[];
      setBookings(parsed);
    } catch {
      // Ignore bad local data.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function applySession() {
      setMemberSession(parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY)));
    }
    applySession();
    window.addEventListener(MEMBER_SESSION_EVENT, applySession);
    return () => window.removeEventListener(MEMBER_SESSION_EVENT, applySession);
  }, []);

  const selectedList = useMemo(
    () => rtcClinics.filter((clinic) => selectedClinics[clinic.name]),
    [selectedClinics]
  );
  const selectedWindowMeta = useMemo(
    () => SESSION_WINDOWS.find((window) => window.value === sessionWindow) ?? SESSION_WINDOWS[0],
    [sessionWindow]
  );
  const selectedCount = selectedList.length;

  const pricing = useMemo(() => {
    const subtotal = selectedList.reduce((sum, clinic) => {
      return sum + parsePrice(isMember ? clinic.memberPrice : clinic.publicPrice);
    }, 0);

    let discountRate = 0;
    if (selectedCount >= 3) discountRate = 0.12;
    else if (selectedCount === 2) discountRate = 0.06;

    const discount = Math.round(subtotal * discountRate * 100) / 100;
    const total = Math.max(0, subtotal - discount);

    return { subtotal, discount, total, discountRate };
  }, [selectedList, isMember, selectedCount]);

  const signupsByClinic = useMemo(() => {
    const next: Record<string, string[]> = {};
    for (const clinic of rtcClinics) {
      next[clinic.name] = [];
    }
    for (const booking of bookings) {
      for (const clinicName of booking.clinicNames) {
        if (!next[clinicName]) next[clinicName] = [];
        next[clinicName].push(booking.clientName);
      }
    }
    return next;
  }, [bookings]);

  function seatsLeftForClinic(clinicName: string): number {
    const signedUp = signupsByClinic[clinicName]?.length || 0;
    return Math.max(BASE_CAPACITY - signedUp, 0);
  }

  function toggleClinic(clinicName: string) {
    setSelectedClinics((prev) => ({
      ...prev,
      [clinicName]: !prev[clinicName],
    }));
  }

  function submitClinicBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!isMember && (!name.trim() || !email.trim())) {
      setMsg("Please add your name and email to reserve your clinic spot.");
      return;
    }
    if (selectedCount === 0) {
      setMsg("Select at least one clinic to continue.");
      return;
    }
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekOffset = sessionWindow === "next_week" ? 7 : 0;
    const reservedSlots = selectedList.flatMap((item) => {
      const template = CLINIC_SLOT_TEMPLATES[item.name];
      if (!template) return [];
      const clinicDate = addDays(weekStart, weekOffset + template.weekday);
      return [
        {
          date: formatDateInput(clinicDate),
          courtId: "indoor-1" as const,
          startHour: template.startHour,
          durationHours: template.durationHours,
        },
      ];
    });
    const booking: ClinicBooking = {
      id: `clinic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clinicNames: selectedList.map((item) => item.name),
      clinicCount: selectedCount,
      sessionWindow,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      clientName: isMember
        ? memberSession?.memberName || `Member #${memberSession?.memberNumber || "RTC"}`
        : name.trim(),
      clientEmail: isMember ? memberSession?.memberEmail || "" : email.trim(),
      clientPhone: phone.trim(),
      isMember,
      memberNumber: isMember ? memberSession?.memberNumber || "" : "",
      reservedSlots,
      createdAt: new Date().toISOString(),
    };
    const next = [booking, ...bookings].slice(0, 20);
    setBookings(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(CLINIC_STORAGE_KEY, JSON.stringify(next));
    }

    setLastBooking(booking);
    setMsg(
      `Booked ${selectedCount} clinic${selectedCount > 1 ? "s" : ""} for ${selectedWindowMeta.label}.`
    );
    setSelectedClinics({});
    setName("");
    setEmail("");
    setPhone("");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Clinics</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">
          Select one or multiple clinics, see your total update instantly, and apply weekly bundle savings.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {rtcClinics.map((item) => {
              const active = !!selectedClinics[item.name];
              const seats = seatsLeftForClinic(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggleClinic(item.name)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-[#1a1a1a] bg-white shadow-sm"
                      : "border-[#ece8e2] bg-[#faf9f7] hover:bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[16px] font-semibold">{item.name}</h3>
                    <span className="rounded-full bg-[#f0ede8] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#7a756d]">
                      {item.level}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#7a756d]">{item.schedule}</p>
                  <p className="mt-2 text-[13px]">
                    <span className="font-medium text-[#2d5016]">{item.memberPrice} member</span>
                    <span className="text-[#8a8477]"> · </span>
                    <span>{item.publicPrice} public</span>
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#8a8477]">
                    <span>{seats} spots left</span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        active ? "bg-[#1a1a1a] text-white" : "bg-[#ece8e2]"
                      }`}
                    >
                      {active ? "Selected" : "Tap to add"}
                    </span>
                  </div>
                  {isMember && (signupsByClinic[item.name]?.length || 0) > 0 && (
                    <div className="mt-2 rounded-md border border-[#e8e5df] bg-white px-2 py-1.5">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[#8a8477]">Signed up so far</p>
                      <p className="mt-1 text-[11px] text-[#4a4a4a]">
                        {signupsByClinic[item.name].slice(0, 8).join(", ")}
                        {signupsByClinic[item.name].length > 8 ? ", ..." : ""}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={submitClinicBooking} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve Your Spot</p>
            <div className="mt-3 grid gap-2">
              {!isMember && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                  />
                </>
              )}
              <div className="rounded-lg border border-[#e8e5df] p-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Choose Timeframe</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {SESSION_WINDOWS.map((option) => {
                    const active = sessionWindow === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSessionWindow(option.value)}
                        className={`rounded-lg border px-2 py-2 text-left transition-colors ${
                          active
                            ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                            : "border-[#d9d5cf] bg-white hover:bg-[#faf9f7]"
                        }`}
                      >
                        <p className="text-[12px] font-medium">{option.label}</p>
                        <p className={`text-[10px] ${active ? "text-white/80" : "text-[#8a8477]"}`}>
                          {option.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              {isMember && (
                <p className="rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[11px] text-[#2d5016]">
                  Booking as Member #{memberSession?.memberNumber}.
                </p>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              <p>
                <span className="text-[#7a756d]">Selected clinics:</span>{" "}
                <strong>
                  {selectedCount > 0
                    ? `${selectedCount} clinic${selectedCount > 1 ? "s" : ""}`
                    : "None"}
                </strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Session:</span> <strong>{selectedWindowMeta.label}</strong>
              </p>
              <p className="text-[11px] text-[#8a8477]">
                {selectedWindowMeta.detail}
              </p>
              <p>
                <span className="text-[#7a756d]">Subtotal:</span>{" "}
                <strong>${pricing.subtotal.toFixed(2)}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Weekly bundle discount:</span>{" "}
                <strong>
                  {pricing.discount > 0
                    ? `-$${pricing.discount.toFixed(2)} (${Math.round(
                        pricing.discountRate * 100
                      )}% off)`
                    : "Not applied"}
                </strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Total:</span>{" "}
                <strong>${pricing.total.toFixed(2)}</strong>
              </p>
            </div>

            <p className="mt-2 text-[11px] text-[#8a8477]">
              Book 2 clinics in a week for 6% off. Book 3 or more for 12% off.
            </p>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Book Clinic Spot
            </button>
            {msg && <p className="mt-2 text-[12px] text-[#2d5016]">{msg}</p>}
            {lastBooking && (
              <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                <p className="font-medium">Concierge Confirmation</p>
                <p className="text-[#6b665e]">
                  {lastBooking.clinicCount} clinic{lastBooking.clinicCount > 1 ? "s" : ""} · $
                  {lastBooking.total.toFixed(2)}
                </p>
                <a
                  href="mailto:difaziotennis@gmail.com?subject=RTC%20Clinic%20Booking%20Update"
                  className="mt-2 inline-block rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-white"
                >
                  Modify Clinic Booking
                </a>
              </div>
            )}
          </form>
        </div>

        {bookings.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Upcoming Clinic Bookings</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {bookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                  <p className="font-medium">{booking.clinicNames.join(", ")}</p>
                  <p className="text-[#6b665e]">
                    {(SESSION_WINDOWS.find((window) => window.value === booking.sessionWindow)?.label ??
                      booking.sessionWindow)}{" "}
                    · {booking.clinicCount} clinic{booking.clinicCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-[#6b665e]">
                    Total ${booking.total.toFixed(2)}
                    {booking.discount > 0 ? ` (saved $${booking.discount.toFixed(2)})` : ""}
                  </p>
                  <p className="text-[#8a8477]">{booking.clientName}</p>
                  {booking.memberNumber && <p className="text-[#8a8477]">Member #{booking.memberNumber}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
