import { TimeSlot, Booking } from "./types";
import { getHoursForDay } from "./utils";

// ────────────────────────────────────────────────────────────
// localStorage keys
// ────────────────────────────────────────────────────────────
const SLOTS_KEY = "difazio_admin_slots";
const BOOKINGS_KEY = "difazio_bookings";

// ────────────────────────────────────────────────────────────
// Legacy in-memory Maps (kept for backward-compat with API routes
// that import them directly; client components should prefer the
// localStorage helpers below).
// ────────────────────────────────────────────────────────────
export const timeSlots: Map<string, TimeSlot> = new Map();
export const bookings: Map<string, Booking> = new Map();

// ────────────────────────────────────────────────────────────
// READ helpers — always go to localStorage
// ────────────────────────────────────────────────────────────

/** Read the full slot map from localStorage (returns empty object on SSR). */
export function readSlotsFromStorage(): Record<string, TimeSlot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, TimeSlot>;
  } catch (e) {
    console.error("[mock-data] readSlotsFromStorage error:", e);
  }
  return {};
}

/** Read a single slot from localStorage. */
export function readSlotFromStorage(slotId: string): TimeSlot | null {
  const all = readSlotsFromStorage();
  return all[slotId] ?? null;
}

/** Read all bookings from localStorage. */
export function readBookingsFromStorage(): Record<string, Booking> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, Booking>;
  } catch (e) {
    console.error("[mock-data] readBookingsFromStorage error:", e);
  }
  return {};
}

// ────────────────────────────────────────────────────────────
// WRITE helpers — write to localStorage AND keep legacy Map in sync
// ────────────────────────────────────────────────────────────

/** Persist an individual slot change. */
export function writeSlotToStorage(slot: TimeSlot) {
  if (typeof window === "undefined") return;
  try {
    const all = readSlotsFromStorage();
    if (slot.available || slot.booked) {
      all[slot.id] = slot;
    } else {
      // Remove default-unavailable slots to keep storage small
      delete all[slot.id];
    }
    localStorage.setItem(SLOTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("[mock-data] writeSlotToStorage error:", e);
  }
  // Keep legacy Map in sync
  timeSlots.set(slot.id, slot);
}

/** Persist a batch of slot changes at once (more efficient). */
export function writeSlotsToStorage(slots: TimeSlot[]) {
  if (typeof window === "undefined") return;
  try {
    const all = readSlotsFromStorage();
    for (const slot of slots) {
      if (slot.available || slot.booked) {
        all[slot.id] = slot;
      } else {
        delete all[slot.id];
      }
      // Keep legacy Map in sync
      timeSlots.set(slot.id, slot);
    }
    localStorage.setItem(SLOTS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("[mock-data] writeSlotsToStorage error:", e);
  }
}

/** Persist a booking. */
export function writeBookingToStorage(booking: Booking) {
  if (typeof window === "undefined") return;
  try {
    const all = readBookingsFromStorage();
    all[booking.id] = booking;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("[mock-data] writeBookingToStorage error:", e);
  }
  bookings.set(booking.id, booking);
}

// ────────────────────────────────────────────────────────────
// Convenience: build the full slot list for a given date
// merging localStorage (source of truth) with generated defaults.
// ────────────────────────────────────────────────────────────

/**
 * Returns every time slot for `date`, with persisted availability already
 * applied. Slots that haven't been touched by the admin come back as
 * `available: false, booked: false`.
 */
export function getSlotsForDate(date: Date): TimeSlot[] {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateStr = `${y}-${m}-${d}`;
  const dayOfWeek = date.getDay();
  const hours = getHoursForDay(dayOfWeek);
  const persisted = readSlotsFromStorage();

  return hours.map((hour) => {
    const id = `${dateStr}-${hour}`;
    // Persisted version wins; otherwise generate a default
    return (
      persisted[id] ?? {
        id,
        date: dateStr,
        hour,
        available: false,
        booked: false,
      }
    );
  });
}

// ────────────────────────────────────────────────────────────
// Legacy initialiser — still called by some pages / API routes
// ────────────────────────────────────────────────────────────

/** Keep backward compat: populates the module-level Map from localStorage. */
export function initializeMockData() {
  if (typeof window === "undefined") return;

  // Load persisted slots into the Map
  const persistedSlots = readSlotsFromStorage();
  for (const [key, slot] of Object.entries(persistedSlots)) {
    timeSlots.set(key, slot);
  }

  // Load persisted bookings into the Map
  const persistedBookings = readBookingsFromStorage();
  for (const [key, booking] of Object.entries(persistedBookings)) {
    bookings.set(key, booking);
  }

  // Fill in defaults for the next 90 days
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${mo}-${d}`;
    const dayOfWeek = date.getDay();
    const hours = getHoursForDay(dayOfWeek);

    for (const hour of hours) {
      const id = `${dateStr}-${hour}`;
      if (!timeSlots.has(id)) {
        timeSlots.set(id, {
          id,
          date: dateStr,
          hour,
          available: false,
          booked: false,
        });
      }
    }
  }
}

// Re-export save helpers under old names for any existing call sites
export const saveTimeSlotsToStorage = () => {
  if (typeof window === "undefined") return;
  try {
    const data: Record<string, TimeSlot> = {};
    timeSlots.forEach((slot, key) => {
      if (slot.available || slot.booked) {
        data[key] = slot;
      }
    });
    localStorage.setItem(SLOTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("[mock-data] saveTimeSlotsToStorage error:", e);
  }
};

export const saveBookingsToStorage = () => {
  if (typeof window === "undefined") return;
  try {
    const data: Record<string, Booking> = {};
    bookings.forEach((booking, key) => {
      data[key] = booking;
    });
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("[mock-data] saveBookingsToStorage error:", e);
  }
};
