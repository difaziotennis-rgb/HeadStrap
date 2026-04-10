import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isArtSiteHost, primarySiteOrigin } from "@/lib/art/art-domain";

const OWNER_ACCESS_COOKIE = "rtc_owner_access_v1";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");

  // Ellen’s domain: clean URLs at /, /shop, /about — internally /art/* (see matcher).
  if (isArtSiteHost(host)) {
    if (pathname.startsWith("/_next") || pathname.startsWith("/_vercel")) {
      return NextResponse.next();
    }
    // Art APIs and Stripe webhook must stay on this host
    if (pathname.startsWith("/api/art")) {
      return NextResponse.next();
    }
    // Strip legacy /art prefix in the address bar → /shop, /about, etc.
    if (pathname === "/art" || pathname === "/art/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url), 308);
    }
    if (pathname.startsWith("/art/")) {
      const rest = pathname.slice("/art".length) || "/";
      return NextResponse.redirect(new URL(`${rest}${search}`, request.url), 308);
    }
    // Map public paths to app routes under /art
    if (pathname === "/" || pathname === "") {
      return NextResponse.rewrite(new URL(`/art${search}`, request.url));
    }
    if (pathname === "/about" || pathname.startsWith("/about/")) {
      return NextResponse.rewrite(new URL(`/art${pathname}${search}`, request.url));
    }
    if (pathname === "/shop" || pathname.startsWith("/shop/")) {
      return NextResponse.rewrite(new URL(`/art${pathname}${search}`, request.url));
    }
    // Likely static file at public root (favicon, etc.)
    const lastSegment = pathname.split("/").pop() || "";
    if (lastSegment.includes(".")) {
      return NextResponse.next();
    }
    // Everything else on her domain → main tennis site
    const primary = primarySiteOrigin();
    return NextResponse.redirect(new URL(`${pathname}${search}`, primary), 307);
  }

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
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/rtc",
    "/rtc/:path*",
    "/RTC",
    "/RTC/:path*",
    "/demo",
    "/demo/:path*",
  ],
};
