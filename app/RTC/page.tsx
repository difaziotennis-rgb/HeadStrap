"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type Audience = "public" | "member";

const coaches = [
  {
    name: "Derek DiFazio",
    role: "Head Pro",
    rate: "$160/hr",
    bio: "Certified teaching pro, active tournament competitor, and movement-focused coach. Derek blends technical development with match-play strategy and sustainable body care.",
  },
  {
    name: "Jay Behrke",
    role: "Senior Coach",
    rate: "$140/hr",
    bio: "USPTR-certified coach with decades of experience helping players sharpen fundamentals, point construction, and confidence under pressure.",
  },
  {
    name: "Jonah Berkowitz",
    role: "Performance Coach",
    rate: "$140/hr",
    bio: "Technique-first coaching with strong focus on stroke mechanics, clear cues, and measurable improvement from session to session.",
  },
];

const clinics = [
  {
    name: "Adult Performance Clinic",
    day: "Wednesday",
    time: "6:00 PM - 7:30 PM",
    level: "3.0-4.5",
    memberPrice: "$42",
    publicPrice: "$56",
  },
  {
    name: "Junior Development",
    day: "Saturday",
    time: "10:00 AM - 11:30 AM",
    level: "Ages 10-16",
    memberPrice: "$34",
    publicPrice: "$46",
  },
  {
    name: "Live-Ball Matchplay",
    day: "Sunday",
    time: "9:00 AM - 10:30 AM",
    level: "3.5+",
    memberPrice: "$38",
    publicPrice: "$52",
  },
];

const sampleOpenSlots = [
  { court: "Indoor Court", date: "Fri, Apr 12", time: "7:00 PM" },
  { court: "Outdoor Court 2", date: "Sat, Apr 13", time: "9:00 AM" },
  { court: "Outdoor Court 4", date: "Sat, Apr 13", time: "10:00 AM" },
  { court: "Outdoor Court 1", date: "Sun, Apr 14", time: "8:00 AM" },
];

