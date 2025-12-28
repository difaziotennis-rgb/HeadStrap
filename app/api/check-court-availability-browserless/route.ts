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
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for Browserless
    
    let browserlessResponse;
    try {
      browserlessResponse = await fetch(`${BROWSERLESS_URL}/function?token=${BROWSERLESS_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/javascript",
        },
        signal: controller.signal,
        body: `export default async function ({ page }) {
  // Navigate to booking page
  await page.goto('https://rhinebecktennis.com/book-online', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try to find and click "Book Now" button using evaluate for more reliability
  let bookNowClicked = false;
  try {
    bookNowClicked = await page.evaluate(() => {
      // Find all clickable elements
      const elements = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      for (const el of elements) {
        const text = el.textContent?.trim();
        if (text && text.toLowerCase().includes('book now')) {
          if (el instanceof HTMLElement) {
            el.click();
            return true;
          }
        }
      }
      return false;
    });
    
    if (bookNowClicked) {
      // Wait for calendar/modal to appear - try to wait for a calendar element
      try {
        await page.waitForSelector('[class*="calendar"], [class*="date"], iframe', { timeout: 5000 }).catch(() => {});
      } catch (e) {}
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {
    console.log('Could not find Book Now button, continuing...');
  }
  
  // Wait a bit for calendar to appear (reduced)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Try to click on the date (day ${dayOfMonth})
  // We need to find and click the date in the calendar to see time slots
  let dateClicked = false;
  try {
    // First, check if there's an iframe for the calendar widget
    const frames = page.frames();
    let targetFrame = page.mainFrame();
    
    // Look for calendar/booking iframes
    for (const frame of frames) {
      const frameUrl = frame.url();
      if (frameUrl.includes('calendar') || frameUrl.includes('booking') || frameUrl.includes('wix')) {
        targetFrame = frame;
        break;
      }
    }
    
    // Try multiple strategies: first with selectors, then with evaluate
    const dateSelectors = [
      \`[aria-label*="${dayOfMonth}"]\`,
      \`[data-date="${date}"]\`,
      \`[data-date*="${dayOfMonth}"]\`,
      \`[aria-label*="January ${dayOfMonth}"], [aria-label*="Jan ${dayOfMonth}"]\`
    ];
    
    for (const selector of dateSelectors) {
      try {
        const dateButton = await targetFrame.$(selector);
        if (dateButton) {
          await dateButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          dateClicked = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    // If selectors didn't work, use evaluate to find by text content
    if (!dateClicked) {
      const clicked = await targetFrame.evaluate((day, targetDate) => {
        // Try to find date elements - buttons, cells, divs in calendar
        const selectors = 'button, [role="button"], td, div[class*="date"], a[class*="date"], div[class*="day"], button[class*="day"]';
        const elements = Array.from(document.querySelectorAll(selectors));
        const dayStr = String(day);
        
        for (const el of elements) {
          const text = el.textContent?.trim();
          // Match exact day number or date string
          if (text === dayStr || text === targetDate || (el.getAttribute('data-date') === targetDate)) {
            if (el instanceof HTMLElement) {
              // Check if element is not disabled
              const isDisabled = el.hasAttribute('disabled') || 
                                el.classList.contains('disabled') ||
                                el.classList.contains('unavailable');
              if (!isDisabled) {
                el.click();
                return true;
              }
            }
          }
        }
        return false;
      }, ${dayOfMonth}, "${date}");
      
      if (clicked) {
        // Wait for time slots to load - try to wait for time slot elements
        try {
          await targetFrame.waitForSelector('[class*="time"], [class*="slot"], button', { timeout: 3000 }).catch(() => {});
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, 2000));
        dateClicked = true;
      }
    }
  } catch (e) {
    console.log('Could not click date, continuing...', e);
  }
  
  // Extract available time slots from the calendar
  // We need to find elements that represent available times (not unavailable/booked ones)
  // Also check if we're in an iframe
  const extractionResult = await page.evaluate(() => {
    const slots = [];
    const debugInfo = {
      pageTitle: document.title,
      url: window.location.href,
      foundElements: [],
      allButtons: [],
      allText: [],
      allClickableElements: [],
      calendarElements: [],
      hasIframe: document.querySelectorAll('iframe').length > 0,
      iframeCount: document.querySelectorAll('iframe').length
    };
    
    // Find ALL clickable elements (not just buttons) to see what's available
    const allClickable = document.querySelectorAll('button, [role="button"], a, div[class*="click"], div[class*="slot"], div[class*="time"], td, [class*="calendar"] button, [class*="calendar"] td');
    allClickable.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length < 50) {
        debugInfo.allClickableElements.push({
          text: text,
          tag: el.tagName,
          classes: el.className,
          disabled: el.hasAttribute('disabled') || el.classList.contains('disabled'),
          dataDate: el.getAttribute('data-date') || null
        });
      }
    });
    
    // Look for calendar-related elements
    const calendarSelectors = [
      '[class*="calendar"]',
      '[class*="date-picker"]',
      '[class*="datepicker"]',
      '[class*="booking"]',
      '[id*="calendar"]',
      '[id*="date"]'
    ];
    calendarSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          debugInfo.calendarElements.push({
            selector: selector,
            count: elements.length
          });
        }
      } catch (e) {}
    });
    
    // First, let's see what buttons and elements are on the page
    const allButtons = document.querySelectorAll('button, [role="button"], a[class*="button"], div[class*="button"]');
    allButtons.forEach((btn, index) => {
      const text = btn.textContent?.trim();
      if (text && text.length < 50) { // Increased length limit
        debugInfo.allButtons.push({
          text: text,
          classes: btn.className,
          disabled: btn.hasAttribute('disabled') || btn.classList.contains('disabled'),
          tagName: btn.tagName
        });
      }
    });
    
    // Try multiple selectors to find time slot elements
    const selectors = [
      // Wix booking widget common selectors
      'button[class*="time"]:not([disabled]):not([class*="disabled"]):not([class*="unavailable"])',
      '[data-testid*="time"]:not([disabled]):not([class*="disabled"])',
      '[class*="time-slot"]:not([disabled]):not([class*="unavailable"])',
      '[class*="slot"]:not([disabled]):not([class*="unavailable"])',
      'button[class*="available"]',
      '[role="button"][class*="time"]:not([disabled])',
      // Generic button selectors that might contain times
      'button:not([disabled]):not([class*="disabled"]):not([class*="unavailable"])'
    ];
    
    // Try each selector
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        debugInfo.foundElements.push({ selector, count: elements.length });
        elements.forEach((el) => {
          const text = el.textContent?.trim();
          // Match time patterns: "9:00 AM", "9 AM", "09:00", "2:00 PM", etc.
          if (text && (
            text.match(/\\d{1,2}:\\d{2}\\s*(AM|PM)/i) || 
            text.match(/\\d{1,2}\\s*(AM|PM)/i) ||
            text.match(/\\d{1,2}:00/) ||
            text.match(/^\\d{1,2}$/) // Just a number (like "9" or "10")
          )) {
            // Only add if it looks like a time and element is clickable/enabled
            const isDisabled = el.hasAttribute('disabled') || 
                              el.classList.contains('disabled') ||
                              el.classList.contains('unavailable') ||
                              el.classList.contains('booked');
            if (!isDisabled) {
              slots.push(text);
            }
          }
        });
      } catch (e) {
        // Continue if selector fails
      }
    }
    
    // Remove duplicates
    return {
      slots: [...new Set(slots)],
      debug: debugInfo
    };
  });
  
  const timeSlots = extractionResult.slots || [];
  const debugInfoFromPage = extractionResult.debug || {};
  
  // Also get page info for debugging
  const pageTitle = await page.title();
  const pageUrl = page.url();
  
  return {
    data: {
      timeSlots: timeSlots,
      pageTitle: pageTitle,
      url: pageUrl,
      debug: {
        ...debugInfoFromPage,
        dateClicked: dateClicked,
        bookNowClicked: bookNowClicked,
        extractionResultKeys: Object.keys(extractionResult || {}),
        hasDebug: !!extractionResult?.debug
      }
    },
    type: "application/json"
  };
}`,
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
    // Browserless returns { data: {...}, type: "..." }
    const responseData = result.data || result;
    const timeSlots: string[] = responseData.timeSlots || [];
    const debugInfo = responseData.debug || {};

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
      debug: debugInfo || {}, // Include debug info to help troubleshoot
      pageTitle: responseData.pageTitle || 'unknown',
      pageUrl: responseData.url || 'unknown'
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

