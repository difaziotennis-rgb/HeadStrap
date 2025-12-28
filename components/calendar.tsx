"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { TimeSlot } from "@/lib/types";
import { timeSlots, initializeMockData } from "@/lib/mock-data";
import { formatTime, isPastDate, isToday } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSlotSelect: (slot: TimeSlot) => void;
  selectedDate: Date | null;
}

export function Calendar({ onDateSelect, onTimeSlotSelect, selectedDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [selectedDateState, setSelectedDateState] = useState<Date | null>(selectedDate);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when slots change

  useEffect(() => {
    // Initialize mock data on mount (only once)
    if (typeof window !== 'undefined') {
      initializeMockData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync court availability when a date is selected
  // Only checks times that are marked as available on YOUR site
  // Debounce to avoid excessive API calls
  useEffect(() => {
    if (!selectedDateState) return;
    
    const dateStr = format(selectedDateState, 'yyyy-MM-dd');
    let timeoutId: NodeJS.Timeout;
    
    const checkAvailability = async () => {
      try {
        const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        const checks = hours.map(async (hour) => {
          const slotId = `${dateStr}-${hour}`;
          const slot = timeSlots.get(slotId);
          
          // Only check if slot exists, is marked as available on YOUR site, and isn't booked
          if (slot && slot.available && !slot.booked) {
            try {
              const response = await fetch(
                `/api/check-court-availability?date=${dateStr}&hour=${hour}`
              );
              if (response.ok) {
                const data = await response.json();
                // If external site says it's NOT available, mark it as unavailable on your site
                if (data.available === false) {
                  slot.available = false;
                  timeSlots.set(slotId, slot);
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(`slot_${slotId}`, JSON.stringify(slot));
                  }
                  // Force re-render
                  setRefreshKey(prev => prev + 1);
                }
              }
            } catch (error) {
              // Silently fail - availability check is optional
            }
          }
        });
        
        await Promise.all(checks);
      } catch (error) {
        // Silently fail - availability check is optional
      }
    };
    
    // Debounce availability checks by 300ms
    timeoutId = setTimeout(checkAvailability, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedDateState]);

  // Sync selectedDate prop with internal state
  useEffect(() => {
    if (selectedDate) {
      setSelectedDateState(selectedDate);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get available time slots for selected date (only show available and booked slots)
  const getTimeSlotsForDate = (date: Date): TimeSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const isSunday = dayOfWeek === 0;
    
    // Regular hours: 9 AM to 7 PM (9-19)
    for (let hour = 9; hour <= 19; hour++) {
      const id = `${dateStr}-${hour}`;
      let slot = timeSlots.get(id);
      
      // Create slot if it doesn't exist
      if (!slot) {
        slot = {
          id,
          date: dateStr,
          hour,
          available: false, // All slots unavailable by default
          booked: false,
        };
        timeSlots.set(id, slot);
      }
      
      // Only show slots that are available or booked (hide unavailable ones)
      if (slot.available || slot.booked) {
        slots.push(slot);
      }
    }
    
    // 3 AM (hour 3) only on Sundays
    if (isSunday) {
      const id = `${dateStr}-3`;
      let slot = timeSlots.get(id);
      
      // Create slot if it doesn't exist
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
      
      // Show 3am slot if available or booked
      if (slot.available || slot.booked) {
        slots.push(slot);
      }
    }
    
    return slots.sort((a, b) => a.hour - b.hour);
  };

  const handleDateClick = (date: Date) => {
    if (isPastDate(date) && !isToday(date)) {
      return;
    }
    // Ensure slots are initialized for this date
    const dateStr = format(date, 'yyyy-MM-dd');
    for (let hour = 9; hour <= 19; hour++) {
      const id = `${dateStr}-${hour}`;
      if (!timeSlots.has(id)) {
        timeSlots.set(id, {
          id,
          date: dateStr,
          hour,
          available: false, // All slots unavailable by default
          booked: false,
        });
      }
    }
    setSelectedDateState(date);
    onDateSelect(date);
    // Always force a re-render to show time slots
    setRefreshKey(prev => prev + 1);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(subMonths(currentMonth, 12));
  };

  const handleNextYear = () => {
    setCurrentMonth(addMonths(currentMonth, 12));
  };

  // Year view - show 12 months
  if (viewMode === "year") {
    const months = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(currentMonth.getFullYear(), i, 1);
      return month;
    });

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrevYear();
            }}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors active:scale-95"
            aria-label="Previous year"
            type="button"
          >
            <ChevronLeft className="h-5 w-5 text-primary-700" />
          </button>
          <h2 className="text-2xl font-serif text-primary-800 font-semibold">
            {currentMonth.getFullYear()}
          </h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNextYear();
            }}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors active:scale-95"
            aria-label="Next year"
            type="button"
          >
            <ChevronRight className="h-5 w-5 text-primary-700" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const hasVisibleSlots = days.some(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return Array.from({ length: 11 }, (_, i) => i + 9).some(hour => {
                const slot = timeSlots.get(`${dateStr}-${hour}`);
                return slot && (slot.available || slot.booked);
              });
            });
            
            const hasAvailableSlots = days.some(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return Array.from({ length: 11 }, (_, i) => i + 9).some(hour => {
                const slot = timeSlots.get(`${dateStr}-${hour}`);
                return slot?.available && !slot?.booked;
              });
            });

            return (
              <button
                key={month.toISOString()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentMonth(month);
                  setViewMode("month");
                }}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left active:scale-95",
                  hasAvailableSlots
                    ? "border-primary-300 bg-primary-50 hover:border-primary-500 hover:bg-primary-100 cursor-pointer"
                    : hasVisibleSlots
                    ? "border-red-300 bg-red-50 cursor-pointer"
                    : "border-gray-200 bg-gray-50 cursor-pointer"
                )}
              >
                <div className="font-semibold text-primary-800 mb-2">
                  {format(month, 'MMMM')}
                </div>
                <div className="text-sm text-earth-600">
                  {hasAvailableSlots ? "Available" : hasVisibleSlots ? "Booked only" : "No availability"}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setViewMode("month");
          }}
          className="mt-6 text-primary-700 hover:text-primary-800 font-medium active:scale-95"
        >
          ← Back to month view
        </button>
      </div>
    );
  }

  // Month view
  const firstDayOfWeek = getDay(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfWeek }, (_, i) => null);

  return (
    <div className="w-full">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
          aria-label="Previous month"
          type="button"
        >
          <ChevronLeft className="h-5 w-5 text-primary-700" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl sm:text-3xl font-serif text-primary-800 font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setViewMode("year")}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View 12 months
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
          aria-label="Next month"
          type="button"
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
          const isPast = isPastDate(day) && !isToday(day);
          const isSelected = selectedDateState && isSameDay(day, selectedDateState);
          const isCurrentDay = isToday(day);
          
          // Check if day has available slots (check existing slots or if it's a future date, assume 9 AM is available)
          const hasAvailableSlots = (() => {
            // If it's a past date, no slots
            if (isPast) return false;
            // Check if any slots exist and are available
            const existingAvailable = Array.from({ length: 11 }, (_, i) => i + 9).some(hour => {
              const slot = timeSlots.get(`${dateStr}-${hour}`);
              return slot?.available && !slot?.booked;
            });
            // If slots exist and one is available, return true
            if (existingAvailable) return true;
            // If no slots exist yet, they will all be unavailable by default
            return false;
          })();

          return (
            <button
              key={day.toISOString()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDateClick(day);
              }}
              disabled={isPast}
              type="button"
              aria-label={`Select ${format(day, 'EEEE, MMMM d, yyyy')}`}
              aria-pressed={isSelected || undefined}
              className={cn(
                "aspect-square rounded-lg border-2 transition-all text-sm font-medium active:scale-95",
                isPast && "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200",
                !isPast && !isSelected && hasAvailableSlots && "bg-primary-50 border-primary-300 hover:border-primary-500 hover:bg-primary-100 cursor-pointer",
                !isPast && !isSelected && !hasAvailableSlots && "bg-gray-50 border-gray-200 cursor-pointer",
                isSelected && "bg-primary-600 border-primary-700 text-white ring-4 ring-primary-200",
                isCurrentDay && !isSelected && "ring-2 ring-primary-400"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{format(day, 'd')}</span>
                {!isPast && hasAvailableSlots && (
                  <span className="text-[10px] text-primary-600 mt-1">•</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Slots for Selected Date */}
      {selectedDateState && !isPastDate(selectedDateState) && (() => {
        const slots = getTimeSlotsForDate(selectedDateState);
        const availableSlots = slots.filter(slot => slot.available || slot.booked);
        
        return (
          <div className="mt-8 border-t border-primary-200 pt-6" key={`slots-${refreshKey}-${selectedDateState?.getTime()}`}>
            <h3 className="text-xl font-serif text-primary-800 mb-4">
              Available Times for {format(selectedDateState, 'EEEE, MMMM d')}
            </h3>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTimeSlotSelect(slot);
                    }}
                    disabled={slot.booked || !slot.available}
                    type="button"
                    aria-label={`Book time slot at ${formatTime(slot.hour)}${slot.booked ? ' (already booked)' : ''}`}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all text-sm font-medium flex items-center justify-center gap-2 active:scale-95",
                      slot.booked && "bg-red-100 border-red-300 text-red-600 cursor-not-allowed",
                      !slot.booked && slot.available && "bg-white border-primary-300 text-primary-700 hover:border-primary-500 hover:bg-primary-50 cursor-pointer"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(slot.hour)}</span>
                    {slot.booked && <span className="text-xs">(Booked)</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-earth-600 text-center py-4">
                No available times for this date. Please select another date or contact us for availability.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

