import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getSettings, updateSettings } from "@/lib/settings-store"

/**
 * GET /api/settings
 * Get all settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section") || "all"

    const settings = getSettings(section as any)

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 })
  }
}

/**
 * PUT /api/settings
 * Update settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { section, settings } = body

    if (!section || !settings) {
      return NextResponse.json({ error: "Missing section or settings" }, { status: 400 })
    }

    // Update settings
    updateSettings(section as any, settings)

    return NextResponse.json({ success: true, settings: getSettings(section as any) })
  } catch (error: any) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 })
  }
}

/**
 * POST /api/settings/test-connection
 * Test payment provider connection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json({ error: "Missing provider" }, { status: 400 })
    }

    // Mock connection test
    // In production, this would actually test the connection
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      connected: true,
      message: `${provider} connection test successful`,
    })
  } catch (error: any) {
    console.error("Error testing connection:", error)
    return NextResponse.json({ error: error.message || "Connection test failed" }, { status: 500 })
  }
}

