import { TimeSlot, Booking, RecurringLesson } from "./types";
import { getHoursForDay } from "./utils";
import { getBookingClient } from "./supabase/booking-client";

// ────────────────────────────────────────────────────────────
// Helper: convert DB row to TimeSlot
// ────────────────────────────────────────────────────────────
function rowToSlot(row: any): TimeSlot {
  return {
    id: row.id,
    date: row.date,
    hour: row.hour,
    available: row.available ?? false,
    booked: row.booked ?? false,
    bookedBy: row.booked_by ?? undefined,
    bookedEmail: row.booked_email ?? undefined,
    bookedPhone: row.booked_phone ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function slotToRow(slot: TimeSlot) {
  return {
    id: slot.id,
    date: slot.date,
    hour: slot.hour,
    available: slot.available,
    booked: slot.booked,
    booked_by: slot.bookedBy || null,
    booked_email: slot.bookedEmail || null,
    booked_phone: slot.bookedPhone || null,
    notes: slot.notes || null,
    updated_at: new Date().toISOString(),
  };
}

function rowToBooking(row: any): Booking {
  return {
    id: row.id,
    timeSlotId: row.time_slot_id,
    date: row.date,
    hour: row.hour,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    status: row.status,
    createdAt: row.created_at,
    paymentStatus: row.payment_status ?? undefined,
    amount: row.amount ?? 0,
  };
}

function bookingToRow(booking: Booking) {
  return {
    id: booking.id,
    time_slot_id: booking.timeSlotId,
    date: booking.date,
    hour: booking.hour,
    client_name: booking.clientName,
    client_email: booking.clientEmail,
    client_phone: booking.clientPhone,
    status: booking.status,
    created_at: booking.createdAt,
    payment_status: booking.paymentStatus || null,
    amount: booking.amount,
  };
}

function rowToRecurring(row: any): RecurringLesson {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email ?? undefined,
    clientPhone: row.client_phone ?? undefined,
    dayOfWeek: row.day_of_week,
    hour: row.hour,
    startDate: row.start_date,
    endDate: row.end_date ?? "",
    cancelledDates: row.cancelled_dates ?? [],
    createdAt: row.created_at,
  };
}

function recurringToRow(lesson: RecurringLesson) {
  return {
    id: lesson.id,
    client_name: lesson.clientName,
    client_email: lesson.clientEmail || null,
    client_phone: lesson.clientPhone || null,
    day_of_week: lesson.dayOfWeek,
    hour: lesson.hour,
    start_date: lesson.startDate,
    end_date: lesson.endDate || null,
    cancelled_dates: lesson.cancelledDates,
    created_at: lesson.createdAt,
  };
}

// ────────────────────────────────────────────────────────────
// TIME SLOTS — Read
// ────────────────────────────────────────────────────────────

/** Read ALL persisted slots from Supabase. */
export async function readAllSlots(): Promise<Record<string, TimeSlot>> {
  const supabase = getBookingClient();
  const { data, error } = await supabase.from("time_slots").select("*");
  if (error) {
    console.error("[booking-data] readAllSlots error:", error);
    return {};
  }
  const result: Record<string, TimeSlot> = {};
  for (const row of data ?? []) {
    const slot = rowToSlot(row);
    result[slot.id] = slot;
  }
  return result;
}

/** Read slots for a specific date string (YYYY-MM-DD). */
export async function readSlotsForDate(dateStr: string): Promise<Record<string, TimeSlot>> {
  const supabase = getBookingClient();
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("date", dateStr);
  if (error) {
    console.error("[booking-data] readSlotsForDate error:", error);
    return {};
  }
  const result: Record<string, TimeSlot> = {};
  for (const row of data ?? []) {
    const slot = rowToSlot(row);
    result[slot.id] = slot;
  }
  return result;
}

/** Read slots for a date range. */
export async function readSlotsForDateRange(startDate: string, endDate: string): Promise<Record<string, TimeSlot>> {
  const supabase = getBookingClient();
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) {
    console.error("[booking-data] readSlotsForDateRange error:", error);
    return {};
  }
  const result: Record<string, TimeSlot> = {};
  for (const row of data ?? []) {
    const slot = rowToSlot(row);
    result[slot.id] = slot;
  }
  return result;
}

