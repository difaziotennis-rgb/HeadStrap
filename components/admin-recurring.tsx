"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Pencil, Check } from "lucide-react";
import { RecurringLesson, TimeSlot } from "@/lib/types";
import { formatTime, getHoursForDay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format, addWeeks, eachDayOfInterval, getDay } from "date-fns";

// ─── localStorage keys ───────────────────────────────────────
const RECURRING_KEY = "difazio_recurring";
const SLOTS_KEY = "difazio_admin_slots";
const WEEKS_AHEAD = 8;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── localStorage helpers ────────────────────────────────────
function loadRecurring(): RecurringLesson[] {
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (raw) return JSON.parse(raw) as RecurringLesson[];
  } catch (e) {
    console.error("loadRecurring error:", e);
  }
  return [];
}

function saveRecurring(lessons: RecurringLesson[]): boolean {
  try {
    const json = JSON.stringify(lessons);
    localStorage.setItem(RECURRING_KEY, json);
    return localStorage.getItem(RECURRING_KEY) === json;
  } catch (e) {
    console.error("saveRecurring error:", e);
    return false;
  }
}

function loadSlots(): Record<string, TimeSlot> {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) return JSON.parse(raw) as Record<string, TimeSlot>;
  } catch (e) {
    console.error("loadSlots error:", e);
  }
  return {};
}

function saveSlots(slots: Record<string, TimeSlot>): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
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

/** Get the rolling window: today → 8 weeks from today */
function getRollingEnd(): Date {
  return addWeeks(new Date(), WEEKS_AHEAD);
}

/**
 * Stamp all recurring lesson occurrences into the slots storage
 * for the rolling 8-week window from today.
 */
function stampRecurringToSlots(lessons: RecurringLesson[]) {
  const slots = loadSlots();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = getRollingEnd();

  const allDays = eachDayOfInterval({ start: today, end });

  for (const lesson of lessons) {
    for (const day of allDays) {
      if (getDay(day) !== lesson.dayOfWeek) continue;
      const dateStr = buildDateStr(day);
      if (lesson.cancelledDates.includes(dateStr)) continue;

      const id = `${dateStr}-${lesson.hour}`;
      // Don't overwrite a slot that was booked by a non-recurring client
      const existing = slots[id];
      if (existing?.booked && !existing?.notes?.startsWith("Recurring:")) continue;

      slots[id] = {
        id,
        date: dateStr,
        hour: lesson.hour,
        available: true,
        booked: true,
        bookedBy: lesson.clientName,
        bookedEmail: lesson.clientEmail,
        bookedPhone: lesson.clientPhone,
        notes: `Recurring: ${lesson.id}`,
      };
    }
  }

  saveSlots(slots);
}

/**
 * Remove slots owned by a specific recurring lesson across all time.
 */
function removeRecurringSlotsForLesson(lesson: RecurringLesson) {
  const slots = loadSlots();
  const keysToDelete: string[] = [];
  for (const key of Object.keys(slots)) {
    if (slots[key]?.notes === `Recurring: ${lesson.id}`) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    delete slots[key];
  }
  saveSlots(slots);
}

/**
 * Prune cancelled dates that are in the past (house-keeping).
 */
function pruneOldCancellations(lessons: RecurringLesson[]): RecurringLesson[] {
  const todayStr = buildDateStr(new Date());
  let changed = false;
  const pruned = lessons.map((l) => {
    const filtered = l.cancelledDates.filter((d) => d >= todayStr);
    if (filtered.length !== l.cancelledDates.length) changed = true;
    return { ...l, cancelledDates: filtered };
  });
  if (changed) saveRecurring(pruned);
  return changed ? pruned : lessons;
}

