"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Calendar, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface Reservation {
  id: string
  startTime: Date
  endTime: Date
  resourceId: string
  memberId: string
  memberName: string
  reservationType: "Singles" | "Doubles" | "Clinic" | "Lesson"
  guests: number
  chargeToHouseAccount: boolean
  fee: number
}

interface EliteSchedulerProps {
  selectedDate: Date
  reservations: Reservation[]
  onCreateReservation: (reservation: Partial<Reservation>) => Promise<void>
}

// Generate 30-minute time slots from 6:00 AM to 10:00 PM
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
    if (hour < 22) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()
const COURTS = Array.from({ length: 10 }, (_, i) => `Court ${i + 1}`)

export function EliteScheduler({ selectedDate, reservations: initialReservations, onCreateReservation }: EliteSchedulerProps) {
  const queryClient = useQueryClient()
  
  // Fetch reservations from API
  const { data: reservationsData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ["reservations", format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(
        `/api/reservations?date=${format(selectedDate, "yyyy-MM-dd")}&resourceType=TENNIS_COURT`
      )
      if (!response.ok) throw new Error("Failed to fetch reservations")
      const data = await response.json()
      return data.reservations || []
    },
    initialData: initialReservations || [],
  })

  const reservations = reservationsData || initialReservations || []
  const [hoveredCell, setHoveredCell] = useState<{ court: string; time: string } | null>(null)
  const [selectedRange, setSelectedRange] = useState<{
    court: string
    startTime: string
    endTime: string
  } | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ court: string; time: string } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    memberSearch: "",
    memberName: "",
    memberId: "",
    reservationType: "Singles" as Reservation["reservationType"],
    guests: 0,
    chargeToHouseAccount: false,
    fee: 0,
  })

  const [showMemberDropdown, setShowMemberDropdown] = useState(false)

  // Mock members for fallback
  const mockMembers = [
    {
      id: "1",
      name: "John Smith",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@email.com",
      memberNumber: 2024001,
      tier: "FULL_GOLF",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@email.com",
      memberNumber: 2024002,
      tier: "TENNIS_SOCIAL",
    },
    {
      id: "3",
      name: "Michael Chen",
      firstName: "Michael",
      lastName: "Chen",
      email: "m.chen@email.com",
      memberNumber: 2024003,
      tier: "JUNIOR",
    },
    {
      id: "4",
      name: "Emily Williams",
      firstName: "Emily",
      lastName: "Williams",
      email: "emily.w@email.com",
      memberNumber: 2024004,
      tier: "FULL_GOLF",
    },
    {
      id: "5",
      name: "David Brown",
      firstName: "David",
      lastName: "Brown",
      email: "david.b@email.com",
      memberNumber: 2024005,
      tier: "TENNIS_SOCIAL",
    },
    {
      id: "6",
      name: "Lisa Anderson",
      firstName: "Lisa",
      lastName: "Anderson",
      email: "lisa.a@email.com",
      memberNumber: 2024006,
      tier: "FULL_GOLF",
    },
  ]

  // Search members via API - show all members when focused, or search when typing
  const { data: memberSearchResults = [], isLoading: isSearchingMembers } = useQuery({
    queryKey: ["members", "search", formData.memberSearch || "all"],
    queryFn: async () => {
      try {
        // If search is empty or less than 2 chars, get all members
        const searchQuery = formData.memberSearch && formData.memberSearch.length >= 2
          ? formData.memberSearch
          : ""
        
        const response = await fetch(
          `/api/members/search?q=${encodeURIComponent(searchQuery || "")}`
        )
        
        if (!response.ok) {
          console.error("Failed to fetch members:", response.statusText)
          // Return mock members as fallback
          return filterMockMembers(mockMembers, searchQuery)
        }
        
        const data = await response.json()
        const apiMembers = data.members || []
        
        // If API returns no members, use mock members as fallback
        if (apiMembers.length === 0 && !searchQuery) {
          return mockMembers
        }
        
        // If API returns members, use them (and filter if search query exists)
        if (apiMembers.length > 0) {
          return searchQuery ? filterMockMembers(apiMembers, searchQuery) : apiMembers
        }
        
        // Final fallback to mock members
        return filterMockMembers(mockMembers, searchQuery)
      } catch (error) {
        console.error("Error fetching members:", error)
        // Return filtered mock members as fallback
        return filterMockMembers(mockMembers, formData.memberSearch)
      }
    },
    enabled: showMemberDropdown, // Only fetch when dropdown should be shown
  })

  // Helper function to filter members
  const filterMockMembers = (members: any[], searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      return members
    }
    
    const searchLower = searchTerm.toLowerCase()
    return members.filter((m) =>
      m.name.toLowerCase().includes(searchLower) ||
      m.firstName.toLowerCase().includes(searchLower) ||
      m.lastName.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower) ||
      m.memberNumber.toString().includes(searchTerm)
    )
  }

  const getReservationAtSlot = (court: string, time: string): Reservation | null => {
    const [hour, minute] = time.split(":").map(Number)
    const slotTime = new Date(selectedDate)
    slotTime.setHours(hour, minute, 0, 0)

    return (
      reservations.find((res) => {
        if (res.resourceId !== court) return false
        const resStart = new Date(res.startTime)
        const resEnd = new Date(res.endTime)
        return slotTime >= resStart && slotTime < resEnd
      }) || null
    )
  }

  const isSlotBooked = (court: string, time: string) => {
    return getReservationAtSlot(court, time) !== null
  }

  const isInSelectedRange = (court: string, time: string) => {
    if (!selectedRange || selectedRange.court !== court) return false
    const slotIndex = TIME_SLOTS.indexOf(time)
    const startIndex = TIME_SLOTS.indexOf(selectedRange.startTime)
    const endIndex = TIME_SLOTS.indexOf(selectedRange.endTime)
    return slotIndex >= startIndex && slotIndex <= endIndex
  }

  const isInDragRange = (court: string, time: string) => {
    if (!isDragging || !dragStart || dragStart.court !== court) return false
    const hoveredIndex = hoveredCell ? TIME_SLOTS.indexOf(hoveredCell.time) : -1
    const startIndex = TIME_SLOTS.indexOf(dragStart.time)
    if (hoveredIndex === -1) return false
    const slotIndex = TIME_SLOTS.indexOf(time)
    const minIndex = Math.min(startIndex, hoveredIndex)
    const maxIndex = Math.max(startIndex, hoveredIndex)
    return slotIndex >= minIndex && slotIndex <= maxIndex
  }

  const handleCellMouseEnter = (court: string, time: string) => {
    if (!isSlotBooked(court, time)) {
      setHoveredCell({ court, time })
    }
    if (isDragging && dragStart) {
      if (court === dragStart.court && !isSlotBooked(court, time)) {
        const startIndex = TIME_SLOTS.indexOf(dragStart.time)
        const endIndex = TIME_SLOTS.indexOf(time)
        if (startIndex !== -1 && endIndex !== -1) {
          setSelectedRange({
            court: dragStart.court,
            startTime: dragStart.time,
            endTime: time,
          })
        }
      }
    }
  }

  const handleCellMouseLeave = () => {
    if (!isDragging) {
      setHoveredCell(null)
    }
  }

  const handleCellMouseDown = (court: string, time: string) => {
    if (isSlotBooked(court, time)) return
    setIsDragging(true)
    setDragStart({ court, time })
    setSelectedRange({
      court,
      startTime: time,
      endTime: time,
    })
  }

  const handleCellMouseUp = () => {
    if (isDragging && selectedRange) {
      setEditingReservationId(null)
      setShowMemberDropdown(false)
      setFormData({
        memberSearch: "",
        memberName: "",
        memberId: "",
        reservationType: "Singles",
        guests: 0,
        chargeToHouseAccount: false,
        fee: 0,
      })
      setIsBookingDialogOpen(true)
    }
    setIsDragging(false)
    setDragStart(null)
  }

  const handleCellClick = (court: string, time: string) => {
    if (isDragging) return
    if (isSlotBooked(court, time)) {
      // Clicking on booked slot will be handled by the onClick in the reservation div
      return
    }
    setEditingReservationId(null)
    setShowMemberDropdown(false)
    setSelectedRange({
      court,
      startTime: time,
      endTime: time,
    })
    setFormData({
      memberSearch: "",
      memberName: "",
      memberId: "",
      reservationType: "Singles",
      guests: 0,
      chargeToHouseAccount: false,
      fee: 0,
    })
    setIsBookingDialogOpen(true)
  }

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async (reservationData: any) => {
      const url = editingReservationId
        ? `/api/reservations/${editingReservationId}`
        : "/api/reservations"
      const method = editingReservationId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${editingReservationId ? "update" : "create"} reservation`)
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch reservations for all dates and resource types
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      // Also invalidate bookings queries
      queryClient.invalidateQueries({ queryKey: ["courtBookings"] })
      queryClient.invalidateQueries({ queryKey: ["teeTimeBookings"] })
      setIsBookingDialogOpen(false)
      setEditingReservationId(null)
      setSelectedRange(null)
      setShowMemberDropdown(false)
      setFormData({
        memberSearch: "",
        memberName: "",
        memberId: "",
        reservationType: "Singles",
        guests: 0,
        chargeToHouseAccount: false,
        fee: 0,
      })
      // Also call the callback if provided
      if (onCreateReservation) {
        onCreateReservation({} as any)
      }
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to save reservation")
    },
  })

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete reservation")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch reservations for all dates and resource types
      queryClient.invalidateQueries({ queryKey: ["reservations"] })
      // Also invalidate bookings queries
      queryClient.invalidateQueries({ queryKey: ["courtBookings"] })
      queryClient.invalidateQueries({ queryKey: ["teeTimeBookings"] })
      setIsBookingDialogOpen(false)
      setEditingReservationId(null)
      setSelectedRange(null)
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to delete reservation")
    },
  })

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRange) {
      alert("Please select a time slot")
      return
    }
    if (!formData.memberId || !formData.memberName) {
      alert("Please search and select a member from the results")
      return
    }

    const [startHour, startMinute] = selectedRange.startTime.split(":").map(Number)
    const [endHour, endMinute] = selectedRange.endTime.split(":").map(Number)

    const startTime = new Date(selectedDate)
    startTime.setHours(startHour, startMinute, 0, 0)

    // If end time is before start time or same, add 30 minutes
    let endTime = new Date(selectedDate)
    if (
      endHour < startHour ||
      (endHour === startHour && endMinute <= startMinute)
    ) {
      endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30)
    } else {
      endTime.setHours(endHour, endMinute, 0, 0)
    }

    createReservationMutation.mutate({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      resourceType: "TENNIS_COURT",
      resourceId: selectedRange.court,
      memberId: formData.memberId,
      memberName: formData.memberName,
      reservationType: formData.reservationType,
      guests: formData.guests,
      chargeToHouseAccount: formData.chargeToHouseAccount,
      fee: formData.fee,
    })
  }

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        handleCellMouseUp()
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [isDragging, selectedRange])

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-200 bg-white">
          <CardTitle className="text-3xl font-display font-medium text-primary tracking-tight">
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-slate-50">
          <div
            ref={gridRef}
            className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]"
            onMouseLeave={() => {
              if (!isDragging) {
                setHoveredCell(null)
              }
            }}
          >
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse bg-white">
                <thead className="bg-white sticky top-0 z-20">
                  <tr>
                    <th className="sticky left-0 z-30 bg-white border-r-2 border-b-2 border-slate-300 p-3 text-left min-w-[100px]">
                      <span className="font-sans text-sm font-medium text-slate-700">Time</span>
                    </th>
                    {COURTS.map((court) => (
                      <th
                        key={court}
                        className="border-r border-b-2 border-slate-300 p-3 text-center min-w-[140px] bg-white"
                      >
                        <span className="font-sans text-sm font-medium text-slate-700">
                          {court}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time) => (
                    <tr key={time}>
                      <td className="sticky left-0 z-10 bg-white border-r-2 border-b border-slate-200 p-2 text-sm font-sans font-medium text-slate-700 whitespace-nowrap">
                        {time}
                      </td>
                      {COURTS.map((court) => {
                        const reservation = getReservationAtSlot(court, time)
                        const isBooked = reservation !== null
                        const isHovered =
                          hoveredCell?.court === court && hoveredCell?.time === time
                        const inSelectedRange = isInSelectedRange(court, time)
                        const inDragRange = isInDragRange(court, time)

                        return (
                          <td
                            key={`${court}-${time}`}
                            className={`
                              border-r border-b border-slate-200 p-2 h-12 cursor-pointer transition-all relative
                              ${isBooked ? "bg-[#1B4332] text-white" : "bg-white hover:bg-slate-100"}
                              ${inSelectedRange || inDragRange ? "bg-[#1B4332]/20" : ""}
                            `}
                            onMouseEnter={() => handleCellMouseEnter(court, time)}
                            onMouseLeave={handleCellMouseLeave}
                            onMouseDown={() => handleCellMouseDown(court, time)}
                            onMouseUp={handleCellMouseUp}
                            onClick={() => handleCellClick(court, time)}
                          >
                            {isBooked ? (
                              <div
                                className="text-xs font-sans font-medium cursor-pointer hover:opacity-80"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingReservationId(reservation.id)
                                  setSelectedRange({
                                    court,
                                    startTime: format(new Date(reservation.startTime), "HH:mm"),
                                    endTime: format(new Date(reservation.endTime), "HH:mm"),
                                  })
                                  setFormData({
                                    memberSearch: reservation.memberName,
                                    memberName: reservation.memberName,
                                    memberId: reservation.memberId,
                                    reservationType: reservation.reservationType,
                                    guests: reservation.guests,
                                    chargeToHouseAccount: reservation.chargeToHouseAccount || false,
                                    fee: parseFloat(reservation.fee.toString()),
                                  })
                                  setIsBookingDialogOpen(true)
                                }}
                              >
                                <div className="truncate">{reservation.memberName}</div>
                                <div className="text-[#1B4332]/80 text-[10px] mt-0.5">
                                  {reservation.reservationType}
                                </div>
                              </div>
                            ) : (
                              <>
                                {(isHovered || inSelectedRange || inDragRange) && (
                                  <div className="flex items-center justify-center h-full">
                                    <Plus className="h-4 w-4 text-slate-600" />
                                  </div>
                                )}
                              </>
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

      {/* Booking Dialog */}
      <Dialog 
        open={isBookingDialogOpen} 
        onOpenChange={(open) => {
          setIsBookingDialogOpen(open)
          if (!open) {
            setShowMemberDropdown(false)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingReservationId ? "Edit Reservation" : "Book Now"}
            </DialogTitle>
            <DialogDescription className="font-sans">
              {selectedRange && (
                <>
                  {selectedRange.court} • {selectedRange.startTime}
                  {selectedRange.endTime !== selectedRange.startTime
                    ? ` - ${selectedRange.endTime}`
                    : ""}{" "}
                  • {format(selectedDate, "MMM d, yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            {/* Member Search */}
            <div className="space-y-2 relative">
              <Label htmlFor="memberSearch" className="font-sans font-medium">
                Search Member *
              </Label>
              <Input
                id="memberSearch"
                placeholder="Type name or member number to search..."
                value={formData.memberSearch}
                onChange={(e) => {
                  const searchValue = e.target.value
                  // If the search value doesn't match the selected member, clear selection
                  const isSelectedMemberValue = formData.memberId && 
                    formData.memberSearch && 
                    (formData.memberSearch.includes(searchValue) || searchValue.includes(formData.memberSearch))
                  
                  if (!isSelectedMemberValue) {
                    setFormData({
                      ...formData,
                      memberSearch: searchValue,
                      memberName: "",
                      memberId: "",
                    })
                  } else {
                    setFormData({ ...formData, memberSearch: searchValue })
                  }
                  // Show dropdown when typing
                  setShowMemberDropdown(true)
                }}
                onFocus={(e) => {
                  // Show all members when focused
                  setShowMemberDropdown(true)
                  e.target.select()
                }}
                onClick={() => {
                  // Show dropdown when clicked
                  setShowMemberDropdown(true)
                }}
                className="font-sans"
                autoComplete="off"
              />
              
              {/* Search Results Dropdown */}
              {showMemberDropdown && !formData.memberId && (
                <div className="absolute z-50 w-full mt-1 border border-slate-200 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
                  {isSearchingMembers ? (
                    <div className="p-3 text-center text-slate-500 font-sans text-sm">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      {formData.memberSearch ? "Searching..." : "Loading members..."}
                    </div>
                  ) : memberSearchResults.length > 0 ? (
                    <>
                      {formData.memberSearch && formData.memberSearch.length >= 2 && (
                        <div className="p-2 text-xs font-sans text-slate-500 border-b border-slate-200 bg-slate-50">
                          {memberSearchResults.length} member{memberSearchResults.length !== 1 ? "s" : ""} found
                        </div>
                      )}
                      {memberSearchResults.map((member: any) => (
                        <div
                          key={member.id}
                          className="p-3 hover:bg-primary/5 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFormData({
                              ...formData,
                              memberName: member.name,
                              memberId: member.id,
                              memberSearch: `${member.name} (M-${member.memberNumber})`,
                            })
                            setShowMemberDropdown(false)
                          }}
                        >
                          <p className="font-sans font-medium text-sm text-primary">
                            {member.name}
                          </p>
                          <p className="font-sans text-xs text-slate-500">
                            M-{member.memberNumber} {member.tier && `• ${member.tier}`}
                          </p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="p-3 text-center text-slate-500 font-sans text-sm">
                      {formData.memberSearch && formData.memberSearch.length >= 2
                        ? "No members found. Try a different search term."
                        : "No members available."}
                    </div>
                  )}
                </div>
              )}
              
              {/* Selected Member Display */}
              {formData.memberId && formData.memberName && (
                <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-sans font-medium text-primary">
                        Selected: {formData.memberName}
                      </p>
                      {formData.memberSearch && formData.memberSearch.includes("M-") && (
                        <p className="text-xs font-sans text-slate-600 mt-1">
                          {formData.memberSearch}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          memberSearch: "",
                          memberName: "",
                          memberId: "",
                        })
                        setShowMemberDropdown(false)
                      }}
                      className="text-xs h-7"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
              
              {!formData.memberId && formData.memberSearch.length > 0 && formData.memberSearch.length < 2 && (
                <p className="text-xs font-sans text-slate-500 mt-1">
                  Type at least 2 characters to search
                </p>
              )}
            </div>

            {/* Reservation Type */}
            <div className="space-y-2">
              <Label htmlFor="reservationType" className="font-sans font-medium">
                Type
              </Label>
              <Select
                value={formData.reservationType}
                onValueChange={(value: Reservation["reservationType"]) =>
                  setFormData({ ...formData, reservationType: value })
                }
              >
                <SelectTrigger className="font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Singles">Singles</SelectItem>
                  <SelectItem value="Doubles">Doubles</SelectItem>
                  <SelectItem value="Clinic">Clinic</SelectItem>
                  <SelectItem value="Lesson">Lesson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Guest Count */}
            <div className="space-y-2">
              <Label htmlFor="guests" className="font-sans font-medium">
                Guest Count
              </Label>
              <Input
                id="guests"
                type="number"
                min="0"
                value={formData.guests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guests: parseInt(e.target.value) || 0,
                  })
                }
                className="font-sans"
              />
            </div>

            {/* Fee */}
            <div className="space-y-2">
              <Label htmlFor="fee" className="font-sans font-medium">
                Fee ($)
              </Label>
              <Input
                id="fee"
                type="number"
                step="0.01"
                value={formData.fee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fee: parseFloat(e.target.value) || 0,
                  })
                }
                className="font-sans"
              />
            </div>

            {/* Charge to House Account */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <Label htmlFor="chargeToHouseAccount" className="font-sans font-medium cursor-pointer">
                Charge to House Account
              </Label>
              <Switch
                id="chargeToHouseAccount"
                checked={formData.chargeToHouseAccount}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, chargeToHouseAccount: checked })
                }
              />
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              {editingReservationId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this reservation?")) {
                      deleteReservationMutation.mutate(editingReservationId)
                    }
                  }}
                  className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50 min-w-0 flex-shrink-0"
                  disabled={createReservationMutation.isPending || deleteReservationMutation.isPending}
                >
                  {deleteReservationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                      <span className="truncate">Deleting...</span>
                    </>
                  ) : (
                    <span className="truncate">Delete</span>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsBookingDialogOpen(false)
                  setEditingReservationId(null)
                  setSelectedRange(null)
                }}
                className="font-sans min-w-0"
                disabled={createReservationMutation.isPending || deleteReservationMutation.isPending}
              >
                <span className="truncate">Cancel</span>
              </Button>
              <Button
                type="submit"
                variant="default"
                className="font-sans bg-[#1B4332] hover:bg-[#1B4332]/90 min-w-0"
                disabled={createReservationMutation.isPending || deleteReservationMutation.isPending}
              >
                {createReservationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2 flex-shrink-0" />
                    <span className="truncate">{editingReservationId ? "Updating..." : "Booking..."}</span>
                  </>
                ) : (
                  <span className="truncate">{editingReservationId ? "Update Reservation" : "Confirm Booking"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

