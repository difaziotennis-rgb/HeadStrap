import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

/**
 * GET /api/events
 * Get all events
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return mock data since events aren't in the schema yet
    // This can be extended when events table is added
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
    ]

    return NextResponse.json({ success: true, events: mockEvents })
  } catch (error: any) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch events" }, { status: 500 })
  }
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, eventType, startDate, endDate, maxParticipants, registrationFee, description } = body

    if (!title || !eventType || !startDate || !maxParticipants) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For now, return success with mock data
    // This should be implemented when events table is added to schema
    const event = {
      id: Date.now().toString(),
      title,
      eventType,
      startDate,
      endDate: endDate || startDate,
      maxParticipants: parseInt(maxParticipants),
      currentParticipants: 0,
      registrationFee: parseFloat(registrationFee) || 0,
      description: description || "",
      status: "open",
    }

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 })
  }
}


