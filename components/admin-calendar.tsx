"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { timeSlots, initializeMockData } from "@/lib/mock-data";
import { formatTime, isPastDate, getHoursForDay } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when slots change

  useEffect(() => {
    // Initialize mock data
    if (typeof window !== 'undefined') {
      initializeMockData();
    }
    
    // Load existing available slots
    const available = new Set<string>();
    timeSlots.forEach((slot) => {
      if (slot.available && !slot.booked) {
        available.add(slot.id);
      }
    });
    setSelectedSlots(available);
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTimeSlotsForDate = (date: Date): TimeSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots: TimeSlot[] = [];
    const dayOfWeek = getDay(date); // 0 = Sunday
    const isSunday = dayOfWeek === 0;
    
    // Regular hours based on day of week
    const hours = getHoursForDay(dayOfWeek);
    for (const hour of hours) {
      const id = `${dateStr}-${hour}`;
      let slot = timeSlots.get(id);
      
      if (!slot) {
        slot = {
          id,
          date: dateStr,
          hour,
          available: false,
          booked: false,
        };
        timeSlots.set(id, slot);
      }
      
      slots.push(slot);
    }
    
    // 3 AM (hour 3) only on Sundays
    if (isSunday) {
      const id = `${dateStr}-3`;
      let slot = timeSlots.get(id);
      
      if (!slot) {
        slot = {
          id,
          date: dateStr,
          hour: 3,
          available: true, // 3am is available by default on Sundays
          booked: false,
        };
        timeSlots.set(id, slot);
      }
      
      slots.push(slot);
    }
    
    return slots.sort((a, b) => a.hour - b.hour);
  };

  const handleToggleSlot = (slotId: string, isBooked: boolean) => {
    if (isBooked) return; // Can't toggle booked slots

    const slot = timeSlots.get(slotId);
    if (!slot) return;

    const newAvailable = !slot.available;
    const updatedSlot: TimeSlot = {
      ...slot,
      available: newAvailable,
    };
    timeSlots.set(slotId, updatedSlot);

    // Update selected slots set
    const newSelected = new Set(selectedSlots);
    if (newAvailable) {
      newSelected.add(slotId);
    } else {
      newSelected.delete(slotId);
    }
    setSelectedSlots(newSelected);
    // Force re-render
    setRefreshKey(prev => prev + 1);
  };

  const handleBulkToggle = (date: Date, makeAvailable: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots = getTimeSlotsForDate(date);
    
    slots.forEach((slot) => {
      if (slot.booked) return; // Skip booked slots
      
      const updatedSlot: TimeSlot = {
        ...slot,
        available: makeAvailable,
      };
      timeSlots.set(slot.id, updatedSlot);

      const newSelected = new Set(selectedSlots);
      if (makeAvailable) {
        newSelected.add(slot.id);
      } else {
        newSelected.delete(slot.id);
      }
      setSelectedSlots(newSelected);
    });
    // Force re-render
    setRefreshKey(prev => prev + 1);
  };

  const firstDayOfWeek = getDay(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentMonth(subMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors active:scale-95"
          type="button"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-primary-700" />
        </button>
        <h2 className="text-2xl sm:text-3xl font-serif text-primary-800 font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCurrentMonth(addMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors active:scale-95"
          type="button"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-primary-700" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-primary-700 py-2"
          >
            {day}
          </div>
        ))}
        {daysBeforeMonth.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isPast = isPastDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const slots = getTimeSlotsForDate(day);
          const availableCount = slots.filter(s => s.available && !s.booked).length;
          const bookedCount = slots.filter(s => s.booked).length;

          const handleAdminDateClick = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            // Ensure slots are initialized for this date
            const dayHours = getHoursForDay(getDay(day));
            for (const hour of dayHours) {
              const id = `${dateStr}-${hour}`;
              if (!timeSlots.has(id)) {
                timeSlots.set(id, {
                  id,
                  date: dateStr,
                  hour,
                  available: false, // Admin view - all unavailable by default
                  booked: false,
                });
              }
            }
            setSelectedDate(day);
          };

          return (
            <button
              key={day.toISOString()}
              onClick={handleAdminDateClick}
              disabled={isPast}
              type="button"
              aria-label={`Select ${format(day, 'EEEE, MMMM d, yyyy')} for availability management`}
              aria-pressed={isSelected || undefined}
              className={cn(
                "aspect-square rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center justify-center p-1",
                isPast && "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200",
                !isPast && !isSelected && "bg-white border-primary-300 hover:border-primary-500 cursor-pointer active:scale-95",
                isSelected && "bg-primary-600 border-primary-700 text-white ring-4 ring-primary-200"
              )}
            >
              <span>{format(day, 'd')}</span>
              {!isPast && (
                <div className="text-[10px] mt-1 space-y-0.5">
                  {availableCount > 0 && (
                    <div className="text-green-600 font-semibold">{availableCount}</div>
                  )}
                  {bookedCount > 0 && (
                    <div className="text-red-600 font-semibold">-{bookedCount}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDate && !isPastDate(selectedDate) && (
        <div className="mt-8 border-t border-primary-200 pt-6" key={`admin-slots-${refreshKey}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-serif text-primary-800">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkToggle(selectedDate, true);
                }}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium active:scale-95 cursor-pointer"
                type="button"
                aria-label="Make all time slots available for this date"
              >
                Make All Available
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBulkToggle(selectedDate, false);
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium active:scale-95 cursor-pointer"
                type="button"
                aria-label="Make all time slots unavailable for this date"
              >
                Make All Unavailable
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {getTimeSlotsForDate(selectedDate).map((slot) => (
              <button
                key={slot.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleSlot(slot.id, slot.booked);
                }}
                disabled={slot.booked}
                type="button"
                aria-label={`Toggle availability for ${formatTime(slot.hour)}${slot.booked ? ' (cannot change booked slot)' : ''}`}
                aria-pressed={slot.available || undefined}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-sm font-medium flex flex-col items-center gap-2",
                  slot.booked && "bg-red-50 border-red-300 text-red-600 cursor-not-allowed",
                  !slot.booked && slot.available && "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 cursor-pointer",
                  !slot.booked && !slot.available && "bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer"
                )}
              >
                <span className="font-semibold">{formatTime(slot.hour)}</span>
                {slot.booked ? (
                  <X className="h-4 w-4 text-red-600" />
                ) : slot.available ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <span className="text-xs">Unavailable</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-earth-600 mt-4">
            <span className="inline-block w-3 h-3 bg-green-400 rounded mr-2"></span>
            Available
            <span className="inline-block w-3 h-3 bg-gray-300 rounded mr-2 ml-4"></span>
            Unavailable
            <span className="inline-block w-3 h-3 bg-red-300 rounded mr-2 ml-4"></span>
            Booked
          </p>
        </div>
      )}
    </div>
  );
}

