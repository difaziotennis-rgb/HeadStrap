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
  // Set shorter timeouts to prevent hanging
  page.setDefaultNavigationTimeout(10000);
  page.setDefaultTimeout(10000);
  
  // Navigate to booking page with shorter timeout
  try {
    await page.goto('https://rhinebecktennis.com/book-online', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
  } catch (e) {
    // If navigation fails, return error info
    return {
      data: {
        error: "Navigation failed: " + (e.message || "unknown"),
        timeSlots: [],
        pageTitle: "Navigation Error"
      },
      type: "application/json"
    };
  }
  
  // Quick wait for page to render
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Try to click "Book Now" button
  let bookNowClicked = false;
  try {
    bookNowClicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('a, button'));
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
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {
    // Continue even if Book Now click fails
  }
  
  // Try to click date - simplified approach
  let dateClicked = false;
  try {
    const clicked = await page.evaluate((day, targetDate) => {
      const elements = Array.from(document.querySelectorAll('button, [role="button"], td, div[class*="date"], a[class*="date"], div[class*="day"], button[class*="day"], [data-date]'));
      const dayStr = String(day);
      
      for (const el of elements) {
        const text = el.textContent?.trim();
        const dataDate = el.getAttribute('data-date');
        if (text === dayStr || dataDate === targetDate || text === targetDate) {
          if (el instanceof HTMLElement && !el.hasAttribute('disabled')) {
            el.click();
            return true;
          }
        }
      }
      return false;
    }, ${dayOfMonth}, "${date}");
    
    if (clicked) {
      dateClicked = true;
      // Wait longer for time slots to load after clicking date
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  } catch (e) {
    // Continue even if date click fails
  }
  
  // Extract available time slots - simplified
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
          if (!text) return;
          
          // Skip calendar day numbers (days 1-31) - these are NOT times
          const isDayNumber = /^\\d{1,2}$/.test(text);
          if (isDayNumber) {
            const num = parseInt(text);
            if (num >= 1 && num <= 31) {
              return; // Skip calendar day numbers
            }
          }
          
          // Match actual time patterns: "9:00 AM", "9 AM", "09:00", "2:00 PM", etc.
          // Must include AM/PM or colon to be a time (not just a number)
          const isTimePattern = text.match(/\\d{1,2}:\\d{2}\\s*(AM|PM)/i) || 
                               text.match(/\\d{1,2}\\s*(AM|PM)/i) ||
                               text.match(/\\d{1,2}:00/);
          
          if (isTimePattern) {
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