// ────────────────────────────────────────────────────────────
// TIME SLOTS — Write
// ────────────────────────────────────────────────────────────

/** Upsert a single slot. */
export async function writeSlot(slot: TimeSlot): Promise<boolean> {
  const supabase = getBookingClient();
  // If slot is default (not available, not booked), delete it from DB
  if (!slot.available && !slot.booked) {
    const { error } = await supabase.from("time_slots").delete().eq("id", slot.id);
    if (error) {
      console.error("[booking-data] writeSlot delete error:", error);
      return false;
    }
    return true;
  }
  const { error } = await supabase
    .from("time_slots")
    .upsert(slotToRow(slot), { onConflict: "id" });
  if (error) {
    console.error("[booking-data] writeSlot error:", error);
    return false;
  }
  return true;
}

/** Upsert a batch of slots at once. */
export async function writeSlots(slots: TimeSlot[]): Promise<boolean> {
  if (slots.length === 0) return true;
  const supabase = getBookingClient();

  const toUpsert = slots.filter((s) => s.available || s.booked);
  const toDelete = slots.filter((s) => !s.available && !s.booked);

  let success = true;

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("time_slots")
      .upsert(toUpsert.map(slotToRow), { onConflict: "id" });
    if (error) {
      console.error("[booking-data] writeSlots upsert error:", error);
      success = false;
    }
  }

  if (toDelete.length > 0) {
    const ids = toDelete.map((s) => s.id);
    const { error } = await supabase
      .from("time_slots")
      .delete()
      .in("id", ids);
    if (error) {
      console.error("[booking-data] writeSlots delete error:", error);
      success = false;
    }
  }

  return success;
}

/** Delete a single slot by ID. */
export async function deleteSlot(slotId: string): Promise<boolean> {
  const supabase = getBookingClient();
  const { error } = await supabase.from("time_slots").delete().eq("id", slotId);
  if (error) {
    console.error("[booking-data] deleteSlot error:", error);
    return false;
  }
  return true;
}

