import { refundStripePayment } from "./payments";
import { getLiveClinics } from "./schedule";
import type { S27AdminBlock } from "./schedule";
import { formatHour } from "./summer27-data";
import type { S27Charge, S27ClinicBooking, S27CourtBooking, S27LessonBooking } from "./storage";

export const WEATHER_DAY_START = 7;
export const WEATHER_DAY_HOURS = 14;

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

function rangesOverlap(a0: number, aDur: number, b0: number, bDur: number) {
  return a0 < b0 + bDur && b0 < a0 + aDur;
}

export function resolveWeatherWindow(startHour?: number | null, durationHours?: number | null) {
  if (startHour == null || !Number.isFinite(startHour)) {
    return { startHour: WEATHER_DAY_START, durationHours: WEATHER_DAY_HOURS, fullDay: true as const };
  }
  const dur = durationHours && durationHours > 0 ? durationHours : 1;
  return { startHour, durationHours: dur, fullDay: dur >= 12 };
}

export function weatherWindowLabel(startHour: number, durationHours: number, fullDay?: boolean) {
  if (fullDay || durationHours >= 12) return "all day";
  const end = startHour + durationHours;
  return `${formatHour(startHour)}–${formatHour(end)}`;
}

export function isFullDayWeather(block: Pick<S27AdminBlock, "startHour" | "durationHours">) {
  return block.durationHours >= 12 || (block.startHour <= 7 && block.startHour + block.durationHours >= 21);
}

export function weatherAlreadyClosed(
  blocks: S27AdminBlock[],
  date: string,
  startHour?: number | null,
  durationHours?: number | null
) {
  const weather = blocks.filter(
    (b) => b.date === date && b.kind !== "open" && /weather/i.test(b.reason || "")
  );
  const window = resolveWeatherWindow(startHour, durationHours);
  if (window.fullDay) return weather.some(isFullDayWeather);
  return weather.some(
    (b) => b.startHour <= window.startHour && b.startHour + b.durationHours >= window.startHour + window.durationHours
  );
}

function clinicSpan(booking: S27ClinicBooking) {
  const def = getLiveClinics().find((c) => c.id === booking.clinicId);
  return { start: def?.startHour ?? 8, duration: def?.durationHours ?? 1 };
}

function lessonSpan(booking: S27LessonBooking) {
  const minutes = Number(booking.duration) || 60;
  return { start: booking.hour, duration: minutes / 60 };
}

export function weatherAffectedRows(opts: {
  date: string;
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  includeCourts?: boolean;
  includeClinics?: boolean;
  includeLessons?: boolean;
  startHour?: number | null;
  durationHours?: number | null;
}): WeatherAffected[] {
  const includeCourts = opts.includeCourts !== false;
  const includeClinics = opts.includeClinics !== false;
  const includeLessons = opts.includeLessons !== false;
  const window = resolveWeatherWindow(opts.startHour, opts.durationHours);
  const rows: WeatherAffected[] = [];
  if (includeCourts) {
    for (const b of uniqueCourts(
      opts.courts.filter(
        (x) =>
          x.date === opts.date &&
          x.paymentStatus === "paid" &&
          rangesOverlap(window.startHour, window.durationHours, x.hour, x.durationHours)
      )
    )) {
      rows.push({
        email: b.clientEmail,
        name: b.clientName,
        kind: "court",
        label: `${b.courtName} · ${formatHour(b.hour)}`,
        amount: b.amount,
        paymentIntentId: b.paymentIntentId,
        bookingId: b.id,
      });
    }
  }
  if (includeClinics) {
    for (const b of opts.clinics.filter((x) => {
      if (x.date !== opts.date || x.paymentStatus !== "paid") return false;
      const span = clinicSpan(x);
      return rangesOverlap(window.startHour, window.durationHours, span.start, span.duration);
    })) {
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
    for (const b of opts.lessons.filter((x) => {
      if (x.date !== opts.date || x.paymentStatus !== "paid" || x.requestStatus === "declined") return false;
      const span = lessonSpan(x);
      return rangesOverlap(window.startHour, window.durationHours, span.start, span.duration);
    })) {
      rows.push({
        email: b.clientEmail,
        name: b.clientName,
        kind: "lesson",
        label: `Lesson · ${formatHour(b.hour)}`,
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
  startHour?: number | null;
  durationHours?: number | null;
}): Promise<WeatherCloseResult> {
  const includeCourts = opts.includeCourts !== false;
  const includeClinics = opts.includeClinics !== false;
  const includeLessons = opts.includeLessons !== false;
  const sendEmail = opts.sendEmail !== false;
  const { date, courts, clinics, lessons, blocks } = opts;
  const window = resolveWeatherWindow(opts.startHour, opts.durationHours);
  const label = weatherWindowLabel(window.startHour, window.durationHours, window.fullDay);
  const affected = weatherAffectedRows({
    date,
    courts,
    clinics,
    lessons,
    includeCourts,
    includeClinics,
    includeLessons,
    startHour: window.fullDay ? null : window.startHour,
    durationHours: window.fullDay ? null : window.durationHours,
  });

  const removeCourtIds = new Set(
    includeCourts
      ? uniqueCourts(courts)
          .filter(
            (b) =>
              b.date === date &&
              b.paymentStatus === "paid" &&
              rangesOverlap(window.startHour, window.durationHours, b.hour, b.durationHours)
          )
          .map((b) => b.id)
      : []
  );
  const removeClinicIds = new Set(
    includeClinics
      ? clinics
          .filter((b) => {
            if (b.date !== date || b.paymentStatus !== "paid") return false;
            const span = clinicSpan(b);
            return rangesOverlap(window.startHour, window.durationHours, span.start, span.duration);
          })
          .map((b) => b.id)
      : []
  );
  const removeLessonIds = new Set(
    includeLessons
      ? lessons
          .filter((b) => {
            if (b.date !== date || b.paymentStatus !== "paid" || b.requestStatus === "declined") return false;
            const span = lessonSpan(b);
            return rangesOverlap(window.startHour, window.durationHours, span.start, span.duration);
          })
          .map((b) => b.id)
      : []
  );

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
          windowLabel: label,
          items: rows.map((r) => ({ kind: r.kind, label: r.label, amount: r.amount })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; emailed?: boolean };
      if (res.ok && data.emailed) emailed += 1;
    }
  }

  const hold: S27AdminBlock = {
    id: window.fullDay ? `weather-${date}` : `weather-${date}-${window.startHour}-${window.durationHours}`,
    date,
    courtId: "both",
    startHour: window.startHour,
    durationHours: window.durationHours,
    reason: window.fullDay ? "Weather — courts closed" : `Weather — ${label}`,
    createdAt: new Date().toISOString(),
    kind: "hold",
  };
  const nextBlocks = window.fullDay
    ? [...blocks.filter((b) => !(b.date === date && /weather/i.test(b.reason || ""))), hold]
    : [...blocks.filter((b) => b.id !== hold.id), hold];

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