export default function RTCPage() {
  const [audience, setAudience] = useState<Audience>("public");
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [memberMsg, setMemberMsg] = useState<string | null>(null);
  const [clinicMsg, setClinicMsg] = useState<string | null>(null);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);

  const courtRates = useMemo(() => {
    if (audience === "member") {
      return {
        indoor: "$62 / hour",
        outdoor: "$44 / hour",
      };
    }
    return {
      indoor: "$74 / hour",
      outdoor: "$58 / hour",
    };
  }, [audience]);

  function handleMemberLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!memberEmail.trim() || !memberCode.trim()) {
      setMemberMsg("Enter email and member code to continue.");
      return;
    }
    setMemberLoggedIn(true);
    setAudience("member");
    setMemberMsg("Member preview unlocked.");
  }

  function handleClinicSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClinicMsg("Thanks - clinic signup received. Confirmation will be emailed shortly.");
  }

  function handleQuickReserve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBookingMsg("Request submitted. We'll email confirmation and payment details.");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#1a1a1a]">
      <header className="sticky top-0 z-40 border-b border-[#e8e5df] bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#b0a99f]">DiFazio Tennis</p>
            <h1 className="text-[16px] font-semibold tracking-tight">Rhinebeck Tennis Club</h1>
          </div>
          <nav className="hidden items-center gap-4 text-[12px] font-medium text-[#7a756d] md:flex">
            <a href="#courts" className="transition-colors hover:text-[#1a1a1a]">Court Booking</a>
            <a href="#lessons" className="transition-colors hover:text-[#1a1a1a]">Private Lessons</a>
            <a href="#clinics" className="transition-colors hover:text-[#1a1a1a]">Clinics</a>
            <a href="#members" className="transition-colors hover:text-[#1a1a1a]">Member Hub</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <p className="mb-3 inline-flex rounded-full bg-[#f0ede8] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#7a756d]">
            Boutique Club in Rhinebeck, NY
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Five outdoor courts, one indoor court, and a premium tennis experience.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#6b665e]">
            This is a mock preview for your `difaziotennis.com/RTC` buildout. Public players can book courts,
            lessons, and clinics. Members get lower court rates, early booking windows, and priority access.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a href="#courts" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
              Book Courts
            </a>
            <a href="#lessons" className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]">
              View Coaches
            </a>
            <a href="#members" className="rounded-lg border border-[#d9d5cf] px-4 py-2 text-[12px] font-medium hover:bg-[#faf9f7]">
              Member Login
            </a>
            <Link href="/book" className="ml-auto text-[12px] font-medium text-[#7a756d] underline-offset-4 hover:text-[#1a1a1a] hover:underline">
              Back to current booking site
            </Link>
          </div>
        </div>
      </section>

      <section id="courts" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Court Booking</h3>
              <p className="mt-1 text-[13px] text-[#7a756d]">14-day booking window. 72-hour cancellation policy.</p>
            </div>
            <div className="flex items-center rounded-lg border border-[#e8e5df] bg-[#faf9f7] p-1">
              <button
                type="button"
                onClick={() => setAudience("public")}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${audience === "public" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#7a756d]"}`}
              >
                Public Rates
              </button>
              <button
                type="button"
                onClick={() => setAudience("member")}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${audience === "member" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-[#7a756d]"}`}
              >
                Member Rates
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Current Pricing</p>
              <div className="mt-3 space-y-2 text-[14px]">
                <div className="flex items-center justify-between">
                  <span>Indoor Court (1)</span>
                  <strong>{courtRates.indoor}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Outdoor Courts (5)</span>
                  <strong>{courtRates.outdoor}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleQuickReserve} className="rounded-xl border border-[#ece8e2] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Quick Reserve Request</p>
              <div className="mt-3 grid gap-2">
                <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
                  <option>Indoor Court</option>
                  <option>Outdoor Court</option>
                </select>
                <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
                  <option>This Week</option>
                  <option>Next Week</option>
                </select>
                <input placeholder="Email" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
                <button type="submit" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
                  Request Court Time
                </button>
              </div>
              {bookingMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{bookingMsg}</p>}
            </form>
          </div>

          <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Sample Availability</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {sampleOpenSlots.map((slot) => (
                <div key={`${slot.court}-${slot.date}-${slot.time}`} className="flex items-center justify-between rounded-lg border border-[#f0ede8] px-3 py-2 text-[13px]">
                  <div>
                    <p className="font-medium">{slot.court}</p>
                    <p className="text-[#7a756d]">{slot.date} · {slot.time}</p>
                  </div>
                  <button type="button" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-[#faf9f7]">
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="lessons" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <h3 className="text-xl font-semibold tracking-tight">Private Lessons</h3>
          <p className="mt-1 text-[13px] text-[#7a756d]">
            Choose your coach and request lesson times directly from the RTC section.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {coaches.map((coach) => (
              <article key={coach.name} className="rounded-xl border border-[#ece8e2] p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{coach.role}</p>
                <h4 className="mt-1 text-[17px] font-semibold">{coach.name}</h4>
                <p className="mt-1 text-[12px] font-medium text-[#2d5016]">{coach.rate}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-[#6b665e]">{coach.bio}</p>
                <button type="button" className="mt-4 rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium hover:bg-[#faf9f7]">
                  Request with {coach.name.split(" ")[0]}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="clinics" className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <h3 className="text-xl font-semibold tracking-tight">Clinics</h3>
          <p className="mt-1 text-[13px] text-[#7a756d]">Easy signup for public players and members.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {clinics.map((clinic) => (
              <div key={clinic.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
                <h4 className="text-[16px] font-semibold">{clinic.name}</h4>
                <p className="mt-1 text-[12px] text-[#7a756d]">{clinic.day} · {clinic.time}</p>
                <p className="mt-1 text-[12px] text-[#7a756d]">Level: {clinic.level}</p>
                <p className="mt-3 text-[13px]">
                  <span className="font-medium text-[#2d5016]">{clinic.memberPrice} member</span>
                  <span className="text-[#8a8477]"> · </span>
                  <span>{clinic.publicPrice} public</span>
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleClinicSignup} className="mt-5 rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinic Signup</p>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <input placeholder="Full name" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
              <input placeholder="Email" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
              <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
                {clinics.map((clinic) => <option key={clinic.name}>{clinic.name}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
                Join Clinic
              </button>
            </div>
            {clinicMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{clinicMsg}</p>}
          </form>
        </div>
      </section>

      <section id="members" className="mx-auto w-full max-w-6xl px-4 py-4 pb-10 sm:px-6 sm:py-6 sm:pb-14">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <h3 className="text-xl font-semibold tracking-tight">Member Hub</h3>
          <p className="mt-1 text-[13px] text-[#7a756d]">
            Public and members can use RTC online booking. Members receive enhanced access and pricing.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[#ece8e2] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Benefits</p>
              <ul className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
                <li>Member court pricing for indoor and outdoor bookings</li>
                <li>Early booking window before public release</li>
                <li>Priority waitlist alerts for newly opened times</li>
                <li>Simplified checkout with saved profile details</li>
              </ul>
            </div>

            <form onSubmit={handleMemberLogin} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Login</p>
              <div className="mt-3 grid gap-2">
                <input
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="Member email"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                />
                <input
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  placeholder="Member code"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
                />
                <button type="submit" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
                  Access Member Dashboard
                </button>
              </div>
              {memberMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{memberMsg}</p>}
            </form>
          </div>

          {memberLoggedIn && (
            <div className="mt-5 rounded-xl border border-[#d9e8d1] bg-[#f4faf1] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#2d5016]">Member Dashboard Preview</p>
              <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
                <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
                  <p className="text-[#7a756d]">Preferred Rate Tier</p>
                  <p className="font-semibold">RTC Member</p>
                </div>
                <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
                  <p className="text-[#7a756d]">Booking Access</p>
                  <p className="font-semibold">Priority Window Open</p>
                </div>
                <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
                  <p className="text-[#7a756d]">Saved Preferences</p>
                  <p className="font-semibold">Indoor + Drill Clinic</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
