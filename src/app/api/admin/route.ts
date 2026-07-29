import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin } from "@/lib/supabase"
import { hashPassword } from "@/lib/auth/password"

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admins = await fetchAdmins()
  return NextResponse.json(admins)
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const password_hash = await hashPassword(body.password)

  const admin = await createAdmin({
    email: body.email,
    password_hash,
    name: body.name,
    role: body.role || "admin",
  })

  return NextResponse.json(admin, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const updates: any = { ...body }
  delete updates.id
  if (updates.password) {
    updates.password_hash = await hashPassword(updates.password)
    delete updates.password
  }

  const admin = await updateAdmin(body.id, updates)
  return NextResponse.json(admin)
}

export async function DELETE(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await deleteAdmin(id)
  return NextResponse.json({ success: true })
}
