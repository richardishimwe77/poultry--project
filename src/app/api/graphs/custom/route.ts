import { NextRequest, NextResponse } from "next/server"
import { fetchSensorReadings } from "@/lib/supabase"
import { getDateRange } from "@/lib/date-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end query parameters are required" },
        { status: 400 },
      )
    }

    const { startDate, endDate } = getDateRange("custom", start, end)
    const readings = await fetchSensorReadings(startDate, endDate)
    return NextResponse.json(readings)
  } catch {
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 })
  }
}
