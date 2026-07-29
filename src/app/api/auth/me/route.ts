import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  const payload = authenticateRequest(request)
  if (!payload) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
  })
}
