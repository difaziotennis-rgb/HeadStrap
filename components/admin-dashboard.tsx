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
import { ChevronLeft, ChevronRight, X, Pencil, Trash2, Check } from "lucide-react";
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

function saveSlots(slots: Record<string, TimeSlot>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch (e) {
    console.error("saveSlots error:", e);
  }
}

function buildDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function AdminDashboard() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [slots, setSlots] = useState<Record<string, TimeSlot>>({});
  const [loaded, setLoaded] = useState(false);

  // Lesson action state
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<"menu" | "edit" | null>(null);
  const [editName, setEditName] = useState("");
  const [editHour, setEditHour] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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

  function openMenu(slot: TimeSlot) {
    setActiveSlotId(slot.id);
    setActionMode("menu");
    setEditName(slot.bookedBy || "");
    setEditHour(slot.hour);
  }

  function startEdit() {
    setActionMode("edit");
  }

  function closeAction() {
    setActiveSlotId(null);
    setActionMode(null);
    setEditName("");
    setEditHour(0);
  }

  function handleSaveEdit() {
    if (!activeSlotId || !editName.trim()) return;
    const slot = slots[activeSlotId];
    if (!slot) return;

    const updated = { ...slots };

    // If hour changed, move the slot
    if (editHour !== slot.hour) {
      const newId = `${slot.date}-${editHour}`;
      // Remove old slot
      delete updated[activeSlotId];
      // Create new slot
      updated[newId] = {
        ...slot,
        id: newId,
        hour: editHour,
        bookedBy: editName.trim(),
      };
    } else {
      updated[activeSlotId] = {
        ...slot,
        bookedBy: editName.trim(),
      };
    }

    setSlots(updated);
    saveSlots(updated);
    closeAction();
    setStatusMsg("Lesson updated");
    setTimeout(() => setStatusMsg(null), 3000);
  }

  function handleDelete() {
    if (!activeSlotId) return;
    const updated = { ...slots };
    delete updated[activeSlotId];
    setSlots(updated);
    saveSlots(updated);
    closeAction();
    setStatusMsg("Lesson removed");
    setTimeout(() => setStatusMsg(null), 3000);
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

  // Get active slot info for the edit form
  const activeSlot = activeSlotId ? slots[activeSlotId] : null;
  const activeSlotDayOfWeek = activeSlot ? new Date(activeSlot.date + "T12:00:00").getDay() : 0;
  const editAvailableHours = getHoursForDay(activeSlotDayOfWeek);

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

      {/* Status message */}
      {statusMsg && (
        <div className="mb-4 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] rounded-xl px-4 py-2.5 text-[12px] text-center">
          {statusMsg}
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

              {/* Slot details */}
              {hasActivity && (
                <div className="px-4 pb-3 pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {[...booked, ...available]
                      .sort((a, b) => a.hour - b.hour)
                      .map((slot) =>
                        slot.booked ? (
                          <button
                            key={slot.id}
                            onClick={() => openMenu(slot)}
                            type="button"
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95",
                              activeSlotId === slot.id
                                ? "bg-[#333] text-white ring-2 ring-[#1a1a1a]/30"
                                : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                            )}
                          >
                            {formatTime(slot.hour)}
                            {slot.bookedBy && (
                              <span className="text-white/60 ml-1">
                                · {slot.bookedBy.split(" ")[0]}
                              </span>
                            )}
                          </button>
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

                  {/* Action menu / edit form for selected slot in this day */}
                  {activeSlotId && activeSlot && activeSlot.date === buildDateStr(day) && (
                    <div className="mt-3 p-4 bg-[#faf9f7] border border-[#e8e5df] rounded-xl">
                      {actionMode === "menu" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#6b665e] mr-auto">
                            {formatTime(activeSlot.hour)}
                            {activeSlot.bookedBy && ` — ${activeSlot.bookedBy}`}
                          </span>
                          <button
                            onClick={startEdit}
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#991b1b] text-white rounded-lg text-[12px] font-medium hover:bg-[#7f1d1d] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                          <button
                            onClick={closeAction}
                            type="button"
                            className="p-2 hover:bg-[#e8e5df] rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4 text-[#a39e95]" />
                          </button>
                        </div>
                      )}

                      {actionMode === "edit" && (
                        <div className="space-y-3">
                          <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e] font-medium">
                            Edit Lesson
                          </p>
                          <div>
                            <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                              Client Name
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                              placeholder="Client name"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                              Time
                            </label>
                            <select
                              value={editHour}
                              onChange={(e) => setEditHour(Number(e.target.value))}
                              className="w-full px-3 py-2.5 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none appearance-none"
                            >
                              {editAvailableHours.map((h) => (
                                <option key={h} value={h}>{formatTime(h)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={closeAction}
                              type="button"
                              className="flex-1 py-2.5 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={!editName.trim()}
                              type="button"
                              className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
