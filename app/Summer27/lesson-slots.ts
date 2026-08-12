import {
  BOOKING_HOURS,
  lessonProLabel,
  proHoursOnDate,
  type ProDef,
} from "./summer27-data";
import { getProgramBlock } from "./schedule";
import type { S27CourtBooking, S27LessonBooking } from "./storage";

export function lessonSpan(duration: "60" | "90") {
  return duration === "90" ? 1.5 : 1;
}

export function bookingProId(booking: Pick<S27LessonBooking, "proId" | "proName">) {
  if (booking.proId) return booking.proId;
  const name = lessonProLabel(booking).toLowerCase();
  if (name.includes("maya")) return "maya-ellison";
  if (name.includes("jonah") || name.includes("berkowitz")) return "jonah-berkowitz";
  if (name.includes("cole")) return "jonah-berkowitz";
  return "derek";
}

export function lessonConflict(opts: {
  pro: ProDef;
  date: string;
  hour: number;
  duration: "60" | "90";
  lessons: S27LessonBooking[];
  courts?: S27CourtBooking[];
  ignoreId?: string;
}): string | null {
  const span = lessonSpan(opts.duration);
  const available = proHoursOnDate(opts.pro, opts.date);
  if (available.length === 0) return "This pro does not teach on that day.";

  for (let h = opts.hour; h < opts.hour + span; h += 1) {
    if (!available.includes(h)) return "That time isn’t on this pro’s schedule.";
    const program = getProgramBlock(opts.date, opts.pro.courtId, h);
    if (program?.type === "clinic" || program?.type === "event") return `Court reserved (${program.label}).`;
    if (program?.type === "hold") return `Court on hold (${program.label}).`;
  }

  const taken = opts.lessons.some((lesson) => {
    if (opts.ignoreId && lesson.id === opts.ignoreId) return false;
    if (lesson.date !== opts.date) return false;
    if (bookingProId(lesson) !== opts.pro.id) return false;
    const otherSpan = lessonSpan(lesson.duration);
    return opts.hour < lesson.hour + otherSpan && lesson.hour < opts.hour + span;
  });
  if (taken) return "That hour is already booked with this pro.";

  if (opts.courts) {
    const courtBusy = opts.courts.some((booking) => {
      if (booking.date !== opts.date || booking.courtId !== opts.pro.courtId) return false;
      return opts.hour < booking.hour + booking.durationHours && booking.hour < opts.hour + span;
    });
    if (courtBusy) return "That court is already booked.";
  }

  return null;
}

export function openLessonHours(opts: {
  pro: ProDef;
  date: string;
  duration: "60" | "90";
  lessons: S27LessonBooking[];
  courts?: S27CourtBooking[];
  ignoreId?: string;
}) {
  return BOOKING_HOURS.filter(
    (hour) =>
      !lessonConflict({
        pro: opts.pro,
        date: opts.date,
        hour,
        duration: opts.duration,
        lessons: opts.lessons,
        courts: opts.courts,
        ignoreId: opts.ignoreId,
      })
  );
}
