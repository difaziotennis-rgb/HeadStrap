"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Search, Loader2 } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { format } from "date-fns"

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("courts")
  const today = new Date()

  // Fetch court reservations from API
  const { data: courtReservationsData, isLoading: isLoadingCourts } = useQuery({
    queryKey: ["reservations", "TENNIS_COURT"],
    queryFn: async () => {
      const response = await fetch(`/api/reservations?resourceType=TENNIS_COURT`)
      if (!response.ok) {
        console.error("Failed to fetch court reservations")
        return []
      }
      const data = await response.json()
      return data.reservations || []
    },
  })

  // Fetch tee time reservations from API
  const { data: teeTimeReservationsData, isLoading: isLoadingTeeTimes } = useQuery({
    queryKey: ["reservations", "TEE_TIME"],
    queryFn: async () => {
      const response = await fetch(`/api/reservations?resourceType=TEE_TIME`)
      if (!response.ok) {
        console.error("Failed to fetch tee time reservations")
        return []
      }
      const data = await response.json()
      return data.reservations || []
    },
  })

  // Transform court reservations to booking format
  const courtBookings = (courtReservationsData || []).map((res: any) => ({
    id: res.id,
    memberName: res.memberName || "Unknown Member",
    memberNumber: `M-${res.member?.memberNumber || "N/A"}`,
    courtName: res.resourceId,
    startTime: res.startTime,
    endTime: res.endTime,
    guests: res.guests || 0,
    status: "confirmed", // All reservations are confirmed
    reservationType: res.reservationType || "Singles",
    fee: res.fee || 0,
  }))

  // Transform tee time reservations to booking format
  const teeTimeBookings = (teeTimeReservationsData || []).map((res: any) => ({
    id: res.id,
    memberName: res.memberName || "Unknown Member",
    memberNumber: `M-${res.member?.memberNumber || "N/A"}`,
    teeNumber: parseInt(res.resourceId.replace(/\D/g, "")) || 1,
    time: res.startTime,
    guests: res.guests || 0,
    cartRental: false, // Would need to be added to schema
    status: "confirmed",
  }))

  const filteredCourtBookings = courtBookings.filter(
    (booking) =>
      booking.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.courtName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.memberNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTeeTimeBookings = teeTimeBookings.filter(
    (booking) =>
      booking.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.memberNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-primary mb-2">
            Bookings Management
          </h1>
          <p className="text-slate-600 font-sans">
            Manage court and tee time reservations
          </p>
        </div>
        <Button variant="luxury" className="gap-2 min-w-0">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">New Booking</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search bookings by member name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courts">Court Bookings</TabsTrigger>
          <TabsTrigger value="tee-times">Tee Times</TabsTrigger>
        </TabsList>

        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Court Reservations</CardTitle>
              <CardDescription className="font-sans">
                {filteredCourtBookings.length} booking{filteredCourtBookings.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCourts ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading court bookings...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCourtBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No court bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourtBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="max-w-[180px]">
                          <div className="min-w-0">
                            <div className="font-sans font-medium truncate">{booking.memberName}</div>
                            <div className="text-sm text-slate-500 font-sans truncate">{booking.memberNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gold flex-shrink-0" />
                            <span className="font-sans truncate">{booking.courtName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-sans max-w-[180px]">
                          <span className="truncate block">{formatDateTime(booking.startTime)}</span>
                        </TableCell>
                        <TableCell className="max-w-[100px]">
                          <div className="flex items-center gap-1 text-sm font-sans">
                            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">
                              {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10}h
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[100px]">
                          {booking.guests > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-sm font-sans truncate">{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 font-sans">No guests</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <Badge variant={booking.status === "confirmed" ? "success" : "warning"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <span className="truncate">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tee-times" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Tee Time Reservations</CardTitle>
              <CardDescription className="font-sans">
                {filteredTeeTimeBookings.length} booking{filteredTeeTimeBookings.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tee #</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Cart Rental</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTeeTimes ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading tee time bookings...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredTeeTimeBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No tee time bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTeeTimeBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="max-w-[180px]">
                          <div className="min-w-0">
                            <div className="font-sans font-medium truncate">{booking.memberName}</div>
                            <div className="text-sm text-slate-500 font-sans truncate">{booking.memberNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-sans font-medium max-w-[80px]">
                          <span className="truncate block">#{booking.teeNumber}</span>
                        </TableCell>
                        <TableCell className="font-sans max-w-[180px]">
                          <span className="truncate block">{formatDateTime(booking.time)}</span>
                        </TableCell>
                        <TableCell className="max-w-[100px]">
                          {booking.guests > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                              <span className="text-sm font-sans truncate">{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 font-sans">No guests</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[100px]">
                          {booking.cartRental ? (
                            <Badge variant="success">Yes</Badge>
                          ) : (
                            <span className="text-sm text-slate-400 font-sans">No</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <Badge variant={booking.status === "confirmed" ? "success" : "warning"}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <span className="truncate">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
