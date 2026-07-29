import { NextRequest, NextResponse } from "next/server"
import { createSensorReading, createLog, fetchHouses } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    let house_id = body.house_id || null

    if (!house_id) {
      const houses = await fetchHouses()
      if (houses.length > 0) house_id = houses[0].id
    }

    const reading = await createSensorReading({
      house_id,
      temperature: body.temperature,
      humidity: body.humidity,
      air_quality: body.air_quality,
      fan_status: body.fan_status ?? false,
      heater_status: body.heater_status ?? false,
    })

    await createLog({
      house_id,
      message: `Sensor reading: ${body.temperature}°C, ${body.humidity}%, ${body.air_quality}PPM`,
      type: "info",
      metadata: { source: "esp32", reading_id: reading.id },
    })

    return NextResponse.json(reading, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save reading" }, { status: 500 })
  }
}
