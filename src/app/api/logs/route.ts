import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"

// The Express backend doesn't have a dedicated logs table.
// Return empty results so the frontend logs page shows "no entries".

export async function GET() {
  return NextResponse.json([])
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Accept the log but don't persist — just echo it back
  const body = await request.json()
  return NextResponse.json(
    {
      id: crypto.randomUUID(),
      admin_id: auth.userId,
      house_id: body.house_id || null,
      message: body.message || "",
      type: body.type || "info",
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
    },
    { status: 201 },
  )
}

export async function DELETE() {
  return NextResponse.json({ error: "Deletes not supported" }, { status: 400 })
}
