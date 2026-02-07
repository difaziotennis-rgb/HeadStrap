import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const displayHour = wholeHour === 0 ? 12 : wholeHour > 12 ? wholeHour - 12 : wholeHour;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Returns the available hour slots for a given day of the week.
 * - Monday (1) & Friday (5): 9 AM–6 PM + 7:30 PM (no 7 PM)
 * - All other days: 8 AM–8 PM
 * Does NOT include special slots like Sunday 3 AM.
 */
export function getHoursForDay(dayOfWeek: number): number[] {
  if (dayOfWeek === 1 || dayOfWeek === 5) {
    // Monday & Friday: 9–18, then 19.5 (7:30 PM)
    const hours: number[] = [];
    for (let h = 9; h <= 18; h++) hours.push(h);
    hours.push(19.5);
    return hours;
  }
  // All other days: 8–20 (8 AM to 8 PM)
  const hours: number[] = [];
  for (let h = 8; h <= 20; h++) hours.push(h);
  return hours;
}

export function getMonthName(date: Date): string {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}









