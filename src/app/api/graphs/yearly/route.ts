import { NextResponse } from "next/server"
import { fetchSensorReadings } from "@/lib/supabase"
import { getDateRange } from "@/lib/date-utils"

export async function GET() {
  try {
    const { startDate, endDate } = getDateRange("yearly")
    const readings = await fetchSensorReadings(startDate, endDate)
    return NextResponse.json(readings)
  } catch {
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 })
  }
}
