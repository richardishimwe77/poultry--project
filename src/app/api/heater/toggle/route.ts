import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchReadings, setControlState, getControlState } from "@/lib/backend-api"

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { house_id } = await request.json()

    // Get latest temperature for auto-override check
    const readings = await fetchReadings()
    const latest = readings[readings.length - 1]

    if (latest && latest.temperature >= 34) {
      return NextResponse.json(
        { error: "Temperature >= 34°C — heater auto-forced OFF" },
        { status: 400 },
      )
    }
    if (latest && latest.temperature < 30) {
      return NextResponse.json(
        { error: "Temperature < 30°C — heater auto-forced ON" },
        { status: 400 },
      )
    }

    const currentState = await getControlState("14")
    const newState = currentState === 1 ? 0 : 1
    const result = await setControlState("14", newState as 0 | 1)

    return NextResponse.json({ on: result, gpio: "14" })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to toggle heater" },
      { status: 500 },
    )
  }
}
