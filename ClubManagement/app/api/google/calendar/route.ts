import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getCalendarClient, refreshAccessToken } from "@/lib/google-api"
import { getSettings } from "@/lib/settings-store"

/**
 * POST /api/google/calendar/sync
 * Sync a reservation/event to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = getSettings("payments") as any
    const googleTokens = settings?.google

    if (!googleTokens?.accessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please connect your Google account first." },
        { status: 401 }
      )
    }

    // Check if token needs refresh
    let accessToken = googleTokens.accessToken
    if (googleTokens.expiryDate && new Date(googleTokens.expiryDate) < new Date()) {
      if (!googleTokens.refreshToken) {
        return NextResponse.json({ error: "Refresh token expired. Please reconnect Google Calendar." }, { status: 401 })
      }
      accessToken = await refreshAccessToken(googleTokens.refreshToken)
    }

    const body = await request.json()
    const { title, description, startTime, endTime, location, attendees } = body

    const calendar = await getCalendarClient(accessToken)

    // Create calendar event
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description || "",
        location: location || "",
        start: {
          dateTime: new Date(startTime).toISOString(),
          timeZone: "America/Los_Angeles",
        },
        end: {
          dateTime: new Date(endTime).toISOString(),
          timeZone: "America/Los_Angeles",
        },
        attendees: attendees?.map((email: string) => ({ email })) || [],
      },
    })

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      event: event.data,
    })
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync to Google Calendar" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/google/calendar/events
 * Get events from Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = getSettings("payments") as any
    const googleTokens = settings?.google

    if (!googleTokens?.accessToken) {
      return NextResponse.json(
        { error: "Google Calendar not connected" },
        { status: 401 }
      )
    }

    let accessToken = googleTokens.accessToken
    if (googleTokens.expiryDate && new Date(googleTokens.expiryDate) < new Date()) {
      if (!googleTokens.refreshToken) {
        return NextResponse.json({ error: "Refresh token expired. Please reconnect." }, { status: 401 })
      }
      accessToken = await refreshAccessToken(googleTokens.refreshToken)
    }

    const { searchParams } = new URL(request.url)
    const timeMin = searchParams.get("timeMin") || new Date().toISOString()
    const timeMax = searchParams.get("timeMax")
    const maxResults = parseInt(searchParams.get("maxResults") || "50")

    const calendar = await getCalendarClient(accessToken)

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax: timeMax || undefined,
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })

    return NextResponse.json({
      success: true,
      events: response.data.items || [],
    })
  } catch (error: any) {
    console.error("Error fetching Google Calendar events:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch events" },
      { status: 500 }
    )
  }
}

