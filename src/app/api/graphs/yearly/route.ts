import { NextResponse } from "next/server"
import { fetchReadings, fetchControls } from "@/lib/backend-api"
import { getDateRange } from "@/lib/date-utils"

export async function GET() {
  try {
    const [readings, controls] = await Promise.all([fetchReadings(), fetchControls()])
    const fanState = controls.find((c) => c.gpio === "19")?.state === 1
    const heaterState = controls.find((c) => c.gpio === "14")?.state === 1
    const { startDate, endDate } = getDateRange("yearly")
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
