import { NextRequest, NextResponse } from "next/server"
import { processMonthlyBilling } from "@/lib/billing"
import { headers } from "next/headers"

/**
 * Scheduled billing endpoint
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
 * on the 1st of each month.
 * 
 * For security, you should verify a cron secret header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const headersList = headers()
    const cronSecret = headersList.get("x-cron-secret")
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid cron secret" },
        { status: 401 }
      )
    }

    // Process billing for the current month
    const billingDate = new Date()
    const results = await processMonthlyBilling(billingDate)

    return NextResponse.json({
      success: true,
      message: "Monthly billing processed successfully",
      results: {
        processed: results.processed,
        skipped: results.skipped,
        errors: results.errors,
      },
      billingPeriod: billingDate.toISOString(),
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error in scheduled billing:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process scheduled billing",
      },
      { status: 500 }
    )
  }
}

/**
 * Allow GET for cron services that use GET requests
 */
export async function GET(request: NextRequest) {
  return POST(request)
}