// ─── Component ───────────────────────────────────────────────
export function AdminRecurring() {
  const [lessons, setLessons] = useState<RecurringLesson[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDay, setFormDay] = useState(1); // Monday default
  const [formHour, setFormHour] = useState(10);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  useEffect(() => {
    let data = loadRecurring();
    // Prune old cancelled dates
    data = pruneOldCancellations(data);
    setLessons(data);
    // Auto-refresh: re-stamp the next 8 weeks on every load
    if (data.length > 0) {
      stampRecurringToSlots(data);
    }
    setLoaded(true);
  }, []);

  function handleAdd() {
    if (!formName.trim()) return;

    const today = new Date();
    const startDate = buildDateStr(today);

    const newLesson: RecurringLesson = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      clientName: formName.trim(),
      clientEmail: formEmail.trim() || undefined,
      clientPhone: formPhone.trim() || undefined,
      dayOfWeek: formDay,
      hour: formHour,
      startDate,
      endDate: "", // not used — rolling window
      cancelledDates: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...lessons, newLesson];
    setLessons(updated);
    saveRecurring(updated);
    stampRecurringToSlots(updated);

    // Reset form
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setShowAddForm(false);
    setSaveMsg("Recurring lesson added & calendar updated");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function handleDelete(id: string) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;

    // Remove all slots this recurring lesson created
    removeRecurringSlotsForLesson(lesson);

    const updated = lessons.filter((l) => l.id !== id);
    setLessons(updated);
    saveRecurring(updated);
    setSaveMsg("Recurring lesson removed");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function handleCancelDate(lessonId: string, dateStr: string) {
    const updated = lessons.map((l) => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        cancelledDates: [...l.cancelledDates, dateStr],
      };
    });
    setLessons(updated);
    saveRecurring(updated);

    // Remove this specific slot
    const slots = loadSlots();
    const lesson = updated.find((l) => l.id === lessonId);
    if (lesson) {
      const slotId = `${dateStr}-${lesson.hour}`;
      const slot = slots[slotId];
      if (slot?.notes?.includes(lessonId)) {
        delete slots[slotId];
      }
      saveSlots(slots);
    }

    setSaveMsg("Week cancelled");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function handleRestoreDate(lessonId: string, dateStr: string) {
    const updated = lessons.map((l) => {
      if (l.id !== lessonId) return l;
      return {
        ...l,
        cancelledDates: l.cancelledDates.filter((d) => d !== dateStr),
      };
    });
    setLessons(updated);
    saveRecurring(updated);
    stampRecurringToSlots(updated);

    setSaveMsg("Week restored");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  function handleEdit(id: string, updates: { clientName?: string; clientEmail?: string; clientPhone?: string; dayOfWeek?: number; hour?: number }) {
    const oldLesson = lessons.find((l) => l.id === id);
    if (!oldLesson) return;

    // If day or hour changed, remove old slots first
    if (updates.dayOfWeek !== undefined || updates.hour !== undefined) {
      removeRecurringSlotsForLesson(oldLesson);
    }

    const updated = lessons.map((l) => {
      if (l.id !== id) return l;
      return { ...l, ...updates };
    });
    setLessons(updated);
    saveRecurring(updated);

    // Re-stamp if day/hour/name changed
    stampRecurringToSlots(updated);

    setSaveMsg("Recurring lesson updated");
    setTimeout(() => setSaveMsg(null), 3000);
  }

  // Get next 8 weeks of upcoming dates for a recurring lesson
  function getUpcomingDates(lesson: RecurringLesson): { dateStr: string; cancelled: boolean }[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = getRollingEnd();
    const results: { dateStr: string; cancelled: boolean }[] = [];

    const current = new Date(today);
    while (current <= end) {
      if (getDay(current) === lesson.dayOfWeek) {
        const dateStr = buildDateStr(current);
        results.push({
          dateStr,
          cancelled: lesson.cancelledDates.includes(dateStr),
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return results;
  }

  const availableHours = getHoursForDay(formDay);

  if (!loaded) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-light tracking-tight text-[#1a1a1a]">
            Recurring Lessons
          </h2>
          <p className="text-[11px] text-[#a39e95] mt-0.5">
            {lessons.length} active{" "}
            {lessons.length === 1 ? "lesson" : "lessons"} &middot; rolling {WEEKS_AHEAD} weeks
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {saveMsg && (
        <div className="mb-4 bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534] rounded-xl px-4 py-2.5 text-[12px] text-center">
          {saveMsg}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-5 border border-[#e8e5df] rounded-xl p-4 bg-[#faf9f7]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e] font-medium">
              New Recurring Lesson
            </p>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-[#e8e5df] rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-[#a39e95]" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                Client Name <span className="text-[#1a1a1a]">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                placeholder="Client name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                  Day of Week
                </label>
                <select
                  value={formDay}
                  onChange={(e) => {
                    const newDay = Number(e.target.value);
                    setFormDay(newDay);
                    const newHours = getHoursForDay(newDay);
                    if (!newHours.includes(formHour)) {
                      setFormHour(newHours[0]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none appearance-none"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                  Time
                </label>
                <select
                  value={formHour}
                  onChange={(e) => setFormHour(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none appearance-none"
                >
                  {availableHours.map((h) => (
                    <option key={h} value={h}>
                      {formatTime(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-[#a39e95]">
              Automatically books the next {WEEKS_AHEAD} weeks and keeps rolling forward.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formName.trim()}
                className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-40"
              >
                Add Recurring Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule View */}
      {lessons.length === 0 && !showAddForm && (
        <div className="text-center py-10">
          <p className="text-[13px] text-[#7a756d] mb-1">No recurring lessons yet</p>
          <p className="text-[11px] text-[#a39e95]">
            Add a recurring lesson to automatically book it every week
          </p>
        </div>
      )}

      {lessons.length > 0 && (
        <div className="space-y-2">
          {DAY_NAMES.map((dayName, dayIdx) => {
            const dayLessons = lessons
              .filter((l) => l.dayOfWeek === dayIdx)
              .sort((a, b) => a.hour - b.hour);

            return (
              <div
                key={dayIdx}
                className={cn(
                  "rounded-xl border transition-all",
                  dayLessons.length > 0
                    ? "border-[#e8e5df] bg-white"
                    : "border-[#e8e5df] bg-[#faf9f7] opacity-50"
                )}
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium",
                      dayLessons.length > 0
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-[#f0ede8] text-[#6b665e]"
                    )}>
                      {DAY_SHORT[dayIdx]}
                    </div>
                    <p className={cn(
                      "text-[13px] font-medium",
                      dayLessons.length > 0 ? "text-[#1a1a1a]" : "text-[#a39e95]"
                    )}>
                      {dayName}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#a39e95]">
                    {dayLessons.length > 0
                      ? `${dayLessons.length} lesson${dayLessons.length !== 1 ? "s" : ""}`
                      : "No lessons"}
                  </span>
                </div>

                {/* Lesson pills */}
                {dayLessons.length > 0 && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {dayLessons.map((lesson) => (
                        <RecurringLessonPill
                          key={lesson.id}
                          lesson={lesson}
                          isActive={expandedLessonId === lesson.id}
                          onTap={() => setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id)}
                        />
                      ))}
                    </div>

                    {/* Expanded detail for selected lesson in this day */}
                    {expandedLessonId && dayLessons.some((l) => l.id === expandedLessonId) && (() => {
                      const lesson = lessons.find((l) => l.id === expandedLessonId);
                      if (!lesson) return null;
                      return (
                        <RecurringLessonDetail
                          lesson={lesson}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onCancelDate={handleCancelDate}
                          onRestoreDate={handleRestoreDate}
                          getUpcomingDates={getUpcomingDates}
                          onClose={() => setExpandedLessonId(null)}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Recurring Lesson Pill (in weekly view) ─────────────────
function RecurringLessonPill({
  lesson,
  isActive,
  onTap,
}: {
  lesson: RecurringLesson;
  isActive: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      type="button"
      className={cn(
        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95",
        isActive
          ? "bg-[#333] text-white ring-2 ring-[#1a1a1a]/30"
          : "bg-[#1a1a1a] text-white hover:bg-[#333]"
      )}
    >
      {formatTime(lesson.hour)}
      <span className="text-white/60 ml-1">· {lesson.clientName.split(" ")[0]}</span>
    </button>
  );
}

// ─── Recurring Lesson Detail (expanded below pills) ─────────
function RecurringLessonDetail({
  lesson,
  onEdit,
  onDelete,
  onCancelDate,
  onRestoreDate,
  getUpcomingDates,
  onClose,
}: {
  lesson: RecurringLesson;
  onEdit: (id: string, updates: { clientName?: string; clientEmail?: string; clientPhone?: string; dayOfWeek?: number; hour?: number }) => void;
  onDelete: (id: string) => void;
  onCancelDate: (id: string, date: string) => void;
  onRestoreDate: (id: string, date: string) => void;
  getUpcomingDates: (lesson: RecurringLesson) => { dateStr: string; cancelled: boolean }[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"info" | "edit">("info");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [editName, setEditName] = useState(lesson.clientName);
  const [editEmail, setEditEmail] = useState(lesson.clientEmail || "");
  const [editPhone, setEditPhone] = useState(lesson.clientPhone || "");
  const [editDay, setEditDay] = useState(lesson.dayOfWeek);
  const [editHour, setEditHour] = useState(lesson.hour);
  const editHours = getHoursForDay(editDay);

  const upcoming = getUpcomingDates(lesson);

  function startEditing() {
    setEditName(lesson.clientName);
    setEditEmail(lesson.clientEmail || "");
    setEditPhone(lesson.clientPhone || "");
    setEditDay(lesson.dayOfWeek);
    setEditHour(lesson.hour);
    setMode("edit");
  }

  function saveEdit() {
    if (!editName.trim()) return;
    onEdit(lesson.id, {
      clientName: editName.trim(),
      clientEmail: editEmail.trim() || undefined,
      clientPhone: editPhone.trim() || undefined,
      dayOfWeek: editDay,
      hour: editHour,
    });
    onClose();
  }

  return (
    <div className="mt-3 p-4 bg-[#faf9f7] border border-[#e8e5df] rounded-xl">
      {mode === "info" && (
        <>
          {/* Header with actions */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">{lesson.clientName}</p>
              <p className="text-[11px] text-[#7a756d]">
                {DAY_NAMES[lesson.dayOfWeek]}s at {formatTime(lesson.hour)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={startEditing}
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1a1a1a] text-white rounded-lg text-[11px] font-medium hover:bg-[#333] transition-colors"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 hover:bg-[#e8e5df] rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-[#a39e95]" />
              </button>
            </div>
          </div>

          {/* Upcoming weeks */}
          <p className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-2">
            Next {WEEKS_AHEAD} weeks
          </p>
          {upcoming.length === 0 ? (
            <p className="text-[11px] text-[#a39e95]">No upcoming dates</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map(({ dateStr, cancelled }) => {
                const d = new Date(dateStr + "T12:00:00");
                return (
                  <div key={dateStr} className="flex items-center justify-between py-1">
                    <span className={cn("text-[12px]", cancelled ? "text-[#c4bfb8] line-through" : "text-[#1a1a1a]")}>
                      {format(d, "EEE, MMM d")}
                    </span>
                    {cancelled ? (
                      <button onClick={() => onRestoreDate(lesson.id, dateStr)} className="text-[11px] text-[#6b665e] hover:text-[#1a1a1a] font-medium transition-colors">
                        Restore
                      </button>
                    ) : (
                      <button onClick={() => onCancelDate(lesson.id, dateStr)} className="text-[11px] text-[#b05454] hover:text-[#991b1b] font-medium transition-colors">
                        Cancel week
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Delete */}
          <div className="mt-3 pt-3 border-t border-[#e8e5df]">
            {!showConfirmDelete ? (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-1.5 text-[11px] text-[#b05454] hover:text-[#991b1b] font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete recurring lesson
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#6b665e]">Are you sure?</span>
                <button onClick={() => { onDelete(lesson.id); onClose(); }} className="px-3 py-1 bg-[#991b1b] text-white rounded-md text-[11px] font-medium hover:bg-[#7f1d1d] transition-colors">
                  Delete
                </button>
                <button onClick={() => setShowConfirmDelete(false)} className="px-3 py-1 border border-[#e8e5df] text-[#6b665e] rounded-md text-[11px] font-medium hover:bg-[#f0ede8] transition-colors">
                  No
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {mode === "edit" && (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.12em] uppercase text-[#6b665e] font-medium">Edit Recurring Lesson</p>
          <div>
            <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">Client Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">Email</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">Phone</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none" placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">Day</label>
              <select value={editDay} onChange={(e) => { const d = Number(e.target.value); setEditDay(d); const h = getHoursForDay(d); if (!h.includes(editHour)) setEditHour(h[0]); }} className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none appearance-none">
                {DAY_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">Time</label>
              <select value={editHour} onChange={(e) => setEditHour(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none appearance-none">
                {editHours.map((h) => <option key={h} value={h}>{formatTime(h)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setMode("info")} className="flex-1 py-2 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors">Cancel</button>
            <button onClick={saveEdit} disabled={!editName.trim()} className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
