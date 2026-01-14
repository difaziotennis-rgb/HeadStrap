"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, MapPin, Clock, Users, X } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

const mockMyBookings = [
  {
    id: "1",
    type: "court",
    courtName: "Court 1",
    startTime: "2024-01-20T10:00:00",
    endTime: "2024-01-20T11:00:00",
    guests: ["Jane Doe"],
    status: "confirmed",
  },
  {
    id: "2",
    type: "court",
    courtName: "Court 3",
    startTime: "2024-01-22T14:00:00",
    endTime: "2024-01-22T15:30:00",
    guests: [],
    status: "confirmed",
  },
  {
    id: "3",
    type: "lesson",
    instructor: "Pro John",
    startTime: "2024-01-25T09:00:00",
    endTime: "2024-01-25T10:00:00",
    status: "confirmed",
  },
]

const mockAvailableCourts = [
  { id: "1", name: "Court 1", type: "TENNIS", surface: "Hard Court" },
  { id: "2", name: "Court 2", type: "TENNIS", surface: "Clay" },
  { id: "3", name: "Court 3", type: "TENNIS", surface: "Hard Court" },
  { id: "4", name: "Court 4", type: "PICKLEBALL", surface: "Hard Court" },
]

export default function MemberBookingsPage() {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)

  const { data: myBookings = mockMyBookings } = useQuery({
    queryKey: ["myBookings"],
    queryFn: async () => mockMyBookings,
  })

  const upcomingBookings = myBookings.filter(
    (booking) => new Date(booking.startTime) > new Date()
  )

  const pastBookings = myBookings.filter(
    (booking) => new Date(booking.startTime) <= new Date()
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            My Bookings
          </h1>
          <p className="text-slate-600 font-sans">
            View and manage your court and lesson bookings
          </p>
        </div>
        <Button onClick={() => setIsBookingDialogOpen(true)} variant="luxury" className="gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Upcoming Bookings</CardTitle>
          <CardDescription className="font-sans">
            {upcomingBookings.length} upcoming booking{upcomingBookings.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-center text-slate-500 py-8 font-sans">
              No upcoming bookings
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {booking.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.type === "court" ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gold" />
                          <span className="font-sans">{booking.courtName}</span>
                        </div>
                      ) : (
                        <span className="font-sans">Lesson with {booking.instructor}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">
                      {formatDateTime(booking.startTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-sans">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {new Date(booking.endTime).getHours() - new Date(booking.startTime).getHours()}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancelBookingMutation.isPending}
                      >
                        {cancelBookingMutation.isPending ? "Cancelling..." : "Cancel"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Past Bookings</CardTitle>
          <CardDescription className="font-sans">
            {pastBookings.length} past booking{pastBookings.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastBookings.length === 0 ? (
            <p className="text-center text-slate-500 py-8 font-sans">
              No past bookings
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {booking.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.type === "court" ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="font-sans">{booking.courtName}</span>
                        </div>
                      ) : (
                        <span className="font-sans">Lesson with {booking.instructor}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">
                      {formatDateTime(booking.startTime)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book a Court</DialogTitle>
            <DialogDescription>
              Select a court and time for your reservation
            </DialogDescription>
          </DialogHeader>
          <BookingForm
            courts={mockAvailableCourts}
            onClose={() => setIsBookingDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BookingForm({ courts, onClose }: { courts: typeof mockAvailableCourts; onClose: () => void }) {
  const [formData, setFormData] = useState({
    courtId: "",
    date: "",
    startTime: "",
    endTime: "",
    guests: "",
  })

  const queryClient = useQueryClient()

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create booking")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] })
      alert("Court booked successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to book court")
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel booking")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookings"] })
      alert("Booking cancelled successfully!")
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to cancel booking")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

    createBookingMutation.mutate({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      resourceType: "TENNIS_COURT",
      resourceId: formData.courtId,
      memberId: "current-member-id", // This should come from auth context
      guests: formData.guests ? formData.guests.split(",").length : 0,
      fee: 0,
      chargeToHouseAccount: false,
    })
  }

  const handleCancelBooking = (bookingId: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      cancelBookingMutation.mutate(bookingId)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="courtId">Court</Label>
        <Select
          value={formData.courtId}
          onValueChange={(value) => setFormData({ ...formData, courtId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a court" />
          </SelectTrigger>
          <SelectContent>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name} - {court.surface}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">End Time</Label>
        <Input
          id="endTime"
          type="time"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guests">Guest Names (comma-separated)</Label>
        <Input
          id="guests"
          value={formData.guests}
          onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
          placeholder="Jane Doe, John Smith"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="luxury">
          Book Court
        </Button>
      </DialogFooter>
    </form>
  )
}

