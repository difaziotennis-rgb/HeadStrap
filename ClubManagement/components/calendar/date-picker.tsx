"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday } from "date-fns"

interface DatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [viewMonth, setViewMonth] = useState(selectedDate)

  const weekStart = startOfWeek(viewMonth, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(viewMonth, { weekStartsOn: 0 })
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleToday = () => {
    const today = new Date()
    onDateChange(today)
    setViewMonth(today)
  }

  const handlePreviousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  const handleDateSelect = (date: Date) => {
    onDateChange(date)
    setShowCalendar(false)
  }

  return (
    <div className="relative">
      {/* Date Navigation Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousDay}
          className="font-sans"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className="gap-2 font-sans min-w-[180px]"
        >
          <Calendar className="h-4 w-4" />
          {format(selectedDate, "EEE, MMM d, yyyy")}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextDay}
          className="font-sans"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={handleToday}
          className="font-sans"
        >
          Today
        </Button>
      </div>

      {/* Calendar Dropdown */}
      {showCalendar && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCalendar(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 min-w-[320px]">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                className="font-sans"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-display font-medium text-primary">
                {format(viewMonth, "MMMM yyyy")}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="font-sans"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-sans font-medium text-slate-600 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentDay = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDateSelect(day)}
                    className={`
                      h-8 w-8 rounded-md text-sm font-sans transition-colors
                      ${isSelected
                        ? "bg-primary text-white"
                        : isCurrentDay
                        ? "bg-slate-100 text-primary font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="flex-1 font-sans"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalendar(false)}
                className="font-sans"
              >
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


