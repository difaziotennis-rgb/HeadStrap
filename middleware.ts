import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OWNER_ACCESS_COOKIE = "rtc_owner_access_v1";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Demo link is intentionally inactive.
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return NextResponse.redirect(new URL("/", request.url));
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
    if (ownerAccess) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rtc", "/rtc/:path*", "/RTC", "/RTC/:path*", "/demo", "/demo/:path*"],
};
