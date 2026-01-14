"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { format, parse } from "date-fns"

interface Reservation {
  id: string
  startTime: Date
  endTime: Date
  resourceType: string
  resourceId: string
  memberId: string
  memberName: string
  guests: number
  fee: number
}

interface CourtGridProps {
  selectedDate: Date
  reservations: Reservation[]
  onCreateReservation: (reservation: Partial<Reservation>) => Promise<void>
}

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = 6 + i // 6 AM to 10 PM
  return `${hour.toString().padStart(2, "0")}:00`
})

const COURTS = Array.from({ length: 10 }, (_, i) => `Court ${i + 1}`)

export function CourtGrid({ selectedDate, reservations, onCreateReservation }: CourtGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ court: string; time: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ court: string; time: string } | null>(null)

  const [formData, setFormData] = useState({
    memberName: "",
    memberNumber: "",
    guests: 0,
    duration: 60, // minutes
    fee: 0,
  })

  const isTimeSlotBooked = useCallback(
    (court: string, time: string) => {
      const [hour, minute] = time.split(":").map(Number)
      const slotStart = new Date(selectedDate)
      slotStart.setHours(hour, minute, 0, 0)

      return reservations.some((res) => {
        if (res.resourceId !== court || res.resourceType !== "TENNIS_COURT") return false

        const resStart = new Date(res.startTime)
        const resEnd = new Date(res.endTime)

        return slotStart >= resStart && slotStart < resEnd
      })
    },
    [reservations, selectedDate]
  )

  const checkOverlap = useCallback(
    (court: string, startTime: Date, endTime: Date) => {
      return reservations.some((res) => {
        if (res.resourceId !== court || res.resourceType !== "TENNIS_COURT") return false

        const resStart = new Date(res.startTime)
        const resEnd = new Date(res.endTime)

        return (
          (startTime >= resStart && startTime < resEnd) ||
          (endTime > resStart && endTime <= resEnd) ||
          (startTime <= resStart && endTime >= resEnd)
        )
      })
    },
    [reservations]
  )

  const handleCellClick = (court: string, time: string) => {
    if (isTimeSlotBooked(court, time)) return

    setSelectedCell({ court, time })
    setIsDialogOpen(true)
  }

  const handleMouseDown = (court: string, time: string) => {
    if (isTimeSlotBooked(court, time)) return
    setDragging(true)
    setDragStart({ court, time })
    setSelectedCell({ court, time })
  }

  const handleMouseEnter = (court: string, time: string) => {
    if (!dragging || !dragStart) return
    if (isTimeSlotBooked(court, time)) return
    setSelectedCell({ court, time })
  }

  const handleMouseUp = () => {
    if (dragging && selectedCell) {
      setIsDialogOpen(true)
    }
    setDragging(false)
    setDragStart(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCell) return

    const [hour, minute] = selectedCell.time.split(":").map(Number)
    const startTime = new Date(selectedDate)
    startTime.setHours(hour, minute, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + formData.duration)

    // Check for overlaps
    if (checkOverlap(selectedCell.court, startTime, endTime)) {
      alert("This time slot overlaps with an existing reservation")
      return
    }

    await onCreateReservation({
      startTime,
      endTime,
      resourceType: "TENNIS_COURT",
      resourceId: selectedCell.court,
      memberName: formData.memberName,
      guests: formData.guests,
      fee: formData.fee,
    })

    setIsDialogOpen(false)
    setSelectedCell(null)
    setFormData({
      memberName: "",
      memberNumber: "",
      guests: 0,
      duration: 60,
      fee: 0,
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Tennis Court Reservation Grid</CardTitle>
          <CardDescription className="font-sans">
            {format(selectedDate, "EEEE, MMMM d, yyyy")} - Click or drag to create reservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white border border-slate-200 p-2 text-xs font-sans font-medium text-slate-600 text-left min-w-[80px]">
                      Time
                    </th>
                    {COURTS.map((court) => (
                      <th
                        key={court}
                        className="border border-slate-200 p-2 text-xs font-sans font-medium text-slate-600 text-center min-w-[100px]"
                      >
                        {court}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  onMouseLeave={() => setDragging(false)}
                  onMouseUp={handleMouseUp}
                >
                  {TIME_SLOTS.map((time) => (
                    <tr key={time}>
                      <td className="sticky left-0 z-10 bg-white border border-slate-200 p-2 text-xs font-sans text-slate-600 font-medium">
                        {time}
                      </td>
                      {COURTS.map((court) => {
                        const isBooked = isTimeSlotBooked(court, time)
                        const isSelected =
                          selectedCell?.court === court && selectedCell?.time === time

                        return (
                          <td
                            key={`${court}-${time}`}
                            className={`
                              border border-slate-200 p-1 h-12 cursor-pointer transition-colors
                              ${isBooked ? "bg-red-100 hover:bg-red-200" : ""}
                              ${isSelected && !isBooked ? "bg-primary/20" : ""}
                              ${!isBooked && !isSelected ? "hover:bg-slate-50" : ""}
                            `}
                            onMouseDown={() => handleMouseDown(court, time)}
                            onMouseEnter={() => handleMouseEnter(court, time)}
                            onClick={() => handleCellClick(court, time)}
                          >
                            {isBooked && (
                              <div className="text-xs font-sans text-primary truncate">
                                {reservations.find(
                                  (r) =>
                                    r.resourceId === court &&
                                    new Date(r.startTime).getHours() === parseInt(time.split(":")[0])
                                )?.memberName || "Booked"}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reservation</DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  {selectedCell.court} - {selectedCell.time} on {format(selectedDate, "MMM d, yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">Member Name</Label>
                <Input
                  id="memberName"
                  value={formData.memberName}
                  onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberNumber">Member Number</Label>
                <Input
                  id="memberNumber"
                  type="number"
                  value={formData.memberNumber}
                  onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guests">Guests</Label>
                <Input
                  id="guests"
                  type="number"
                  min="0"
                  value={formData.guests}
                  onChange={(e) =>
                    setFormData({ ...formData, guests: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Fee</Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={formData.fee}
                onChange={(e) =>
                  setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Create Reservation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

