import { refundStripePayment } from "./payments";
import type { S27AdminBlock } from "./schedule";
import type { S27Charge, S27ClinicBooking, S27CourtBooking, S27LessonBooking } from "./storage";

export type WeatherAffected = {
  email: string;
  name: string;
  kind: string;
  label: string;
  amount: number;
  paymentIntentId?: string;
  bookingId: string;
};

export type WeatherCloseResult = {
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  blocks: S27AdminBlock[];
  charges: S27Charge[];
  emailed: number;
  refunded: number;
};

function uniqueCourts(list: S27CourtBooking[]) {
  const seen = new Set<string>();
  return list.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
}

export function weatherAlreadyClosed(blocks: S27AdminBlock[], date: string) {
  return blocks.some((b) => b.date === date && b.courtId === "both" && /weather/i.test(b.reason || ""));
}

export function weatherAffectedRows(opts: {
  date: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  includeCourts?: boolean;
  includeClinics?: boolean;
  includeLessons?: boolean;
}): WeatherAffected[] {
  const includeCourts = opts.includeCourts !== false;
  const includeClinics = opts.includeClinics !== false;
  const includeLessons = opts.includeLessons !== false;
  const rows: WeatherAffected[] = [];
  if (includeCourts) {
    for (const b of uniqueCourts(opts.courts.filter((x) => x.date === opts.date && x.paymentStatus === "paid"))) {
      rows.push({
        email: b.clientEmail,
        name: b.clientName,
        kind: "court",
        label: `${b.courtName} · ${b.hour}:00`,
        amount: b.amount,
        paymentIntentId: b.paymentIntentId,
        bookingId: b.id,
      });
    }
  }
  if (includeClinics) {
    for (const b of opts.clinics.filter((x) => x.date === opts.date && x.paymentStatus === "paid")) {
      rows.push({
        email: b.clientEmail,
        name: b.clientName,
        kind: "clinic",
        label: b.clinicName,
        amount: b.amount,
        paymentIntentId: b.paymentIntentId,
        bookingId: b.id,
      });
    }
  }
  if (includeLessons) {
    for (const b of opts.lessons.filter(
      (x) => x.date === opts.date && x.paymentStatus === "paid" && x.requestStatus !== "declined"
    )) {
      rows.push({
        email: b.clientEmail,
        name: b.clientName,
        kind: "lesson",
        label: `Lesson · ${b.hour}:00`,
        amount: b.amount,
        paymentIntentId: b.paymentIntentId,
        bookingId: b.id,
      });
    }
  }
  return rows;
}

export async function applyWeatherClose(opts: {
  date: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  blocks: S27AdminBlock[];
  includeCourts?: boolean;
  includeClinics?: boolean;
  includeLessons?: boolean;
  sendEmail?: boolean;
}): Promise<WeatherCloseResult> {
  const includeCourts = opts.includeCourts !== false;
  const includeClinics = opts.includeClinics !== false;
  const includeLessons = opts.includeLessons !== false;
  const sendEmail = opts.sendEmail !== false;
  const { date, courts, clinics, lessons, blocks } = opts;
  const affected = weatherAffectedRows({ date, courts, clinics, lessons, includeCourts, includeClinics, includeLessons });

  const dayCourts = uniqueCourts(courts.filter((b) => b.date === date && b.paymentStatus === "paid"));
  const dayClinics = clinics.filter((b) => b.date === date && b.paymentStatus === "paid");
  const dayLessons = lessons.filter(
    (b) => b.date === date && b.paymentStatus === "paid" && b.requestStatus !== "declined"
  );

  const removeCourtIds = new Set(includeCourts ? dayCourts.map((b) => b.id) : []);
  const removeClinicIds = new Set(includeClinics ? dayClinics.map((b) => b.id) : []);
  const removeLessonIds = new Set(includeLessons ? dayLessons.map((b) => b.id) : []);

  let refunded = 0;
  for (const row of affected) {
    if (!row.paymentIntentId) continue;
    const result = await refundStripePayment({
      paymentIntentId: row.paymentIntentId,
      amount: row.amount,
    });
    if (result.ok) refunded += 1;
  }

  let emailed = 0;
  if (sendEmail) {
    const byEmail = new Map<string, WeatherAffected[]>();
    for (const row of affected) {
      const key = row.email.trim().toLowerCase();
      if (!key) continue;
      (byEmail.get(key) || byEmail.set(key, []).get(key)!).push(row);
    }
    for (const [email, rows] of byEmail) {
      const res = await fetch("/api/summer27/weather-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: rows[0].name,
          date,
          items: rows.map((r) => ({ kind: r.kind, label: r.label, amount: r.amount })),
        }),
      });
      if (res.ok) emailed += 1;
    }
  }

  const hold: S27AdminBlock = {
    id: `weather-${date}`,
    date,
    courtId: "both",
    startHour: 7,
    durationHours: 14,
    reason: "Weather — courts closed",
    createdAt: new Date().toISOString(),
    kind: "hold",
  };
  const nextBlocks = [...blocks.filter((b) => !(b.date === date && /weather/i.test(b.reason || ""))), hold];

  const refundCharges: S27Charge[] = affected.map((row) => ({
    id: `weather-refund-${row.bookingId}`,
    date,
    description: `Weather refund · ${row.kind} · ${row.label}`,
    clientName: row.name,
    clientEmail: row.email,
    amount: -Math.abs(row.amount),
    paymentStatus: "paid",
    paymentMethod: row.paymentIntentId ? "stripe" : "manual",
    createdAt: new Date().toISOString(),
  }));

  return {
    courts: courts.filter((b) => !removeCourtIds.has(b.id)),
    clinics: clinics.filter((b) => !removeClinicIds.has(b.id)),
    lessons: lessons.filter((b) => !removeLessonIds.has(b.id)),
    blocks: nextBlocks,
    charges: refundCharges,
    emailed,
    refunded,
  };
}
