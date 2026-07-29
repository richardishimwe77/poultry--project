import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchReadings, fetchControls } from "@/lib/backend-api"
import { getDateRange } from "@/lib/date-utils"
import type { FilterPeriod } from "@/lib/types"

// Map Express backend data to the frontend SensorReading shape
function mapReading(
  r: { id: number; temperature: number; humidity: number; gaz: number; added_date: string },
  fanState: boolean,
  heaterState: boolean,
) {
  return {
    id: String(r.id),
    house_id: null as string | null,
    temperature: r.temperature,
    humidity: r.humidity,
    air_quality: r.gaz,
    fan_status: fanState,
    heater_status: heaterState,
    created_by: null as string | null,
    created_at: r.added_date,
    updated_at: r.added_date,
  }
}

export async function GET(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const filter = (searchParams.get("filter") as FilterPeriod) || "daily"
  const start = searchParams.get("start") || undefined
  const end = searchParams.get("end") || undefined
  const houseId = searchParams.get("house_id")

  try {
    const [readings, controls] = await Promise.all([
      fetchReadings(),
      fetchControls(),
    ])

    const fanState = controls.find((c) => c.gpio === "19")?.state === 1
    const heaterState = controls.find((c) => c.gpio === "14")?.state === 1

    const { startDate, endDate } = getDateRange(filter, start, end)

    const mapped = readings
      .filter((r) => {
        const d = new Date(r.added_date)
        return d >= startDate && d <= endDate
      })
      .map((r) => mapReading(r, fanState, heaterState))

    return NextResponse.json(mapped)
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch sensor data" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)

  const body = await request.json()

  try {
    // Proxy to Express backend /insert
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081"
    const res = await fetch(`${BACKEND_URL}/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: body.temperature,
        humidity: body.humidity,
        airQuality: body.air_quality ?? body.airQuality,
      }),
    })
    if (!res.ok) throw new Error("Backend rejected the reading")
    const data = await res.json()
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save reading" },
      { status: 500 },
    )
  }
}

// PUT and DELETE are not supported by the Express backend — return 400
export async function PUT() {
  return NextResponse.json({ error: "Updates not supported" }, { status: 400 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Deletes not supported" }, { status: 400 })
}
