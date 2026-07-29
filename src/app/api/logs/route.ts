import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchLogs, createLog, deleteLog, fetchLogsByAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit")) || 100
  const houseId = searchParams.get("house_id") || undefined
  const adminId = searchParams.get("admin_id") || undefined

  if (adminId) {
    const logs = await fetchLogsByAdmin(adminId, limit)
    return NextResponse.json(logs)
  }

  const logs = await fetchLogs(limit, houseId)
  return NextResponse.json(logs)
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)

  const body = await request.json()
  const input: any = {
    message: body.message,
    type: body.type || "info",
    metadata: body.metadata || {},
    house_id: body.house_id || null,
  }

  if (auth) input.admin_id = auth.userId

  const log = await createLog(input)
  return NextResponse.json(log, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await deleteLog(id)
  return NextResponse.json({ success: true })
}
