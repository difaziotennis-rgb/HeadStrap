"use client"

import { useState } from "react"
import { EliteScheduler } from "@/components/reservations/elite-scheduler"
import { DatePicker } from "@/components/calendar/date-picker"

interface Reservation {
  id: string
  startTime: Date
  endTime: Date
  resourceType: string
  resourceId: string
  memberId: string
  memberName: string
  reservationType: "Singles" | "Doubles" | "Clinic" | "Lesson"
  guests: number
  chargeToHouseAccount: boolean
  fee: number
}

export default function ReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleCreateReservation = async (reservation: Partial<Reservation>) => {
    // Reservation is created via API in the EliteScheduler component
    // The EliteScheduler handles query invalidation automatically
    // This callback is optional and can be used for additional actions
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium text-primary mb-2 tracking-tight">
            Tennis Court Reservations
          </h1>
          <p className="text-slate-600 font-sans text-sm">
            Manage court bookings with drag-and-click scheduling
          </p>
        </div>
        <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Elite Scheduler */}
      <EliteScheduler
        selectedDate={selectedDate}
        reservations={[]}
        onCreateReservation={handleCreateReservation}
      />
    </div>
  )
}

