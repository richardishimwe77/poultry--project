import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"

const publicPaths = ["/login", "/signup", "/verify", "/reset-password"]
const apiPrefix = "/api"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public pages and API routes without auth (auth endpoints handle their own auth)
  if (publicPaths.some((p) => pathname.startsWith(p)) || pathname.startsWith(apiPrefix)) {
    return NextResponse.next()
  }

  // Static files
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  const payload = authenticateRequest(request)
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
}
