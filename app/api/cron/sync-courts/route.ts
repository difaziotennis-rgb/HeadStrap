import { NextResponse } from "next/server";
import { format, addDays } from "date-fns";

/**
 * Cron job to sync court availability from rhinebecktennis.com
 * This runs every 5 minutes via Vercel Cron
 */
export async function GET(request: Request) {
  // Verify this is a cron request (Vercel adds a header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check availability for next 30 days
    const today = new Date();
    const endDate = addDays(today, 30);
    const results: Array<{ date: string; hour: number; available: boolean }> = [];

    // Import timeSlots to check which slots are marked as available
    // Note: In a real implementation, this would come from your database
    // For now, we'll check via the API which respects your site's availability settings
    
    // Check each day
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");

      // Check each hour (9 AM - 7 PM)
      for (let hour = 9; hour <= 19; hour++) {
        try {
          // First, check if this time is marked as available on YOUR site
          // Only check rhinebecktennis.com if it's available on your site
          const slotId = `${dateStr}-${hour}`;
          
          // Check your site's availability first
          // We'll pass a flag to only check external if it's available locally
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/check-court-availability?date=${dateStr}&hour=${hour}&onlyIfAvailable=true`,
            {
              headers: {
                "User-Agent": "DiFazioTennis-Cron/1.0",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Only record if it was actually checked (not skipped)
            if (data.checked !== false) {
              results.push({
                date: dateStr,
                hour,
                available: data.available,
              });
            }
          }

          // Small delay to avoid overwhelming the external site
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error checking ${dateStr} ${hour}:00:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

