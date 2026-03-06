import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OWNER_ACCESS_COOKIE = "rtc_owner_access_v1";
const DEMO_ACCESS_COOKIE = "rtc_demo_access_v1";

// 24-hour demo window.
const DEMO_EXPIRES_AT = "2026-03-07T17:00:00.000Z";

function isDemoWindowOpen(): boolean {
  return Date.now() < new Date(DEMO_EXPIRES_AT).getTime();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public demo entry URL:
  // /demo (and /demo/*)
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    if (!isDemoWindowOpen()) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const rtcPath = pathname === "/demo" ? "/RTC" : pathname.replace(/^\/demo/, "/RTC");
    const rewriteUrl = new URL(rtcPath, request.url);
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set(DEMO_ACCESS_COOKIE, "true", {
      expires: new Date(DEMO_EXPIRES_AT),
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    return response;
  }

  // Private owner entry: /rtc (lowercase).
  // If you know this path, you keep access.
  if (pathname === "/rtc" || pathname.startsWith("/rtc/")) {
    const response = NextResponse.next();
    const ownerExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    response.cookies.set(OWNER_ACCESS_COOKIE, "true", {
      expires: ownerExpiry,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    return response;
  }

  // Guard uppercase RTC route group.
  if (pathname === "/RTC" || pathname.startsWith("/RTC/")) {
    const ownerAccess = request.cookies.get(OWNER_ACCESS_COOKIE)?.value === "true";
    const demoAccess = request.cookies.get(DEMO_ACCESS_COOKIE)?.value === "true";
    const demoStillValid = isDemoWindowOpen();
    if (ownerAccess || (demoAccess && demoStillValid)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rtc", "/rtc/:path*", "/RTC", "/RTC/:path*", "/demo", "/demo/:path*"],
};
