import { s27Clinics, type CourtId } from "./summer27-data";

export const KEYS = {
  members: "s27_members_v1",
  courts: "s27_court_bookings_v1",
  clinics: "s27_clinic_bookings_v1",
  lessons: "s27_lesson_bookings_v1",
  events: "s27_event_bookings_v1",
  stringing: "s27_stringing_orders_v1",
  payment: "s27_member_payment_v1",
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
  paymentMethod: "stripe" | "saved-card" | "manual";
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
  paymentMethod: "stripe" | "saved-card" | "manual";
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
  focus: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  paymentMethod: "stripe" | "saved-card" | "manual";
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
  paymentMethod: "stripe" | "saved-card" | "manual";
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
  paymentMethod: "stripe" | "saved-card" | "manual";
  createdAt: string;
};

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
  return safeParse<T[]>(localStorage.getItem(key), []);
}

export function saveList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadRecord<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, T>>(localStorage.getItem(key), {});
}

export function saveRecord<T>(key: string, value: Record<string, T>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function uniqueCourts(map: Record<string, S27CourtBooking>): S27CourtBooking[] {
  return Object.values(map).filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
}

export function persistCourts(list: S27CourtBooking[]) {
  const rec: Record<string, S27CourtBooking> = {};
  for (const booking of list) {
    for (let i = 0; i < booking.durationHours; i++) {
      rec[courtBookingKey(booking.date, booking.courtId, booking.hour + i)] = booking;
    }
  }
  saveRecord(KEYS.courts, rec);
}

export function courtBookingKey(date: string, courtId: string, hour: number) {
  return `${date}|${courtId}|${hour}`;
}

export function nextMemberNumber(existing: S27MemberAccount[]): string {
  const used = new Set(existing.map((m) => m.memberNumber));
  for (let i = 101; i < 999; i++) {
    const n = String(i);
    if (!used.has(n)) return n;
  }
  return String(100 + existing.length);
}

export function seedPublicRosters() {
  if (typeof window === "undefined") return;
  const flag = localStorage.getItem("s27_seeded_rosters_v1");
  if (flag === "1") return;

  const existing = loadList<S27ClinicBooking>(KEYS.clinics);
  if (existing.length > 0) {
    localStorage.setItem("s27_seeded_rosters_v1", "1");
    return;
  }

  const today = new Date();
  const upcomingSaturday = new Date(today);
  upcomingSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  const sat = upcomingSaturday.toISOString().slice(0, 10);
  const sunDate = new Date(upcomingSaturday);
  sunDate.setDate(upcomingSaturday.getDate() + 1);
  const sun = sunDate.toISOString().slice(0, 10);

  const sampleNames = [
    ["Claire Bennett", "claire@example.com"],
    ["Owen Hart", "owen@example.com"],
    ["Priya Shah", "priya@example.com"],
    ["Miles Ortega", "miles@example.com"],
    ["Helen Cho", "helen@example.com"],
  ];

  const seeded: S27ClinicBooking[] = [];
  for (const clinic of s27Clinics.filter((c) => c.kind === "adult" && c.days.includes(6))) {
    sampleNames.slice(0, 3).forEach(([name, email], i) => {
      seeded.push({
        id: `seed-${clinic.id}-${i}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        date: sat,
        clientName: name,
        clientEmail: email,
        amount: clinic.memberPrice,
        paymentStatus: "paid",
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      });
    });
  }
  for (const clinic of s27Clinics.filter((c) => c.kind === "adult" && c.days.includes(0))) {
    sampleNames.slice(1, 4).forEach(([name, email], i) => {
      seeded.push({
        id: `seed-sun-${clinic.id}-${i}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        date: sun,
        clientName: name,
        clientEmail: email,
        amount: clinic.memberPrice,
        paymentStatus: "paid",
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      });
    });
  }

  saveList(KEYS.clinics, seeded);
  localStorage.setItem("s27_seeded_rosters_v1", "1");
}
