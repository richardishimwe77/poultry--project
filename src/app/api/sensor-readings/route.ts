import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import {
  fetchSensorReadings,
  createSensorReading,
  deleteSensorReading,
  updateSensorReading,
} from "@/lib/supabase"
import { getDateRange } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter = (searchParams.get("filter") as any) || "daily"
  const start = searchParams.get("start") || undefined
  const end = searchParams.get("end") || undefined
  const houseId = searchParams.get("house_id") || undefined

  const { startDate, endDate } = getDateRange(filter, start, end)
  const readings = await fetchSensorReadings(startDate, endDate, houseId)
  return NextResponse.json(readings)
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)

  const body = await request.json()
  const input: any = {
    temperature: body.temperature,
    humidity: body.humidity,
    air_quality: body.air_quality,
    fan_status: body.fan_status ?? false,
    house_id: body.house_id || null,
  }

  if (auth) input.created_by = auth.userId

  const reading = await createSensorReading(input)
  return NextResponse.json(reading, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const updates: any = { ...body }
  delete updates.id

  const reading = await updateSensorReading(body.id, updates)
  return NextResponse.json(reading)
}

export async function DELETE(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await deleteSensorReading(id)
  return NextResponse.json({ success: true })
}
