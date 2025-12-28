import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Check court availability using Browserless.io
 * This uses browser automation to interact with the Wix booking widget
 * Updated: Ready for production use
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

    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
    const BROWSERLESS_URL = process.env.BROWSERLESS_URL || "https://chrome.browserless.io";

    if (!BROWSERLESS_API_KEY) {
      return NextResponse.json({
        available: true,
        error: "Browserless API key not configured",
        date,
        hour: parseInt(hour),
      });
    }

    // Parse the date
    const dateObj = new Date(date + "T12:00:00");
    const dayOfMonth = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    // Format hour for checking
    const hourNum = parseInt(hour);
    const timeStr12 = hourNum === 12 
      ? "12:00 PM"
      : hourNum > 12 
        ? `${hourNum - 12}:00 PM`
        : `${hourNum}:00 AM`;

    // Use Browserless.io to automate the browser
    // Browserless.io uses /function endpoint for custom Puppeteer code
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Browserless
    
    let browserlessResponse;
    try {
      browserlessResponse = await fetch(`${BROWSERLESS_URL}/function?token=${BROWSERLESS_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          code: `export default async ({ page }) => {
  // Navigate to booking page
  await page.goto('https://rhinebecktennis.com/book-online', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Try to find and click "Book Now" button
  try {
    const bookNowSelectors = [
      'button:has-text("Book Now")',
      'a:has-text("Book Now")',
      '[data-testid*="book"]',
      'button[class*="book"]',
      'a[class*="book"]'
    ];
    
    let clicked = false;
    for (const selector of bookNowSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(2000);
          clicked = true;
          break;
        }
      } catch (e) {}
    }
  } catch (e) {
    console.log('Could not find Book Now button, continuing...');
  }
  
  // Wait for calendar to appear
  await page.waitForTimeout(2000);
  
  // Try to click on the date (day ${dayOfMonth})
  try {
    const dateSelectors = [
      \`button[aria-label*="${dayOfMonth}"]\`,
      \`[data-date="${date}"]\`,
      \`button:has-text("${dayOfMonth}")\`,
      \`td:has-text("${dayOfMonth}")\`,
      \`[class*="calendar"] button:has-text("${dayOfMonth}")\`
    ];
    
    let dateClicked = false;
    for (const selector of dateSelectors) {
      try {
        const dateButton = await page.$(selector);
        if (dateButton) {
          await dateButton.click();
          await page.waitForTimeout(2000);
          dateClicked = true;
          break;
        }
      } catch (e) {}
    }
  } catch (e) {
    console.log('Could not click date, continuing...');
  }
  
  // Extract available time slots
  const timeSlots = await page.evaluate(() => {
    const slots = [];
    const selectors = [
      'button[class*="time"]',
      '[data-testid*="time"]',
      '[class*="time-slot"]',
      '[class*="slot"]',
      'button[class*="available"]',
      '[role="button"][class*="time"]'
    ];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const text = el.textContent?.trim();
        if (text && (text.match(/\\d{1,2}:\\d{2}\\s*(AM|PM)/) || text.match(/\\d{1,2}:00/))) {
          slots.push(text);
        }
      });
    }
    
    return [...new Set(slots)]; // Remove duplicates
  });
  
  return JSON.stringify({
    timeSlots: timeSlots,
    pageTitle: await page.title(),
    url: page.url()
  });
};`,
        }),
    });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          available: true,
          error: "Browserless request timed out",
          date,
          hour: parseInt(hour),
        });
      }
      throw fetchError;
    }

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }
      console.error("Browserless error:", errorText);
      
      // Try to extract useful error information
      let errorMessage = `Browserless request failed: ${browserlessResponse.status}`;
      if (typeof errorDetails === 'object' && errorDetails.message) {
        errorMessage = errorDetails.message;
      } else if (typeof errorDetails === 'string') {
        errorMessage = errorDetails;
      }
      
      return NextResponse.json({
        available: true, // Fail open
        error: errorMessage,
        errorCode: browserlessResponse.status,
        errorDetails: errorDetails,
        date,
        hour: parseInt(hour),
        browserlessUrl: BROWSERLESS_URL,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await browserlessResponse.json();
    let timeSlots: string[] = [];
    
    try {
      const parsed = JSON.parse(result.text || result);
      timeSlots = parsed.timeSlots || [];
    } catch (e) {
      // If result is already an object
      timeSlots = result.timeSlots || [];
    }

    // Check if our time is in the list
    const isAvailable = timeSlots.some(slot => {
      const slotLower = slot.toLowerCase();
      return slotLower.includes(timeStr12.toLowerCase()) ||
             slotLower.includes(`${hourNum}:00`) ||
             slotLower.includes(`${hourNum.toString().padStart(2, '0')}:00`);
    });

    return NextResponse.json({
      available: isAvailable,
      date,
      hour: parseInt(hour),
      availableTimes: timeSlots,
      checkedAt: new Date().toISOString(),
      source: "rhinebecktennis.com (Browserless.io)",
    });

  } catch (error: any) {
    console.error("Error checking availability with Browserless:", error);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || "";
    const hourParam = searchParams.get("hour") || "0";
    return NextResponse.json({
      available: true, // Fail open
      error: error.message,
      date: dateParam,
      hour: parseInt(hourParam),
    });
  }
}

