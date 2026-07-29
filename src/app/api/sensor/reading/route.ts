import { NextRequest, NextResponse } from "next/server"
import { postReading } from "@/lib/backend-api"

// This route is used by the ESP32 to POST sensor readings.
// Proxy straight to the Express backend.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    await postReading({
      temperature: body.temperature,
      humidity: body.humidity,
      airQuality: body.airQuality ?? body.air_quality ?? 0,
    })

    return NextResponse.json({ message: "Recorded data inserted successfully" }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save reading" },
      { status: 500 },
    )
  }
}
