import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getGoogleAuthUrl } from "@/lib/google-api"

/**
 * GET /api/google/auth
 * Initiate Google OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scopes = searchParams.get("scopes")?.split(",") || [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/spreadsheets",
    ]

    const authUrl = getGoogleAuthUrl(scopes)

    return NextResponse.json({
      success: true,
      authUrl,
    })
  } catch (error: any) {
    console.error("Error generating Google auth URL:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate auth URL" },
      { status: 500 }
    )
  }
}

