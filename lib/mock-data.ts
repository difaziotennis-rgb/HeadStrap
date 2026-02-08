import { TimeSlot, Booking } from "./types";

// ────────────────────────────────────────────────────────────
// Legacy exports — kept for backward compatibility.
// Components should import from "@/lib/booking-data" instead.
// ────────────────────────────────────────────────────────────

export const timeSlots: Map<string, TimeSlot> = new Map();
export const bookings: Map<string, Booking> = new Map();

/**
 * Legacy initialiser — now a no-op.
 * All data lives in Supabase; migration happens via migrateFromLocalStorage().
 */
export function initializeMockData() {
  // No-op — data is now in Supabase
}

// Legacy sync read/write helpers are no longer used by components.
// Keeping empty stubs so that any remaining import won't crash at build time.
export function readSlotsFromStorage(): Record<string, TimeSlot> {
  return {};
}
export function readBookingsFromStorage(): Record<string, Booking> {
  return {};
}
export function writeSlotToStorage(_slot: TimeSlot) {}
export function writeSlotsToStorage(_slots: TimeSlot[]) {}
export function writeBookingToStorage(_booking: Booking) {}
export function readSlotFromStorage(_id: string): TimeSlot | null {
  return null;
}
export const saveTimeSlotsToStorage = () => {};
export const saveBookingsToStorage = () => {};
