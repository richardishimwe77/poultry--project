import { NextRequest, NextResponse } from "next/server"
import { fetchReadings, fetchControls } from "@/lib/backend-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json({ error: "start and end query parameters are required" }, { status: 400 })
    }

    const [readings, controls] = await Promise.all([fetchReadings(), fetchControls()])
    const fanState = controls.find((c) => c.gpio === "19")?.state === 1
    const heaterState = controls.find((c) => c.gpio === "14")?.state === 1

    const startDate = new Date(start)
    const endDate = new Date(end)

    const mapped = readings
      .filter((r) => { const d = new Date(r.added_date); return d >= startDate && d <= endDate })
      .map((r) => ({
        id: String(r.id), house_id: null, temperature: r.temperature, humidity: r.humidity,
        air_quality: r.gaz, fan_status: fanState, heater_status: heaterState, created_by: null,
        created_at: r.added_date, updated_at: r.added_date,
      }))
    return NextResponse.json(mapped)
  } catch { return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 }) }
}
