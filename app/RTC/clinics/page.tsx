"use client";

import { useEffect, useMemo, useState } from "react";
import { rtcClinics } from "../rtc-data";

const SESSION_TIMES = [
  "This Week",
  "Next Session",
  "Next Week",
];

const BASE_CAPACITY = 12;
const CLINIC_STORAGE_KEY = "rtc_clinic_bookings_v1";

type ClinicBooking = {
  id: string;
  clinicName: string;
  sessionWindow: string;
  rate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  isMember: boolean;
  createdAt: string;
};

export default function RTCClinicsPage() {
  const [selectedClinic, setSelectedClinic] = useState(rtcClinics[0]?.name || "");
  const [sessionWindow, setSessionWindow] = useState(SESSION_TIMES[0]);
  const [isMember, setIsMember] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ClinicBooking[]>([]);

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

  const clinic = useMemo(
    () => rtcClinics.find((item) => item.name === selectedClinic) ?? rtcClinics[0],
    [selectedClinic]
  );

  const seatsLeft = useMemo(() => {
    const idx = rtcClinics.findIndex((item) => item.name === selectedClinic);
    const adjusted = BASE_CAPACITY - ((idx + 3) % 7);
    return Math.max(adjusted, 3);
  }, [selectedClinic]);

  function submitClinicBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMsg("Please add your name and email to reserve your clinic spot.");
      return;
    }
    const booking: ClinicBooking = {
      id: `clinic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clinicName: clinic?.name || selectedClinic,
      sessionWindow,
      rate: isMember ? clinic?.memberPrice || "" : clinic?.publicPrice || "",
      clientName: name.trim(),
      clientEmail: email.trim(),
      clientPhone: phone.trim(),
      isMember,
      createdAt: new Date().toISOString(),
    };
    const next = [booking, ...bookings].slice(0, 20);
    setBookings(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(CLINIC_STORAGE_KEY, JSON.stringify(next));
    }

    setMsg(`Booked: ${clinic?.name} (${sessionWindow}). Confirmation is on the way.`);
    setName("");
    setEmail("");
    setPhone("");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Clinics</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">
          Fast, elegant signup with member-first pricing and one-click enrollment.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            {rtcClinics.map((item) => {
              const active = item.name === selectedClinic;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedClinic(item.name)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-[#1a1a1a] bg-white"
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
                </button>
              );
            })}
          </div>

          <form onSubmit={submitClinicBooking} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Reserve Your Spot</p>
            <div className="mt-3 grid gap-2">
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
              <select
                value={sessionWindow}
                onChange={(e) => setSessionWindow(e.target.value)}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
              >
                {SESSION_TIMES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-[12px] text-[#4a4a4a]">
                <input
                  type="checkbox"
                  checked={isMember}
                  onChange={(e) => setIsMember(e.target.checked)}
                />
                I am an RTC member
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px]">
              <p>
                <span className="text-[#7a756d]">Clinic:</span> <strong>{clinic?.name}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Session:</span> <strong>{sessionWindow}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Rate:</span>{" "}
                <strong>{isMember ? clinic?.memberPrice : clinic?.publicPrice}</strong>
              </p>
              <p>
                <span className="text-[#7a756d]">Estimated seats left:</span> <strong>{seatsLeft}</strong>
              </p>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Book Clinic Spot
            </button>
            {msg && <p className="mt-2 text-[12px] text-[#2d5016]">{msg}</p>}
          </form>
        </div>

        {bookings.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Upcoming Clinic Bookings</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {bookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]">
                  <p className="font-medium">{booking.clinicName}</p>
                  <p className="text-[#6b665e]">{booking.sessionWindow} · {booking.rate}</p>
                  <p className="text-[#8a8477]">{booking.clientName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
