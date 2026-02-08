"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, X, Save } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { formatTime, isPastDate, getHoursForDay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { readAllSlots, writeSlots, writeSlot, buildDateStr } from "@/lib/booking-data";

// ─── Build default slots for a date ─────────────────────────
function defaultSlotsForDate(date: Date): TimeSlot[] {
  const dateStr = buildDateStr(date);
  const hours = getHoursForDay(date.getDay());
  return hours.map((hour) => ({
    id: `${dateStr}-${hour}`,
    date: dateStr,
    hour,
    available: false,
    booked: false,
  }));
}

// ─── Component ──────────────────────────────────────────────
export function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // All slot data lives in React state, keyed by slot id
  const [slots, setSlots] = useState<Record<string, TimeSlot>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick-book state
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookName, setBookName] = useState("");

  // ── Load from Supabase on mount ────────────────────────────
  useEffect(() => {
    readAllSlots().then((saved) => {
      setSlots(saved);
      setLoaded(true);
    });
  }, []);

  // ── Get merged slots for a date (saved + defaults) ─────────
  function getSlotsForDate(date: Date): TimeSlot[] {
    const defaults = defaultSlotsForDate(date);
    return defaults.map((def) => slots[def.id] ?? def);
  }

  // ── Toggle a single slot ───────────────────────────────────
  function handleToggleSlot(slot: TimeSlot) {
    if (slot.booked) return;
    const updated = { ...slot, available: !slot.available };
    setSlots((prev) => ({ ...prev, [updated.id]: updated }));
    setHasUnsavedChanges(true);
    setSaveMessage(null);
  }

  // ── Bulk toggle all slots for a date ───────────────────────
  function handleBulkToggle(date: Date, makeAvailable: boolean) {
    const dateSlots = getSlotsForDate(date);
    const updates: Record<string, TimeSlot> = {};
    for (const slot of dateSlots) {
      if (slot.booked) continue;
      updates[slot.id] = { ...slot, available: makeAvailable };
    }
    setSlots((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
    setSaveMessage(null);
  }

  // ── SAVE to Supabase ────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    // Collect all slots that have been touched
    const allSlots = Object.values(slots);
    const success = await writeSlots(allSlots);
    setSaving(false);
    if (success) {
      setHasUnsavedChanges(false);
      setSaveMessage("Saved!");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Error saving — please try again");
    }
  }

  // ── Quick-book a slot directly ─────────────────────────────
  async function handleQuickBook() {
    if (!bookingSlotId || !bookName.trim()) return;
    const slot = slots[bookingSlotId] ?? getSlotsForDate(selectedDate!).find((s) => s.id === bookingSlotId);
    if (!slot) return;
    const booked: TimeSlot = {
      ...slot,
      available: true,
      booked: true,
      bookedBy: bookName.trim(),
    };
    const updated = { ...slots, [booked.id]: booked };
    setSlots(updated);
    // Save immediately to Supabase
    await writeSlot(booked);
    setBookingSlotId(null);
    setBookName("");
    setSaveMessage("Slot booked!");
    setTimeout(() => setSaveMessage(null), 3000);
  }

  async function handleUnbook(slotId: string) {
    const slot = slots[slotId];
    if (!slot) return;
    const updated: TimeSlot = { ...slot, booked: false, bookedBy: undefined, bookedEmail: undefined, bookedPhone: undefined, notes: undefined };
    setSlots((prev) => ({ ...prev, [slotId]: updated }));
    setHasUnsavedChanges(true);
    setSaveMessage(null);
  }

  // ── Calendar grid setup ────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, () => null);

  if (!loaded) return null;

  return (
    <div className="w-full">
      {/* Save Bar — always visible when there are changes */}
      {hasUnsavedChanges && (
        <div className="mb-4 flex items-center justify-between bg-[#1a1a1a] text-white rounded-xl px-4 py-3">
          <span className="text-[13px]">You have unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="flex items-center gap-1.5 bg-white text-[#1a1a1a] px-4 py-1.5 rounded-lg text-[13px] font-medium hover:bg-[#f0ede8] transition-colors active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save Availability"}
          </button>
        </div>
      )}
      {saveMessage && !hasUnsavedChanges && (
        <div className="mb-4 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] rounded-xl px-4 py-3 text-[13px] text-center">
          {saveMessage}
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrentMonth(subMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-[#6b665e]" />
        </button>
        <h2 className="text-[22px] sm:text-[26px] font-light tracking-tight text-[#1a1a1a]">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={(e) => {
            e.preventDefault();
            setCurrentMonth(addMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
          type="button"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-[#6b665e]" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-[10px] tracking-[0.1em] uppercase font-medium text-[#6b665e] py-2"
          >
            {day}
          </div>
        ))}
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {daysInMonth.map((day) => {
          const past = isPastDate(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const currentDay = isToday(day);
          const dateSlots = getSlotsForDate(day);
          const avail = dateSlots.filter((s) => s.available && !s.booked).length;
          const booked = dateSlots.filter((s) => s.booked && !s.notes?.startsWith("Recurring:")).length;
          const recurring = dateSlots.filter((s) => s.booked && s.notes?.startsWith("Recurring:")).length;
          const totalCount = avail + booked + recurring;

          return (
            <button
              key={day.toISOString()}
              onClick={(e) => {
                e.preventDefault();
                setSelectedDate(day);
              }}
              disabled={past}
              type="button"
              className={cn(
                "aspect-square rounded-lg border transition-all text-[13px] active:scale-95",
                past && "opacity-25 cursor-not-allowed bg-transparent border-transparent",
                !past && !selected && "bg-transparent border-[#d9d5cf] text-[#1a1a1a] cursor-pointer hover:bg-[#f0ede8] hover:border-[#a39e95]",
                selected && "bg-[#1a1a1a] border-[#1a1a1a] text-white",
                currentDay && !selected && "ring-2 ring-[#1a1a1a]/20"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{format(day, "d")}</span>
                {!past && totalCount > 0 && !selected && (
                  <span className="text-[9px] mt-0.5 text-[#7a756d]">
                    {avail > 0 && <span>{avail}</span>}
                    {booked > 0 && <span className="text-[#b05454]">{avail > 0 || recurring > 0 ? "/" : ""}{booked}b</span>}
                    {recurring > 0 && <span className="text-[#6b665e]">{avail > 0 ? "/" : ""}{recurring}r</span>}
                  </span>
                )}
                {selected && totalCount > 0 && (
                  <span className="text-[9px] mt-0.5 text-white/70">
                    {avail > 0 && <span>{avail}</span>}
                    {booked > 0 && <span>{avail > 0 || recurring > 0 ? "/" : ""}{booked}b</span>}
                    {recurring > 0 && <span>{avail > 0 ? "/" : ""}{recurring}r</span>}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDate && !isPastDate(selectedDate) && (
        <div className="mt-6 border-t border-[#e8e5df] pt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e]">
              {format(selectedDate, "EEEE, MMMM d")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleBulkToggle(selectedDate, true);
                }}
                className="px-3 py-1.5 text-[11px] font-medium border border-[#d9d5cf] text-[#1a1a1a] rounded-lg hover:bg-[#f0ede8] transition-colors active:scale-95 cursor-pointer"
                type="button"
              >
                All Available
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleBulkToggle(selectedDate, false);
                }}
                className="px-3 py-1.5 text-[11px] font-medium border border-[#d9d5cf] text-[#7a756d] rounded-lg hover:bg-[#f0ede8] transition-colors active:scale-95 cursor-pointer"
                type="button"
              >
                All Unavailable
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {getSlotsForDate(selectedDate).map((slot) => {
              const isRecurring = slot.booked && slot.notes?.startsWith("Recurring:");
              const isManuallyBooked = slot.booked && !isRecurring;
              return (
                <div key={slot.id} className="relative group">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!slot.booked) handleToggleSlot(slot);
                    }}
                    disabled={slot.booked}
                    type="button"
                    className={cn(
                      "w-full py-2.5 px-3 rounded-lg border transition-all text-[13px] flex flex-col items-center justify-center gap-0.5 active:scale-95",
                      isRecurring && "bg-[#f5f3f0] border-[#c4bfb8] text-[#6b665e] cursor-not-allowed",
                      isManuallyBooked && "bg-[#fef2f2] border-[#fecaca] text-[#991b1b] cursor-not-allowed",
                      !slot.booked && slot.available && "bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-[#333] cursor-pointer",
                      !slot.booked && !slot.available && "bg-transparent border-[#d9d5cf] text-[#7a756d] hover:border-[#a39e95] hover:bg-[#f0ede8] cursor-pointer"
                    )}
                  >
                    <span>{formatTime(slot.hour)}</span>
                    {isRecurring && slot.bookedBy && (
                      <span className="text-[9px] text-[#a39e95] truncate max-w-full">{slot.bookedBy.split(" ")[0]}</span>
                    )}
                    {isManuallyBooked && slot.bookedBy && (
                      <span className="text-[9px] text-[#991b1b]/60 truncate max-w-full">{slot.bookedBy.split(" ")[0]}</span>
                    )}
                    {isManuallyBooked && !slot.bookedBy && <X className="h-3.5 w-3.5" />}
                    {!slot.booked && slot.available && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {/* Book button on available slots */}
                  {!slot.booked && slot.available && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBookingSlotId(slot.id);
                        setBookName("");
                      }}
                      type="button"
                      className="absolute -top-2 -right-2 w-7 h-7 sm:w-5 sm:h-5 bg-[#6b665e] text-white rounded-full flex items-center justify-center text-[11px] sm:text-[9px] font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[#1a1a1a] active:scale-90"
                      title="Book this slot"
                    >
                      B
                    </button>
                  )}
                  {/* Unbook button on manually booked slots */}
                  {isManuallyBooked && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnbook(slot.id);
                      }}
                      type="button"
                      className="absolute -top-2 -right-2 w-7 h-7 sm:w-5 sm:h-5 bg-[#991b1b] text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-[#7f1d1d] active:scale-90"
                      title="Unbook this slot"
                    >
                      <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick-book inline form */}
          {bookingSlotId && (
            <div className="mt-3 p-4 bg-[#faf9f7] border border-[#e8e5df] rounded-xl">
              <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e] font-medium mb-2">
                Book {formatTime(
                  getSlotsForDate(selectedDate).find((s) => s.id === bookingSlotId)?.hour ?? 0
                )} — enter client name
              </p>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuickBook(); }}
                className="w-full px-3 py-2.5 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                placeholder="Client name"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setBookingSlotId(null); setBookName(""); }}
                  type="button"
                  className="flex-1 py-2.5 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickBook}
                  disabled={!bookName.trim()}
                  type="button"
                  className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-40"
                >
                  Book
                </button>
              </div>
            </div>
          )}

          {/* Save button below time slots */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] text-[#7a756d] flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#1a1a1a]"></span>
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-[#d9d5cf]"></span>
                Unavailable
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#f5f3f0] border border-[#c4bfb8]"></span>
                Recurring
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#fef2f2] border border-[#fecaca]"></span>
                Booked
              </span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-medium transition-colors active:scale-95",
                hasUnsavedChanges
                  ? "bg-[#1a1a1a] text-white hover:bg-[#333]"
                  : "bg-[#f0ede8] text-[#7a756d] cursor-default"
              )}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : hasUnsavedChanges ? "Save" : "Saved"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
