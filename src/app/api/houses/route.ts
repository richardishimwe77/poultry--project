import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"

// Single hardcoded house — the Express backend doesn't have multi-house support
const DEFAULT_HOUSE = {
  id: "house-1",
  name: "Main House",
  location: "Poultry Farm",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function GET() {
  return NextResponse.json([DEFAULT_HOUSE])
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(DEFAULT_HOUSE, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json(DEFAULT_HOUSE)
}

export async function DELETE() {
  return NextResponse.json({ error: "Cannot delete the only house" }, { status: 400 })
}