/** Delete slots matching a notes pattern (e.g. recurring lesson slots). */
export async function deleteSlotsWithNotes(notesPattern: string): Promise<boolean> {
  const supabase = getBookingClient();
  const { error } = await supabase
    .from("time_slots")
    .delete()
    .eq("notes", notesPattern);
  if (error) {
    console.error("[booking-data] deleteSlotsWithNotes error:", error);
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────
// TIME SLOTS — High-level helper
// ────────────────────────────────────────────────────────────

/** Build date string from Date object. */
export function buildDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get all slots for a date, merging Supabase data with generated defaults.
 * Slots not in DB come back as unavailable/unbooked defaults.
 */
export async function getSlotsForDate(date: Date): Promise<TimeSlot[]> {
  const dateStr = buildDateStr(date);
  const dayOfWeek = date.getDay();
  const hours = getHoursForDay(dayOfWeek);
  const persisted = await readSlotsForDate(dateStr);

  return hours.map((hour) => {
    const id = `${dateStr}-${hour}`;
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
// BOOKINGS
// ────────────────────────────────────────────────────────────

export async function readAllBookings(): Promise<Record<string, Booking>> {
  const supabase = getBookingClient();
  const { data, error } = await supabase.from("bookings").select("*");
  if (error) {
    console.error("[booking-data] readAllBookings error:", error);
    return {};
  }
  const result: Record<string, Booking> = {};
  for (const row of data ?? []) {
    const booking = rowToBooking(row);
    result[booking.id] = booking;
  }
  return result;
}

export async function readBooking(id: string): Promise<Booking | null> {
  const supabase = getBookingClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return rowToBooking(data);
}

export async function writeBooking(booking: Booking): Promise<boolean> {
  const supabase = getBookingClient();
  const { error } = await supabase
    .from("bookings")
    .upsert(bookingToRow(booking), { onConflict: "id" });
  if (error) {
    console.error("[booking-data] writeBooking error:", error);
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────
// RECURRING LESSONS
// ────────────────────────────────────────────────────────────

export async function readAllRecurring(): Promise<RecurringLesson[]> {
  const supabase = getBookingClient();
  const { data, error } = await supabase
    .from("recurring_lessons")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("hour", { ascending: true });
  if (error) {
    console.error("[booking-data] readAllRecurring error:", error);
    return [];
  }
  return (data ?? []).map(rowToRecurring);
}

export async function writeRecurring(lesson: RecurringLesson): Promise<boolean> {
  const supabase = getBookingClient();
  const { error } = await supabase
    .from("recurring_lessons")
    .upsert(recurringToRow(lesson), { onConflict: "id" });
  if (error) {
    console.error("[booking-data] writeRecurring error:", error);
    return false;
  }
  return true;
}

export async function writeAllRecurring(lessons: RecurringLesson[]): Promise<boolean> {
  if (lessons.length === 0) {
    // Delete all
    const supabase = getBookingClient();
    const { error } = await supabase.from("recurring_lessons").delete().neq("id", "");
    return !error;
  }
  const supabase = getBookingClient();
  const { error } = await supabase
    .from("recurring_lessons")
    .upsert(lessons.map(recurringToRow), { onConflict: "id" });
  if (error) {
    console.error("[booking-data] writeAllRecurring error:", error);
    return false;
  }
  return true;
}

export async function deleteRecurring(id: string): Promise<boolean> {
  const supabase = getBookingClient();
  const { error } = await supabase.from("recurring_lessons").delete().eq("id", id);
  if (error) {
    console.error("[booking-data] deleteRecurring error:", error);
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────────────────
// MIGRATION: localStorage → Supabase (one-time)
// ────────────────────────────────────────────────────────────

const MIGRATION_FLAG = "difazio_migrated_to_supabase";

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG) === "true") return;

  const supabase = getBookingClient();

  // Migrate time slots
  try {
    const raw = localStorage.getItem("difazio_admin_slots");
    if (raw) {
      const slots = JSON.parse(raw) as Record<string, TimeSlot>;
      const rows = Object.values(slots)
        .filter((s) => s.available || s.booked)
        .map(slotToRow);
      if (rows.length > 0) {
        const { error } = await supabase
          .from("time_slots")
          .upsert(rows, { onConflict: "id" });
        if (error) {
          console.error("[migration] time_slots error:", error);
          return; // Don't mark as migrated
        }
        console.log(`[migration] Migrated ${rows.length} time slots`);
      }
    }
  } catch (e) {
    console.error("[migration] time_slots parse error:", e);
    return;
  }

  // Migrate bookings
  try {
    const raw = localStorage.getItem("difazio_bookings");
    if (raw) {
      const bookingsMap = JSON.parse(raw) as Record<string, Booking>;
      const rows = Object.values(bookingsMap).map(bookingToRow);
      if (rows.length > 0) {
        const { error } = await supabase
          .from("bookings")
          .upsert(rows, { onConflict: "id" });
        if (error) {
          console.error("[migration] bookings error:", error);
          return;
        }
        console.log(`[migration] Migrated ${rows.length} bookings`);
      }
    }
  } catch (e) {
    console.error("[migration] bookings parse error:", e);
    return;
  }

  // Migrate recurring lessons
  try {
    const raw = localStorage.getItem("difazio_recurring");
    if (raw) {
      const lessons = JSON.parse(raw) as RecurringLesson[];
      if (lessons.length > 0) {
        const rows = lessons.map(recurringToRow);
        const { error } = await supabase
          .from("recurring_lessons")
          .upsert(rows, { onConflict: "id" });
        if (error) {
          console.error("[migration] recurring_lessons error:", error);
          return;
        }
        console.log(`[migration] Migrated ${lessons.length} recurring lessons`);
      }
    }
  } catch (e) {
    console.error("[migration] recurring parse error:", e);
    return;
  }

  // Mark migration complete
  localStorage.setItem(MIGRATION_FLAG, "true");
  console.log("[migration] Migration complete!");
}
