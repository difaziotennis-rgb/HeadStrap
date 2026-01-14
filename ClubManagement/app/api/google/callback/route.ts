import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getTokensFromCode } from "@/lib/google-api"
import { updateSettings } from "@/lib/settings-store"

/**
 * GET /api/google/callback
 * Handle Google OAuth callback and store tokens
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(new URL("/admin/integrations?error=" + encodeURIComponent(error), request.url))
    }

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 })
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    // Store tokens securely (in production, store in database with encryption)
    updateSettings("payments", {
      google: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date?.toString(),
      },
    } as any)

    // Redirect back to integrations page with success
    return NextResponse.redirect(new URL("/admin/integrations?connected=google-calendar", request.url))
  } catch (error: any) {
    console.error("Error in Google callback:", error)
    return NextResponse.redirect(
      new URL("/admin/integrations?error=" + encodeURIComponent(error.message || "Authentication failed"), request.url)
    )
  }
}

