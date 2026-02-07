"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { formatTime, getHoursForDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "difazio_admin_slots";

function loadSlots(): Record<string, TimeSlot> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, TimeSlot>;
  } catch (e) {
    console.error("loadSlots error:", e);
  }
  return {};
}

function buildDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface DaySlotInfo {
  slot: TimeSlot;
  isDefault: boolean; // true if this slot wasn't explicitly set by admin
}

export function AdminDashboard() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [slots, setSlots] = useState<Record<string, TimeSlot>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSlots(loadSlots());
    setLoaded(true);
  }, []);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  function getSlotsForDay(date: Date): { available: TimeSlot[]; booked: TimeSlot[] } {
    const dateStr = buildDateStr(date);
    const hours = getHoursForDay(date.getDay());
    const available: TimeSlot[] = [];
    const booked: TimeSlot[] = [];

    for (const hour of hours) {
      const id = `${dateStr}-${hour}`;
      const slot = slots[id];
      if (slot?.booked) {
        booked.push(slot);
      } else if (slot?.available) {
        available.push(slot);
      }
    }
    return { available, booked };
  }

  // Count totals for the week
  const weekStats = (() => {
    let totalAvailable = 0;
    let totalBooked = 0;
    for (const day of days) {
      const { available, booked } = getSlotsForDay(day);
      totalAvailable += available.length;
      totalBooked += booked.length;
    }
    return { totalAvailable, totalBooked };
  })();

  const isCurrentWeek =
    isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 0 }));

  if (!loaded) return null;

  return (
    <div className="w-full">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekStart(subWeeks(weekStart, 1))}
          className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
          type="button"
        >
          <ChevronLeft className="h-5 w-5 text-[#6b665e]" />
        </button>
        <div className="text-center">
          <h2 className="text-[18px] sm:text-[20px] font-light tracking-tight text-[#1a1a1a]">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </h2>
          {isCurrentWeek && (
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#b0a99f] mt-0.5">
              This week
            </p>
          )}
        </div>
        <button
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
          className="p-2 hover:bg-[#f0ede8] rounded-lg transition-colors active:scale-95"
          type="button"
        >
          <ChevronRight className="h-5 w-5 text-[#6b665e]" />
        </button>
      </div>

      {/* Jump to today */}
      {!isCurrentWeek && (
        <div className="text-center mb-4">
          <button
            onClick={() =>
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
            }
            className="text-[11px] text-[#6b665e] hover:text-[#1a1a1a] font-medium transition-colors"
          >
            ← Back to this week
          </button>
        </div>
      )}

      {/* Week summary */}
      <div className="flex items-center justify-center gap-6 mb-5">
        <div className="text-center">
          <p className="text-[22px] font-light text-[#1a1a1a]">
            {weekStats.totalBooked}
          </p>
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#a39e95]">
            Lessons
          </p>
        </div>
        <div className="w-px h-8 bg-[#e8e5df]" />
        <div className="text-center">
          <p className="text-[22px] font-light text-[#1a1a1a]">
            {weekStats.totalAvailable}
          </p>
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#a39e95]">
            Open slots
          </p>
        </div>
      </div>

      {/* Daily schedule cards */}
      <div className="space-y-2">
        {days.map((day) => {
          const today = isToday(day);
          const { available, booked } = getSlotsForDay(day);
          const hasActivity = available.length > 0 || booked.length > 0;
          const isPast =
            day < new Date(new Date().setHours(0, 0, 0, 0)) && !today;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-xl border transition-all",
                today
                  ? "border-[#1a1a1a] bg-white"
                  : isPast
                  ? "border-[#e8e5df] bg-[#faf9f7] opacity-50"
                  : "border-[#e8e5df] bg-white"
              )}
            >
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-medium",
                      today
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-[#f0ede8] text-[#6b665e]"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-[13px] font-medium",
                        today ? "text-[#1a1a1a]" : "text-[#6b665e]"
                      )}
                    >
                      {format(day, "EEEE")}
                    </p>
                    <p className="text-[10px] text-[#a39e95]">
                      {format(day, "MMM d")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {booked.length > 0 && (
                    <span className="text-[#1a1a1a] font-medium">
                      {booked.length} lesson{booked.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {available.length > 0 && (
                    <span className="text-[#a39e95]">
                      {available.length} open
                    </span>
                  )}
                  {!hasActivity && (
                    <span className="text-[#c4bfb8]">No schedule</span>
                  )}
                </div>
              </div>

              {/* Slot details — only show if there are booked or available */}
              {hasActivity && (
                <div className="px-4 pb-3 pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {[...booked, ...available]
                      .sort((a, b) => a.hour - b.hour)
                      .map((slot) =>
                        slot.booked ? (
                          <div
                            key={slot.id}
                            className="px-2.5 py-1 rounded-md bg-[#1a1a1a] text-white text-[11px] font-medium"
                          >
                            {formatTime(slot.hour)}
                            {slot.bookedBy && (
                              <span className="text-white/60 ml-1">
                                · {slot.bookedBy.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            key={slot.id}
                            className="px-2.5 py-1 rounded-md border border-[#d9d5cf] text-[#7a756d] text-[11px]"
                          >
                            {formatTime(slot.hour)}
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
