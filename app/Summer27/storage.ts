import { type CourtId } from "./summer27-data";

export const KEYS = {
  members: "s27_members_v1",
  courts: "s27_court_bookings_v1",
  clinics: "s27_clinic_bookings_v1",
  lessons: "s27_lesson_bookings_v1",
  events: "s27_event_bookings_v1",
  stringing: "s27_stringing_orders_v1",
  payment: "s27_member_payment_v1",
  stringPrefs: "s27_string_prefs_v1",
  pendingStripe: "s27_pending_stripe_v1",
} as const;

export type S27MemberAccount = {
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  createdAt: string;
};

export type S27PaymentProfile = {
  memberNumber: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: string;
  expYear: string;
  billingZip: string;
  oneClick: boolean;
};

export type S27CourtBooking = {
  id: string;
  date: string;
  hour: number;
  durationHours: 1 | 2;
  courtId: CourtId;
  courtName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  memberNumber?: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual" | "paypal" | "venmo";
  createdAt: string;
};

export type S27ClinicBooking = {
  id: string;
  clinicId: string;
  clinicName: string;
  date: string;
  clientName: string;
  clientEmail: string;
  memberNumber?: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual" | "paypal" | "venmo";
  createdAt: string;
};

export type S27LessonBooking = {
  id: string;
  date: string;
  hour: number;
  duration: "60" | "90";
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  memberNumber?: string;
  proId?: string;
  proName?: string;
  courtId?: CourtId;
  focus: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual" | "paypal" | "venmo";
  createdAt: string;
};

export type S27EventBooking = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  attendeeName: string;
  attendeeEmail: string;
  guestCount: number;
  memberNumber?: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual" | "paypal" | "venmo";
  createdAt: string;
};

export type S27StringingOrder = {
  id: string;
  racket: string;
  stringId: string;
  stringName: string;
  tension: string;
  pickupDate: string;
  clientName: string;
  clientEmail: string;
  memberNumber?: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual" | "paypal" | "venmo";
  createdAt: string;
  /** Shop workflow — missing means still in the queue. */
  shopStatus?: "in_shop" | "ready" | "picked_up";
  readyAt?: string;
  notifiedAt?: string;
};

export function stringingShopStatus(order: Pick<S27StringingOrder, "shopStatus">): "in_shop" | "ready" | "picked_up" {
  return order.shopStatus || "in_shop";
}

export type S27StringPref = {
  memberNumber: string;
  racket: string;
  stringId: string;
  stringName: string;
  tension: string;
  updatedAt: string;
};

export function getStringPref(memberNumber?: string): S27StringPref | null {
  if (!memberNumber || typeof window === "undefined") return null;
  return loadList<S27StringPref>(KEYS.stringPrefs).find((p) => p.memberNumber === memberNumber) || null;
}

export function saveStringPref(pref: S27StringPref) {
  if (!pref.memberNumber || typeof window === "undefined") return;
  const all = loadList<S27StringPref>(KEYS.stringPrefs).filter((p) => p.memberNumber !== pref.memberNumber);
  saveList(KEYS.stringPrefs, [...all, pref]);
}

export function rememberStringing(
  memberNumber: string | undefined,
  order: Pick<S27StringingOrder, "racket" | "stringId" | "stringName" | "tension">
) {
  if (!memberNumber) return;
  saveStringPref({
    memberNumber,
    racket: order.racket,
    stringId: order.stringId,
    stringName: order.stringName,
    tension: order.tension,
    updatedAt: new Date().toISOString(),
  });
}

export function stringPrefForMember(memberNumber?: string, orders: S27StringingOrder[] = []): S27StringPref | null {
  const saved = getStringPref(memberNumber);
  if (saved) return saved;
  if (!memberNumber) return null;
  const latest = orders
    .filter((order) => order.memberNumber === memberNumber)
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))[0];
  if (!latest) return null;
  return {
    memberNumber,
    racket: latest.racket,
    stringId: latest.stringId,
    stringName: latest.stringName,
    tension: latest.tension,
    updatedAt: latest.createdAt,
  };
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed.filter((item) => item != null) as T[] : [];
}

export function saveList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota
  }
}

export function loadRecord<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<unknown>(localStorage.getItem(key), {});
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as Record<string, T>;
}

export function saveRecord<T>(key: string, value: Record<string, T>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota
  }
}

export function uniqueCourts(map: Record<string, S27CourtBooking>): S27CourtBooking[] {
  const values = Object.values(map || {}).filter(
    (b): b is S27CourtBooking => !!b && typeof b.id === "string"
  );
  return values.filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
}

export function persistCourts(list: S27CourtBooking[]) {
  const rec: Record<string, S27CourtBooking> = {};
  for (const booking of list) {
    if (!booking?.id || !booking.date || !booking.courtId) continue;
    const hours = Number(booking.durationHours) || 1;
    for (let i = 0; i < hours; i++) {
      rec[courtBookingKey(booking.date, booking.courtId, Number(booking.hour) + i)] = booking;
    }
  }
  saveRecord(KEYS.courts, rec);
}

export function courtBookingKey(date: string, courtId: string, hour: number) {
  return `${date}|${courtId}|${hour}`;
}

export const DEREK_MEMBER = {
  memberNumber: "100",
  name: "Derek DiFazio",
  email: "difaziotennis@gmail.com",
  phone: "631-901-5220",
  password: "tennis",
} as const;

export function ensureDerekMember(): S27MemberAccount {
  const account: S27MemberAccount = {
    memberNumber: DEREK_MEMBER.memberNumber,
    name: DEREK_MEMBER.name,
    email: DEREK_MEMBER.email,
    phone: DEREK_MEMBER.phone,
    password: DEREK_MEMBER.password,
    createdAt: "2026-08-11T00:00:00.000Z",
  };
  if (typeof window === "undefined") return account;

  try {
    const members = loadList<S27MemberAccount>(KEYS.members).filter(
      (m) => m && typeof m.email === "string" && typeof m.memberNumber === "string"
    );
    const existing = members.find(
      (m) =>
        m.memberNumber === DEREK_MEMBER.memberNumber ||
        m.email.toLowerCase() === DEREK_MEMBER.email.toLowerCase() ||
        String(m.name || "").trim().toLowerCase() === "derek difazio"
    );
    const derek: S27MemberAccount = existing
      ? {
          ...existing,
          name: DEREK_MEMBER.name,
          email: DEREK_MEMBER.email,
          phone: existing.phone || DEREK_MEMBER.phone,
          password: DEREK_MEMBER.password,
        }
      : account;
    saveList(
      KEYS.members,
      existing
        ? members.map((m) => (m.memberNumber === existing.memberNumber ? derek : m))
        : [derek, ...members]
    );

    const payments = loadList<S27PaymentProfile>(KEYS.payment).filter(
      (p) => p && typeof p.memberNumber === "string"
    );
    if (!payments.some((p) => p.memberNumber === derek.memberNumber)) {
      saveList(KEYS.payment, [
        ...payments,
        {
          memberNumber: derek.memberNumber,
          brand: "Visa",
          last4: "4242",
          expMonth: "12",
          expYear: "28",
          billingZip: "12572",
          oneClick: true,
        },
      ]);
    }
    return derek;
  } catch {
    return account;
  }
}

export function nextMemberNumber(existing: S27MemberAccount[]): string {
  const used = new Set(existing.map((m) => m.memberNumber));
  for (let i = 101; i < 999; i++) {
    const n = String(i);
    if (!used.has(n)) return n;
  }
  return String(100 + existing.length);
}

