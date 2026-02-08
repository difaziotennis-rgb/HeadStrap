"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { formatTime, isPastDate, isToday, getHoursForDay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { readAllSlots, buildDateStr } from "@/lib/booking-data";

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  selectedDate: Date | null;
}

export function Calendar({ onDateSelect, onTimeSlotSelect, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedDateState, setSelectedDateState] = useState<Date | null>(selectedDate);
  const [savedSlots, setSavedSlots] = useState<Record<string, TimeSlot>>({});
  const [loaded, setLoaded] = useState(false);

  // Load saved slots from Supabase on mount
  useEffect(() => {
    readAllSlots().then((slots) => {
      setSavedSlots(slots);
      setLoaded(true);
    });
  }, []);

  // Sync selectedDate prop
  useEffect(() => {
    if (selectedDate) setSelectedDateState(selectedDate);
  }, [selectedDate]);

  // ── helpers ─────────────────────────────────────────────────

  /** Check if a day has any available slots. */
  const dayHasAvailability = useCallback(
    (day: Date): boolean => {
      if (!loaded) return false;
      const dateStr = buildDateStr(day);
      const hours = getHoursForDay(day.getDay());
      return hours.some((hour) => {
        const slot = savedSlots[`${dateStr}-${hour}`];
        return slot?.available && !slot?.booked;
      });
    },
    [savedSlots, loaded]
  );

  /** Get only available (not booked) slots for a date. */
  const visibleSlotsForDate = useCallback(
    (date: Date): TimeSlot[] => {
      if (!loaded) return [];
      const dateStr = buildDateStr(date);
      const hours = getHoursForDay(date.getDay());
      const result: TimeSlot[] = [];
      for (const hour of hours) {
        const id = `${dateStr}-${hour}`;
        const slot = savedSlots[id];
        if (slot && slot.available && !slot.booked) {
          result.push(slot);
        }
      }
      return result;
    },
    [savedSlots, loaded]
  );

  const handleDateClick = (date: Date) => {
    if (isPastDate(date) && !isToday(date)) return;
    setSelectedDateState(date);
    onDateSelect(date);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevYear = () => setCurrentMonth(subMonths(currentMonth, 12));
  const handleNextYear = () => setCurrentMonth(addMonths(currentMonth, 12));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // ── Year view ───────────────────────────────────────────────
  if (viewMode === "year") {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentMonth.getFullYear(), i, 1));

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={(e) => { e.preventDefault(); handlePrevYear(); }}
            className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
            aria-label="Previous year" type="button"
          >
            <ChevronLeft className="h-5 w-5 text-[#6b665e]" />
          </button>
          <h2 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
            {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={(e) => { e.preventDefault(); handleNextYear(); }}
            className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
            aria-label="Next year" type="button"
          >
            <ChevronRight className="h-5 w-5 text-[#6b665e]" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map((month) => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const days = eachDayOfInterval({ start: mStart, end: mEnd });

            let hasAvailableSlots = false;
            for (const day of days) {
              const dateStr = buildDateStr(day);
              for (const hour of getHoursForDay(day.getDay())) {
                const slot = savedSlots[`${dateStr}-${hour}`];
                if (slot && slot.available && !slot.booked) { hasAvailableSlots = true; break; }
              }
              if (hasAvailableSlots) break;
            }

            return (
              <button
                key={month.toISOString()}
                onClick={(e) => { e.preventDefault(); setCurrentMonth(month); setViewMode("month"); }}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left active:scale-95",
                  hasAvailableSlots ? "border-[#1a1a1a] bg-white hover:bg-[#f7f7f5] cursor-pointer"
                    : "border-[#e8e5df] bg-[#f7f7f5] cursor-pointer"
                )}
              >
                <div className="text-[14px] font-medium text-[#1a1a1a] mb-1">{format(month, "MMMM")}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#7a756d]">
                  {hasAvailableSlots && <span className="w-[4px] h-[4px] rounded-full bg-[#b0a99f] flex-shrink-0" />}
                  {hasAvailableSlots ? "Available" : "No availability"}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={(e) => { e.preventDefault(); setViewMode("month"); }}
          className="mt-6 text-[13px] text-[#6b665e] hover:text-[#1a1a1a] font-medium active:scale-95 transition-colors"
        >
          ← Back to month view
        </button>
      </div>
    );
  }

  // ── Month view ──────────────────────────────────────────────
  const firstDayOfWeek = getDay(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, () => null);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors" aria-label="Previous month" type="button">
          <ChevronLeft className="h-5 w-5 text-[#6b665e]" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-[22px] sm:text-[26px] font-light tracking-tight text-[#1a1a1a]">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button onClick={() => setViewMode("year")} className="text-[11px] text-[#7a756d] hover:text-[#1a1a1a] font-medium transition-colors">
            View year
          </button>
        </div>
        <button onClick={handleNextMonth} className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors" aria-label="Next month" type="button">
          <ChevronRight className="h-5 w-5 text-[#6b665e]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] tracking-[0.1em] uppercase font-medium text-[#6b665e] py-2">
            {day}
          </div>
        ))}
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {daysInMonth.map((day) => {
          const isPast = isPastDate(day) && !isToday(day);
          const isSelected = selectedDateState && isSameDay(day, selectedDateState);
          const isCurrentDay = isToday(day);
          const hasAvail = !isPast && dayHasAvailability(day);

          return (
            <button
              key={day.toISOString()}
              onClick={(e) => { e.preventDefault(); handleDateClick(day); }}
              disabled={isPast}
              type="button"
              aria-label={`Select ${format(day, "EEEE, MMMM d, yyyy")}`}
              className={cn(
                "aspect-square rounded-lg border transition-all text-[13px] active:scale-95",
                isPast && "opacity-25 cursor-not-allowed bg-transparent border-transparent",
                !isPast && !isSelected && "bg-transparent border-[#d9d5cf] text-[#1a1a1a] cursor-pointer hover:bg-[#f0ede8] hover:border-[#a39e95]",
                isSelected && "bg-[#1a1a1a] border-[#1a1a1a] text-white",
                isCurrentDay && !isSelected && "ring-2 ring-[#1a1a1a]/20"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{format(day, "d")}</span>
                {hasAvail && !isSelected && (
                  <span className="block w-[4px] h-[4px] rounded-full bg-[#b0a99f] mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDateState && !isPastDate(selectedDateState) && (() => {
        const slots = visibleSlotsForDate(selectedDateState);
        return (
          <div className="mt-6 border-t border-[#e8e5df] pt-6">
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e] mb-4">
              Available times · {format(selectedDateState, "EEEE, MMMM d")}
            </p>
            {slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={(e) => { e.preventDefault(); onTimeSlotSelect(slot); }}
                    type="button"
                    className="py-2.5 px-3 rounded-lg border border-[#d9d5cf] bg-[#faf9f7] text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#f0ede8] cursor-pointer shadow-sm transition-all text-[13px] font-medium flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTime(slot.hour)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#7a756d] text-center py-4">
                No available times for this date.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
