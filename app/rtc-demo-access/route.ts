import { NextResponse } from "next/server";

const DEMO_ACCESS_COOKIE = "rtc_demo_access_v1";
const DEMO_ACCESS_TOKEN = "rtc_demo_24h_8d3f1c";
const DEMO_EXPIRES_AT = "2026-03-07T23:59:59.000Z";

function demoWindowOpen(): boolean {
  return Date.now() < new Date(DEMO_EXPIRES_AT).getTime();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  if (token !== DEMO_ACCESS_TOKEN || !demoWindowOpen()) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const response = NextResponse.redirect(new URL("/RTC", url.origin));
  response.cookies.set(DEMO_ACCESS_COOKIE, "true", {
    expires: new Date(DEMO_EXPIRES_AT),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  return response;
}
