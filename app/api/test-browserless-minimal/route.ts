import { NextResponse } from "next/server";

/**
 * Minimal test to see if Browserless accepts ANY code format
 */
export async function GET() {
  const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
  const BROWSERLESS_URL = process.env.BROWSERLESS_URL || "https://chrome.browserless.io";

  if (!BROWSERLESS_API_KEY) {
    return NextResponse.json({ error: "API key not configured" });
  }

  // Test the absolute simplest possible code
  const simpleCode = `export default async ({ page }) => {
  return "Hello from Browserless!";
};`;

  try {
    const response = await fetch(`${BROWSERLESS_URL}/function?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: simpleCode,
      }),
    });

    const status = response.status;
    const text = await response.text();

    return NextResponse.json({
      status,
      ok: response.ok,
      response: text.substring(0, 500),
      codeSent: simpleCode,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      codeSent: simpleCode,
    });
  }
}

