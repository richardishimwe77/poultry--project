import { NextRequest, NextResponse } from "next/server"
import { verifyToken, type JwtPayload } from "./jwt"

export function getTokenFromRequest(request: NextRequest): string | null {
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)

  const cookie = request.cookies.get("token")?.value
  if (cookie) return cookie

  return null
}

export function authenticateRequest(request: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null

  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(request: NextRequest): JwtPayload | NextResponse {
  const payload = authenticateRequest(request)
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return payload
}
