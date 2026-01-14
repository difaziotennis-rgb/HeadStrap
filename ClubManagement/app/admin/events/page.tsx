"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, DollarSign, Search, Edit } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

const mockEvents = [
  {
    id: "1",
    title: "Winter Tennis Tournament",
    eventType: "Tournament",
    startDate: "2024-02-15",
    endDate: "2024-02-17",
    maxParticipants: 64,
    currentParticipants: 42,
    registrationFee: 150.00,
    status: "open",
  },
  {
    id: "2",
    title: "Member Social Mixer",
    eventType: "Social",
    startDate: "2024-02-01",
    endDate: "2024-02-01",
    maxParticipants: 100,
    currentParticipants: 78,
    registrationFee: 25.00,
    status: "open",
  },
  {
    id: "3",
    title: "Junior Tennis Clinic",
    eventType: "Clinic",
    startDate: "2024-01-25",
    endDate: "2024-01-25",
    maxParticipants: 20,
    currentParticipants: 20,
    registrationFee: 50.00,
    status: "full",
  },
]

const mockRegistrations = [
  {
    id: "1",
    eventTitle: "Winter Tennis Tournament",
    memberName: "John Smith",
    memberNumber: "M-2024-0001",
    registeredAt: "2024-01-10",
    status: "confirmed",
  },
  {
    id: "2",
    eventTitle: "Member Social Mixer",
    memberName: "Sarah Johnson",
    memberNumber: "M-2024-0002",
    registeredAt: "2024-01-12",
    status: "confirmed",
  },
]

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  const { data: events = mockEvents } = useQuery({
    queryKey: ["events"],
    queryFn: async () => mockEvents,
  })

  const { data: registrations = mockRegistrations } = useQuery({
    queryKey: ["eventRegistrations"],
    queryFn: async () => mockRegistrations,
  })

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEvent = () => {
    setEditingEvent(null)
    setIsEventDialogOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setIsEventDialogOpen(true)
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Event Management
          </h1>
          <p className="text-slate-600 font-sans">
            Manage tournaments, social events, and activities
          </p>
        </div>
        <Button onClick={handleAddEvent} variant="luxury" className="gap-2 min-w-0">
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">New Event</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {events.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Open Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-slate-700">
              {events.filter((e) => e.status === "open").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-gold">
              {events.reduce((sum, e) => sum + e.currentParticipants, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-medium tracking-tight text-primary">
              {formatCurrency(
                events.reduce(
                  (sum, e) => sum + e.currentParticipants * e.registrationFee,
                  0
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">All Events</CardTitle>
          <CardDescription className="font-sans">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-sans font-medium">{event.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.eventType}</Badge>
                  </TableCell>
                  <TableCell className="font-sans">
                    {formatDate(event.startDate)}
                    {event.endDate !== event.startDate && ` - ${formatDate(event.endDate)}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-sans">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>
                        {event.currentParticipants} / {event.maxParticipants}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-sans">
                    {formatCurrency(event.registrationFee)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.status === "open"
                          ? "success"
                          : event.status === "full"
                          ? "warning"
                          : "default"
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          alert(`Event: ${event.title}\nType: ${event.eventType}\nDate: ${formatDate(event.startDate)}${event.endDate !== event.startDate ? ` - ${formatDate(event.endDate)}` : ""}\nParticipants: ${event.currentParticipants}/${event.maxParticipants}\nFee: ${formatCurrency(event.registrationFee)}`)
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-sans">{registration.eventTitle}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-sans font-medium">{registration.memberName}</div>
                      <div className="text-sm text-slate-500 font-sans">
                        {registration.memberNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-sans">
                    {formatDate(registration.registeredAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{registration.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
            event={editingEvent}
            onClose={() => {
              setIsEventDialogOpen(false)
              setEditingEvent(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EventForm({ event, onClose }: { event: any; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    eventType: event?.eventType || "Tournament",
    startDate: event?.startDate || "",
    endDate: event?.endDate || "",
    maxParticipants: event?.maxParticipants || 50,
    registrationFee: event?.registrationFee || 0,
    description: "",
  })

  const queryClient = useQueryClient()

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create event")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      onClose()
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update event")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      title: formData.title,
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      maxParticipants: formData.maxParticipants,
      registrationFee: formData.registrationFee,
      description: formData.description,
    }

    if (event) {
      updateEventMutation.mutate(submitData)
    } else {
      createEventMutation.mutate(submitData)
    }
  }

  const isSubmitting = createEventMutation.isPending || updateEventMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="eventType">Event Type</Label>
          <Select
            value={formData.eventType}
            onValueChange={(value) => setFormData({ ...formData, eventType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tournament">Tournament</SelectItem>
              <SelectItem value="Social">Social Event</SelectItem>
              <SelectItem value="Clinic">Clinic</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max Participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) =>
              setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registrationFee">Registration Fee</Label>
        <Input
          id="registrationFee"
          type="number"
          step="0.01"
          value={formData.registrationFee}
          onChange={(e) =>
            setFormData({ ...formData, registrationFee: parseFloat(e.target.value) })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">Cancel</span>
        </Button>
        <Button type="submit" variant="luxury" className="min-w-0" disabled={isSubmitting}>
          <span className="truncate">{isSubmitting ? "Saving..." : event ? "Update Event" : "Create Event"}</span>
        </Button>
      </DialogFooter>
    </form>
  )
}

