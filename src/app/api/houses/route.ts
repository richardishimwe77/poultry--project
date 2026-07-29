import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchHouses, createHouse, updateHouse, deleteHouse } from "@/lib/supabase"

export async function GET() {
  try {
    const houses = await fetchHouses()
    return NextResponse.json(houses)
  } catch {
    return NextResponse.json({ error: "Failed to fetch houses", hint: "Check Supabase configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const house = await createHouse({ name: body.name, location: body.location || "" })
  return NextResponse.json(house, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const house = await updateHouse(body.id, body)
  return NextResponse.json(house)
}

export async function DELETE(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await deleteHouse(id)
  return NextResponse.json({ success: true })
}
