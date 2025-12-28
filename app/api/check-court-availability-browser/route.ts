import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Browser-based check using Puppeteer
 * DEPRECATED: Use /api/check-court-availability-browserless instead
 * This route is kept for backward compatibility but uses Browserless.io
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const hour = searchParams.get("hour");

    if (!date || !hour) {
      return NextResponse.json(
        { error: "Date and hour parameters required" },
        { status: 400 }
      );
    }

    // Redirect to Browserless.io route
    // This route is deprecated - use browserless route instead
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
      const response = await fetch(`${baseUrl}/api/check-court-availability-browserless?date=${date}&hour=${hour}`);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          ...data,
          source: "rhinebecktennis.com (browserless via browser route)",
        });
      }
    } catch (error) {
      console.error("Browserless route error:", error);
    }

    // Fallback: return available if browserless fails
    return NextResponse.json({
      available: true,
      error: "Use /api/check-court-availability-browserless instead",
      date,
      hour: parseInt(hour),
      source: "fallback",
    });
  } catch (error: any) {
    console.error("Error in browser-based check:", error);
    return NextResponse.json({
      available: true, // Fail open
      error: error.message,
      date: new URL(request.url).searchParams.get("date") || "",
      hour: parseInt(new URL(request.url).searchParams.get("hour") || "0"),
      source: "error-fallback",
    });
  }
}
