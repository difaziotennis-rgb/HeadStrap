"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MemberAuth from "../MemberAuth";
import {
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
  type MemberSession,
} from "../member-session";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const MEMBER_PROFILE_KEY = "rtc_member_profile_v1";
const MEMBER_PAYMENT_KEY = "rtc_member_payment_profile_v1";
const MEMBER_PREFERENCES_KEY = "rtc_member_preferences_v1";

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  courtName: string;
  totalAmount: number;
  paymentStatus?: "pending" | "paid";
  memberNumber?: string;
};

type LessonBooking = {
  id: string;
  createdAt: string;
  memberNumber?: string;
};

type ClinicBooking = {
  id: string;
  total: number;
  createdAt: string;
  memberNumber?: string;
};

type EventReservation = {
  id: string;
  total: number;
  createdAt: string;
  memberNumber?: string;
};

type MemberProfile = {
  fullName: string;
  email: string;
  phone: string;
};

type PaymentProfile = {
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: string;
  expYear: string;
  billingZip: string;
  autopay: boolean;
};

type BillingItem = {
  id: string;
  label: string;
  amount: number;
  status: "Paid" | "Pending";
  at: string;
};

type MemberPreferences = {
  favoriteCourt: string;
  preferredStartTime: string;
  preferredCoach: string;
  preferredSurface: "Indoor" | "Outdoor" | "No preference";
};

const MOCK_BILLING_ITEMS: BillingItem[] = [
  {
    id: "mock-court-1",
    label: "Indoor Court booking",
    amount: 111.6,
    status: "Paid",
    at: new Date().toISOString(),
  },
  {
    id: "mock-clinic-1",
    label: "Clinic enrollment",
    amount: 75,
    status: "Paid",
    at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "mock-court-2",
    label: "Outdoor Court booking",
    amount: 52.2,
    status: "Pending",
    at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emitSessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MEMBER_SESSION_EVENT));
}

