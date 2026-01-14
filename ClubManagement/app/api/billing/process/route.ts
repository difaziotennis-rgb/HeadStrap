import { NextRequest, NextResponse } from "next/server"
import { processMonthlyBilling } from "@/lib/billing"
import { getSession } from "@/lib/auth"

/**
 * API Route to manually trigger monthly billing
 * Should typically be called by a cron job on the 1st of each month
 * 
 * GET /api/billing/process?date=2024-01-01 - Process billing for a specific date
 * POST /api/billing/process - Process billing for current date
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admins can trigger billing
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { date } = await request.json().catch(() => ({}))
    const billingDate = date ? new Date(date) : new Date()

    const results = await processMonthlyBilling(billingDate)

    return NextResponse.json({
      success: true,
      message: `Billing processed successfully`,
      results: {
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error processing billing:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process monthly billing",
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admins can trigger billing
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")
    const billingDate = dateParam ? new Date(dateParam) : new Date()

    const results = await processMonthlyBilling(billingDate)

    return NextResponse.json({
      success: true,
      message: `Billing processed successfully`,
      results: {
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error processing billing:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process monthly billing",
      },
      { status: 500 }
    )
  }
}


