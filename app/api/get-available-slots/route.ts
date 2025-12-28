import { NextResponse } from "next/server";

/**
 * Get list of time slots that are marked as available on the site
 * Used by cron job to know which slots to check externally
 */
export async function GET(request: Request) {
  try {
    // This would normally query your database
    // For now, we'll return a structure that the cron can use
    // The cron will need to check each slot individually via the check-court-availability endpoint
    // which will handle the logic of only checking if available
    
    return NextResponse.json({
      message: "Use /api/check-court-availability with onlyIfAvailable=true",
      note: "The check endpoint will only verify slots that are already marked as available",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}







