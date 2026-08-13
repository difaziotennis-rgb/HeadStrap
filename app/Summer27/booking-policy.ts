import { parseDateInput } from "./summer27-data";

export const CANCEL_WINDOW_HOURS = 24;

export const CANCEL_POLICY =
  `Cancel or change at least ${CANCEL_WINDOW_HOURS} hours before start for a full refund. Inside that window, bookings are final unless we close the courts.`;

export const WEATHER_POLICY =
  "If Courts 3 or 4 are unplayable due to weather, we’ll refund or reschedule at no charge. We’ll notify you as soon as we make the call.";

export function bookingStartAt(dateStr: string, hour = 0): Date {
  const d = parseDateInput(dateStr);
  const whole = Math.floor(Number(hour) || 0);
  const minutes = Math.round(((Number(hour) || 0) - whole) * 60);
  d.setHours(whole, minutes, 0, 0);
  return d;
}

export function hoursUntilStart(dateStr: string, hour = 0): number {
  return (bookingStartAt(dateStr, hour).getTime() - Date.now()) / 36e5;
}

export function canChangeBooking(dateStr: string, hour = 0): boolean {
  return hoursUntilStart(dateStr, hour) >= CANCEL_WINDOW_HOURS;
}

export function eventStartHour(timeLabel?: string): number {
  if (!timeLabel) return 16;
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 16;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  return hour + Number(match[2]) / 60;
}
