import { NextResponse } from "next/server";
import { format, addDays } from "date-fns";

/**
 * Cron job to sync court availability from rhinebecktennis.com
 * This runs every 5 minutes via Vercel Cron
 */
export async function GET(request: Request) {
  // Verify this is a cron request (Vercel adds a header)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // Only check auth if CRON_SECRET is set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check availability for next 30 days
    const today = new Date();
    const endDate = addDays(today, 30);
    const results: Array<{ date: string; hour: number; available: boolean }> = [];

    // Note: The check-court-availability endpoint will only check external availability
    // for slots that are already marked as available on your site.
    // This is handled in the calendar component and API route logic.
    // The cron job will check all slots, but the API will skip external checks
    // for slots that aren't available on your site.
    
    // Check each day
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");

      // Check each hour (9 AM - 7 PM)
      // The API will only actually check rhinebecktennis.com for slots
      // that are marked as available on your site
      for (let hour = 9; hour <= 19; hour++) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/check-court-availability?date=${dateStr}&hour=${hour}`,
            {
              headers: {
                "User-Agent": "DiFazioTennis-Cron/1.0",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Only record if it was actually checked (not skipped because not available on your site)
            if (data.checked !== false && data.skipped !== true) {
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

