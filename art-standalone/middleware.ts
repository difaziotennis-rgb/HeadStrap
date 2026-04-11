import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Legacy paths from the old /art prefix (if someone bookmarked edifazioart.net/art/...).
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/art" || pathname === "/art/") {
    return NextResponse.redirect(new URL(`/${search}`, request.url), 308);
  }
  if (pathname.startsWith("/art/")) {
    const dest = pathname.replace(/^\/art/, "") || "/";
    return NextResponse.redirect(new URL(`${dest}${search}`, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/art", "/art/:path*"],
};
