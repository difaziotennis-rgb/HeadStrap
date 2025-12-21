import { NextResponse } from "next/server";

/**
 * Browser-based check using Puppeteer
 * This requires @sparticus/chromium for Vercel serverless compatibility
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

    // Dynamic import to avoid loading in serverless if not needed
    let puppeteer: any;
    let chromium: any;
    
    try {
      puppeteer = await import("puppeteer-core");
      chromium = await import("@sparticus/chromium");
    } catch (error) {
      console.error("Puppeteer not available:", error);
      // Fallback to simple check
      return NextResponse.json({
        available: true,
        error: "Browser automation not configured",
        date,
        hour: parseInt(hour),
      });
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    try {
      const page = await browser.newPage();
      
      // Navigate to Court Rentals page
      await page.goto("https://rhinebecktennis.com/book-online", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Look for "Book Now" button and click it
      // This will vary based on the actual page structure
      const bookNowButton = await page.$('button:has-text("Book Now"), a:has-text("Book Now"), [data-testid*="book"]');
      if (bookNowButton) {
        await bookNowButton.click();
        await page.waitForTimeout(2000);
      }

      // Wait for calendar to appear
      // Look for calendar widget
      await page.waitForSelector('[data-testid*="calendar"], .calendar, [class*="calendar"]', {
        timeout: 10000,
      }).catch(() => {
        console.log("Calendar selector not found, trying alternative...");
      });

      // Parse the date
      const dateObj = new Date(date + "T12:00:00");
      const dayOfMonth = dateObj.getDate();
      
      // Click on the specific date in the calendar
      // This selector will need to be adjusted based on actual calendar structure
      const dateSelector = `button[aria-label*="${dayOfMonth}"], [data-date="${date}"], button:has-text("${dayOfMonth}")`;
      const dateButton = await page.$(dateSelector);
      
      if (dateButton) {
        await dateButton.click();
        await page.waitForTimeout(2000);
      }

      // Extract available times from the page
      // Look for time slots that are listed (available)
      const timeSlots = await page.evaluate(() => {
        const slots: string[] = [];
        // Look for time slot elements - this will need customization
        const elements = document.querySelectorAll(
          'button[class*="time"], [data-testid*="time"], [class*="time-slot"]'
        );
        elements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && text.match(/\d{1,2}:\d{2}\s*(AM|PM)/)) {
            slots.push(text);
          }
        });
        return slots;
      });

      // Format the hour we're checking
      const hourNum = parseInt(hour);
      const timeStr12 = hourNum === 12 
        ? "12:00 PM"
        : hourNum > 12 
          ? `${hourNum - 12}:00 PM`
          : `${hourNum}:00 AM`;

      // Check if our time is in the list of available times
      const isAvailable = timeSlots.some(slot => 
        slot.includes(timeStr12) || 
        slot.includes(`${hourNum}:00`) ||
        slot.includes(`${hourNum.toString().padStart(2, '0')}:00`)
      );

      await browser.close();

      return NextResponse.json({
        available: isAvailable,
        date,
        hour: parseInt(hour),
        availableTimes: timeSlots,
        checkedAt: new Date().toISOString(),
        source: "rhinebecktennis.com (browser)",
      });

    } finally {
      await browser.close();
    }

  } catch (error: any) {
    console.error("Error in browser-based check:", error);
    return NextResponse.json({
      available: true, // Fail open
      error: error.message,
      date,
      hour: parseInt(hour || "0"),
    });
  }
}

