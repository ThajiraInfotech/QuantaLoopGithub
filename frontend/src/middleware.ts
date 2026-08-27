import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Paths that must never be indexed (private app + APIs). */
const NOINDEX_PREFIXES = [
  "/dashboard",
  "/admin",
  "/onboarding",
  "/api",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const X_ROBOTS_TAG = "noindex, nofollow, noarchive, nosnippet";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const shouldNoIndex = NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!shouldNoIndex) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", X_ROBOTS_TAG);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
    "/api/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
