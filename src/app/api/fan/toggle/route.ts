import { NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/auth/middleware"
import { fetchSensorReadings, updateSensorReading, createLog } from "@/lib/supabase"
import { subDays, startOfDay, endOfDay } from "date-fns"

export async function POST(request: NextRequest) {
  const auth = authenticateRequest(request)
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { house_id } = await request.json()

    const now = new Date()
    const readings = await fetchSensorReadings(
      subDays(startOfDay(now), 1),
      endOfDay(now),
      house_id || undefined,
    )

    const latest = readings[readings.length - 1]
    if (!latest) {
      return NextResponse.json({ error: "No readings found" }, { status: 404 })
    }

    const temp = latest.temperature

    if (temp > 34) {
      return NextResponse.json({ error: "Temperature > 34°C — fan auto-forced ON" }, { status: 400 })
    }

    const newStatus = !latest.fan_status

    const updated = await updateSensorReading(latest.id, { fan_status: newStatus })

    await createLog({
      admin_id: auth.userId,
      house_id: latest.house_id ?? undefined,
      message: `Fan ${newStatus ? "turned ON" : "turned OFF"} manually by ${auth.email}`,
      type: "info",
      metadata: { action: "fan_toggle", previous: latest.fan_status, new: newStatus },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to toggle fan" }, { status: 500 })
  }
}