export default function RTCMemberPage() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [profile, setProfile] = useState<MemberProfile>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [payment, setPayment] = useState<PaymentProfile>({
    brand: "Visa",
    last4: "",
    expMonth: "",
    expYear: "",
    billingZip: "",
    autopay: false,
  });
  const [billing, setBilling] = useState<BillingItem[]>([]);
  const [preferences, setPreferences] = useState<MemberPreferences>({
    favoriteCourt: "No preference",
    preferredStartTime: "No preference",
    preferredCoach: "No preference",
    preferredSurface: "No preference",
  });
  const [pendingLessons, setPendingLessons] = useState(0);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [preferencesMsg, setPreferencesMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function loadMemberState() {
      const nextSession = parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
      setSession(nextSession);

      const storedProfile = safeParse<MemberProfile | null>(
        localStorage.getItem(MEMBER_PROFILE_KEY),
        null
      );
      setProfile({
        fullName: storedProfile?.fullName || nextSession?.memberName || "",
        email: storedProfile?.email || nextSession?.memberEmail || "",
        phone: storedProfile?.phone || "",
      });

      const storedPayment = safeParse<PaymentProfile | null>(
        localStorage.getItem(MEMBER_PAYMENT_KEY),
        null
      );
      setPayment(
        storedPayment || {
          brand: "Visa",
          last4: "",
          expMonth: "",
          expYear: "",
          billingZip: "",
          autopay: false,
        }
      );
      const storedPreferences = safeParse<MemberPreferences | null>(
        localStorage.getItem(MEMBER_PREFERENCES_KEY),
        null
      );
      setPreferences(
        storedPreferences || {
          favoriteCourt: "No preference",
          preferredStartTime: "No preference",
          preferredCoach: "No preference",
          preferredSurface: "No preference",
        }
      );

      const courtMap = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
      const lessons = safeParse<LessonBooking[]>(localStorage.getItem(LESSON_KEY), []);
      const clinics = safeParse<ClinicBooking[]>(localStorage.getItem(CLINIC_KEY), []);
      const events = safeParse<EventReservation[]>(localStorage.getItem(EVENT_KEY), []);
      const memberNumber = nextSession?.memberNumber || "";

      const seenCourtIds = new Set<string>();
      const memberCourtItems: BillingItem[] = Object.values(courtMap)
        .filter((item) => item.memberNumber === memberNumber && item.hour === item.blockStartHour)
        .filter((item) => {
          if (seenCourtIds.has(item.id)) return false;
          seenCourtIds.add(item.id);
          return true;
        })
        .map((item) => ({
          id: `court-${item.id}`,
          label: `${item.courtName} court booking`,
          amount: Number(item.totalAmount || 0),
          status: item.paymentStatus === "paid" ? "Paid" : "Pending",
          at: `${item.date}T12:00:00`,
        }));

      const memberClinicItems: BillingItem[] = clinics
        .filter((item) => item.memberNumber === memberNumber)
        .map((item) => ({
          id: `clinic-${item.id}`,
          label: "Clinic enrollment",
          amount: Number(item.total || 0),
          status: "Paid",
          at: item.createdAt,
        }));

      const memberEventItems: BillingItem[] = events
        .filter((item) => item.memberNumber === memberNumber)
        .map((item) => ({
          id: `event-${item.id}`,
          label: "Event reservation",
          amount: Number(item.total || 0),
          status: "Paid",
          at: item.createdAt,
        }));

      setPendingLessons(lessons.filter((item) => item.memberNumber === memberNumber).length);
      setBilling(
        [...memberCourtItems, ...memberClinicItems, ...memberEventItems].sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
        )
      );
    }

    loadMemberState();
    window.addEventListener(MEMBER_SESSION_EVENT, loadMemberState);
    return () => window.removeEventListener(MEMBER_SESSION_EVENT, loadMemberState);
  }, []);

  const totals = useMemo(() => {
    const source = session && billing.length === 0 ? MOCK_BILLING_ITEMS : billing;
    const paid = source.filter((item) => item.status === "Paid").reduce((sum, item) => sum + item.amount, 0);
    const pending = source
      .filter((item) => item.status === "Pending")
      .reduce((sum, item) => sum + item.amount, 0);
    return { paid, pending };
  }, [billing, session]);
  const displayBilling = session && billing.length === 0 ? MOCK_BILLING_ITEMS : billing;
  const displayPendingLessons = session && pendingLessons === 0 ? 1 : pendingLessons;

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window === "undefined") return;
    localStorage.setItem(MEMBER_PROFILE_KEY, JSON.stringify(profile));

    if (session) {
      const nextSession: MemberSession = {
        ...session,
        memberName: profile.fullName.trim(),
        memberEmail: profile.email.trim(),
      };
      localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      emitSessionChange();
    }

    setProfileMsg("Account details saved.");
  }

  function savePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(payment.last4.trim())) {
      setPaymentMsg("Card ending must be exactly 4 digits.");
      return;
    }
    if (!payment.expMonth || !payment.expYear) {
      setPaymentMsg("Please add expiration month and year.");
      return;
    }
    if (typeof window === "undefined") return;
    localStorage.setItem(MEMBER_PAYMENT_KEY, JSON.stringify(payment));
    setPaymentMsg("Payment profile updated.");
  }

  function savePreferences(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window === "undefined") return;
    localStorage.setItem(MEMBER_PREFERENCES_KEY, JSON.stringify(preferences));
    setPreferencesMsg("Booking preferences saved.");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Member Login + Account</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Member Account</h2>
            <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
              Keep billing details current, manage your saved payment method, and review recent account activity.
            </p>
          </div>
          <MemberAuth />
        </div>

        {!session && (
          <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[13px] text-[#6b665e]">
              Sign in with your 3-digit member number to view your account details and billing history.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Number</p>
            <p className="mt-1 text-[22px] font-semibold">{session ? `#${session.memberNumber}` : "--"}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Paid to Date</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(totals.paid)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Pending Charges</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(totals.pending)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form onSubmit={saveProfile} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Account Details</p>
            <div className="mt-3 grid gap-2">
              <input
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Full name"
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <input
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                type="email"
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <input
                value={profile.phone}
                onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <button
                type="submit"
                disabled={!session}
                className="mt-1 rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#2c2c2c]"
              >
                Save Account Details
              </button>
              {profileMsg && <p className="text-[12px] text-[#2d5016]">{profileMsg}</p>}
            </div>
          </form>

          <form onSubmit={savePayment} className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Payment Method</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                value={payment.brand}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, brand: e.target.value as PaymentProfile["brand"] }))
                }
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="Amex">Amex</option>
              </select>
              <input
                value={payment.last4}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, last4: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                }
                placeholder="Card ending (4 digits)"
                inputMode="numeric"
                maxLength={4}
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <input
                value={payment.expMonth}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) }))
                }
                placeholder="Exp month (MM)"
                inputMode="numeric"
                maxLength={2}
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <input
                value={payment.expYear}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                }
                placeholder="Exp year (YYYY)"
                inputMode="numeric"
                maxLength={4}
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
              />
              <input
                value={payment.billingZip}
                onChange={(e) =>
                  setPayment((prev) => ({ ...prev, billingZip: e.target.value.replace(/\D/g, "").slice(0, 5) }))
                }
                placeholder="Billing ZIP"
                inputMode="numeric"
                maxLength={5}
                disabled={!session}
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef] sm:col-span-2"
              />
              <label className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={payment.autopay}
                  onChange={(e) => setPayment((prev) => ({ ...prev, autopay: e.target.checked }))}
                  disabled={!session}
                />
                Enable autopay for future court and clinic charges
              </label>
            </div>
            <button
              type="submit"
              disabled={!session}
              className="mt-3 rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#2c2c2c]"
            >
              Save Payment Method
            </button>
            {paymentMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{paymentMsg}</p>}
          </form>
        </div>

        <form onSubmit={savePreferences} className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Saved Booking Preferences</p>
            <p className="text-[11px] text-[#8a8477]">Used for a faster, member-first booking flow</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={preferences.favoriteCourt}
              onChange={(e) => setPreferences((prev) => ({ ...prev, favoriteCourt: e.target.value }))}
              disabled={!session}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
            >
              <option>No preference</option>
              <option>Indoor Court</option>
              <option>Court 1</option>
              <option>Court 2</option>
              <option>Court 3</option>
              <option>Court 4</option>
              <option>Court 5</option>
            </select>
            <select
              value={preferences.preferredStartTime}
              onChange={(e) => setPreferences((prev) => ({ ...prev, preferredStartTime: e.target.value }))}
              disabled={!session}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
            >
              <option>No preference</option>
              <option>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
              <option>10:00 AM</option>
              <option>4:00 PM</option>
              <option>5:00 PM</option>
              <option>6:00 PM</option>
              <option>7:00 PM</option>
            </select>
            <select
              value={preferences.preferredCoach}
              onChange={(e) => setPreferences((prev) => ({ ...prev, preferredCoach: e.target.value }))}
              disabled={!session}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
            >
              <option>No preference</option>
              <option>Derek DiFazio</option>
              <option>Jay Behrke</option>
              <option>Jonah Berkowitz</option>
            </select>
            <select
              value={preferences.preferredSurface}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  preferredSurface: e.target.value as MemberPreferences["preferredSurface"],
                }))
              }
              disabled={!session}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] disabled:bg-[#f5f3ef]"
            >
              <option>No preference</option>
              <option>Indoor</option>
              <option>Outdoor</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={!session}
            className="mt-3 rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-4 py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white"
          >
            Save Preferences
          </button>
          {preferencesMsg && <p className="mt-2 text-[12px] text-[#2d5016]">{preferencesMsg}</p>}
        </form>

        <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Billing Detail + History</p>
            <span className="text-[11px] text-[#8a8477]">{displayBilling.length} account charge entries</span>
          </div>
          <div className="mt-3 space-y-2">
            {displayBilling.length === 0 ? (
              <p className="text-[13px] text-[#8a8477]">No billing entries yet for this member account.</p>
            ) : (
              displayBilling.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[12px]"
                >
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-[#8a8477]">{formatDate(item.at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    <p className={item.status === "Paid" ? "text-[#2d5016]" : "text-[#7f1d1d]"}>{item.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {session && billing.length === 0 && (
            <p className="mt-2 text-[11px] text-[#8a8477]">Preview data shown until your first live charges sync.</p>
          )}
          <p className="mt-3 text-[11px] text-[#8a8477]">
            Lesson requests awaiting confirmation: <strong>{displayPendingLessons}</strong>
          </p>
        </div>

        <div className="mt-5 border-t border-[#f0ede8] pt-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Quick Actions</p>
          <div className="mt-2 grid gap-2 sm:flex sm:flex-wrap">
            <Link href="/RTC/member/portal" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Open Member Portal
            </Link>
            <Link href="/RTC/book" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Book Court
            </Link>
            <Link href="/RTC/clinics" className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]">
              Book Clinics
            </Link>
            <a
              href="mailto:difaziotennis@gmail.com?subject=RTC%20Member%20Billing%20Support"
              className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-[#faf9f7]"
            >
              Billing Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
