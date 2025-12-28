import { NextResponse } from "next/server";

/**
 * Comprehensive Browserless debugging endpoint
 * Tests configuration, connectivity, and API key validity
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    summary: {
      configured: false,
      working: false,
      errors: [],
    },
  };

  // Check 1: Environment Variables
  const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
  const BROWSERLESS_URL = process.env.BROWSERLESS_URL || "https://chrome.browserless.io";
  
  results.checks.envVars = {
    hasApiKey: !!BROWSERLESS_API_KEY,
    apiKeyLength: BROWSERLESS_API_KEY?.length || 0,
    apiKeyPrefix: BROWSERLESS_API_KEY ? BROWSERLESS_API_KEY.substring(0, 10) + "..." : "NOT_SET",
    browserlessUrl: BROWSERLESS_URL,
  };

  if (!BROWSERLESS_API_KEY) {
    results.summary.errors.push("BROWSERLESS_API_KEY not set in environment variables");
    return NextResponse.json(results);
  }

  results.summary.configured = true;

  // Check 2: Test Browserless API connectivity
  try {
    // Make a simple test request to Browserless
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for test

    const testResponse = await fetch(`${BROWSERLESS_URL}/function?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        code: `export default async ({ page }) => {
  return JSON.stringify({
    success: true,
    message: "Browserless connection test successful"
  });
};`,
      }),
    });

    clearTimeout(timeoutId);

    results.checks.browserlessApi = {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok,
    };

    if (testResponse.ok) {
      try {
        const responseText = await testResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
        results.checks.browserlessApi.response = responseData;
        results.summary.working = true;
      } catch (e: any) {
        results.checks.browserlessApi.parseError = e.message;
        results.summary.errors.push(`Failed to parse Browserless response: ${e.message}`);
      }
    } else {
      const errorText = await testResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      results.checks.browserlessApi.error = errorData;
      results.summary.errors.push(`Browserless API returned ${testResponse.status}: ${testResponse.statusText}`);
      results.summary.errors.push(`Error details: ${JSON.stringify(errorData)}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      results.checks.browserlessApi = {
        error: "Request timed out after 10 seconds",
        timeout: true,
      };
      results.summary.errors.push("Browserless API request timed out");
    } else {
      results.checks.browserlessApi = {
        error: error.message,
        errorType: error.name,
      };
      results.summary.errors.push(`Browserless API connection failed: ${error.message}`);
    }
  }

  // Check 3: Test the actual court availability endpoint
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://difaziotennis.com";
    const testUrl = `${baseUrl}/api/check-court-availability-browserless?date=2025-01-15&hour=10`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const endpointResponse = await fetch(testUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    results.checks.courtAvailabilityEndpoint = {
      status: endpointResponse.status,
      statusText: endpointResponse.statusText,
      ok: endpointResponse.ok,
    };

    if (endpointResponse.ok) {
      const endpointData = await endpointResponse.json();
      results.checks.courtAvailabilityEndpoint.response = endpointData;
      if (endpointData.error) {
        results.summary.errors.push(`Court availability endpoint error: ${endpointData.error}`);
      }
    } else {
      const errorText = await endpointResponse.text();
      results.checks.courtAvailabilityEndpoint.error = errorText;
      results.summary.errors.push(`Court availability endpoint returned ${endpointResponse.status}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      results.checks.courtAvailabilityEndpoint = {
        error: "Request timed out",
        timeout: true,
      };
    } else {
      results.checks.courtAvailabilityEndpoint = {
        error: error.message,
      };
      results.summary.errors.push(`Court availability endpoint test failed: ${error.message}`);
    }
  }

  return NextResponse.json(results, {
    status: results.summary.working ? 200 : 200, // Always return 200, but include error details
  });
}

