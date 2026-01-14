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
import { Calendar, Clock, Users, Plus, Search, MapPin } from "lucide-react"
import { formatDateTime } from "@/lib/utils"

const mockTeeTimes = [
  {
    id: "1",
    teeNumber: 1,
    time: "2024-01-20T08:00:00",
    memberName: "John Smith",
    memberNumber: "M-2024-0001",
    players: 4,
    cartRental: true,
    status: "confirmed",
  },
  {
    id: "2",
    teeNumber: 2,
    time: "2024-01-20T08:15:00",
    memberName: "Sarah Johnson",
    memberNumber: "M-2024-0002",
    players: 2,
    cartRental: false,
    status: "confirmed",
  },
  {
    id: "3",
    teeNumber: 3,
    time: "2024-01-20T08:30:00",
    memberName: "",
    memberNumber: "",
    players: 0,
    cartRental: false,
    status: "available",
  },
]

const mockWaitlist = [
  {
    id: "1",
    memberName: "Michael Chen",
    memberNumber: "M-2024-0003",
    requestedTime: "2024-01-20T10:00:00",
    players: 4,
    addedAt: "2024-01-19T14:30:00",
  },
]

export default function TeeSheetPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [selectedTeeTime, setSelectedTeeTime] = useState<any>(null)

  const { data: teeTimes = mockTeeTimes } = useQuery({
    queryKey: ["teeTimes", selectedDate],
    queryFn: async () => mockTeeTimes,
  })

  const { data: waitlist = mockWaitlist } = useQuery({
    queryKey: ["waitlist"],
    queryFn: async () => mockWaitlist,
  })

  const handleBookTeeTime = (teeTime: any) => {
    setSelectedTeeTime(teeTime)
    setIsBookingDialogOpen(true)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Tee Sheet Management
          </h1>
          <p className="text-slate-600 font-sans">
            Manage golf tee times, bookings, and waitlists
          </p>
        </div>
        <Button onClick={() => setIsBookingDialogOpen(true)} variant="luxury" className="gap-2 min-w-0">
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">New Booking</span>
        </Button>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              <Label htmlFor="date" className="font-sans font-medium">Select Date</Label>
            </div>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            >
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tee Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Morning Tee Times */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Morning (6 AM - 12 PM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teeTimes
              .filter((tt) => new Date(tt.time).getHours() < 12)
              .map((teeTime) => (
                <div
                  key={teeTime.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    teeTime.status === "available"
                      ? "border-slate-200 hover:border-gold hover:bg-gold/5"
                      : "border-forest bg-forest/5"
                  }`}
                  onClick={() => handleBookTeeTime(teeTime)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold" />
                      <span className="font-sans font-semibold">Tee #{teeTime.teeNumber}</span>
                    </div>
                    <Badge variant={teeTime.status === "available" ? "outline" : "success"}>
                      {teeTime.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-sans">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {new Date(teeTime.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {teeTime.status !== "available" && (
                    <div className="mt-2 text-sm font-sans">
                      <p className="font-medium">{teeTime.memberName}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {teeTime.players}
                        </span>
                        {teeTime.cartRental && (
                          <span className="text-gold">Cart</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Afternoon Tee Times */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Afternoon (12 PM - 6 PM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teeTimes
              .filter(
                (tt) =>
                  new Date(tt.time).getHours() >= 12 &&
                  new Date(tt.time).getHours() < 18
              )
              .map((teeTime) => (
                <div
                  key={teeTime.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    teeTime.status === "available"
                      ? "border-slate-200 hover:border-gold hover:bg-gold/5"
                      : "border-forest bg-forest/5"
                  }`}
                  onClick={() => handleBookTeeTime(teeTime)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold" />
                      <span className="font-sans font-semibold">Tee #{teeTime.teeNumber}</span>
                    </div>
                    <Badge variant={teeTime.status === "available" ? "outline" : "success"}>
                      {teeTime.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-sans">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {new Date(teeTime.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {teeTime.status !== "available" && (
                    <div className="mt-2 text-sm font-sans">
                      <p className="font-medium">{teeTime.memberName}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {teeTime.players}
                        </span>
                        {teeTime.cartRental && (
                          <span className="text-gold">Cart</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Waitlist */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Waitlist</CardTitle>
            <CardDescription className="font-sans">
              {waitlist.length} request{waitlist.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {waitlist.length === 0 ? (
              <p className="text-center text-slate-500 py-8 font-sans text-sm">
                No waitlist requests
              </p>
            ) : (
              <div className="space-y-3">
                {waitlist.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-slate-200 rounded-lg"
                  >
                    <p className="font-sans font-medium">{item.memberName}</p>
                    <p className="text-sm text-slate-600 font-sans">
                      {item.memberNumber}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-sans">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(item.requestedTime)}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2"
                        onClick={() => {
                          // Fill slot from waitlist
                          alert(`Filling slot for ${item.memberName} at ${formatDateTime(item.requestedTime)}`)
                        }}
                      >
                        <span>Fill Slot</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs px-2"
                        onClick={() => {
                          if (confirm(`Remove ${item.memberName} from waitlist?`)) {
                            alert("Removed from waitlist")
                          }
                        }}
                      >
                        <span>Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Tee Time</DialogTitle>
            <DialogDescription>
              {selectedTeeTime
                ? `Tee #${selectedTeeTime.teeNumber} at ${new Date(selectedTeeTime.time).toLocaleTimeString()}`
                : "Create a new tee time booking"}
            </DialogDescription>
          </DialogHeader>
          <TeeTimeBookingForm
            teeTime={selectedTeeTime}
            onClose={() => {
              setIsBookingDialogOpen(false)
              setSelectedTeeTime(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TeeTimeBookingForm({ teeTime, onClose }: { teeTime: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    memberNumber: teeTime?.memberNumber || "",
    teeNumber: teeTime?.teeNumber || "",
    time: teeTime?.time ? new Date(teeTime.time).toISOString().slice(0, 16) : "",
    players: teeTime?.players || 1,
    cartRental: teeTime?.cartRental || false,
    guestNames: "",
  })

  const queryClient = useQueryClient()

  const bookTeeTimeMutation = useMutation({
    mutationFn: async (teeTimeData: any) => {
      const response = await fetch("/api/tee-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teeTimeData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to book tee time")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teeTimes"] })
      alert("Tee time booked successfully!")
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to book tee time")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    bookTeeTimeMutation.mutate({
      memberNumber: formData.memberNumber,
      teeNumber: formData.teeNumber,
      time: formData.time,
      players: formData.players,
      guestNames: formData.guestNames,
      cartRental: formData.cartRental,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Member Number</Label>
        <Input
          id="memberNumber"
          value={formData.memberNumber}
          onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
          placeholder="M-2024-0001"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="teeNumber">Tee Number</Label>
          <Input
            id="teeNumber"
            type="number"
            value={formData.teeNumber}
            onChange={(e) => setFormData({ ...formData, teeNumber: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="datetime-local"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="players">Number of Players</Label>
        <Input
          id="players"
          type="number"
          min="1"
          max="4"
          value={formData.players}
          onChange={(e) => setFormData({ ...formData, players: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guestNames">Guest Names (comma-separated)</Label>
        <Input
          id="guestNames"
          value={formData.guestNames}
          onChange={(e) => setFormData({ ...formData, guestNames: e.target.value })}
          placeholder="John Doe, Jane Smith"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="cartRental"
          checked={formData.cartRental}
          onChange={(e) => setFormData({ ...formData, cartRental: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-navy"
        />
        <Label htmlFor="cartRental" className="font-sans cursor-pointer">
          Golf Cart Rental
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={bookTeeTimeMutation.isPending}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={bookTeeTimeMutation.isPending}>
          <span className="truncate">{bookTeeTimeMutation.isPending ? "Booking..." : "Book Tee Time"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

