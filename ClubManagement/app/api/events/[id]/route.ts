import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

/**
 * PUT /api/events/[id]
 * Update an event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, eventType, startDate, endDate, maxParticipants, registrationFee, description } = body

    // For now, return success with updated mock data
    // This should be implemented when events table is added to schema
    const event = {
      id: params.id,
      title: title || "Event",
      eventType: eventType || "Tournament",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || startDate || new Date().toISOString().split("T")[0],
      maxParticipants: parseInt(maxParticipants) || 50,
      currentParticipants: 0,
      registrationFee: parseFloat(registrationFee) || 0,
      description: description || "",
      status: "open",
    }

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: error.message || "Failed to update event" }, { status: 500 })
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return success
    // This should be implemented when events table is added to schema
    return NextResponse.json({ success: true, message: "Event deleted" })
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 500 })
  }
}


