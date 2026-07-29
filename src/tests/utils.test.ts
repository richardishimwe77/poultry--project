import { describe, it, expect } from "vitest"
import { computeStats, readingsToChartData } from "@/lib/utils"
import type { SensorReading } from "@/lib/types"

describe("computeStats", () => {
  it("returns zeros for empty array", () => {
    const stats = computeStats([])
    expect(stats).toEqual({ current: 0, average: 0, highest: 0, lowest: 0 })
  })

  it("computes correct stats", () => {
    const stats = computeStats([25, 30, 35, 20])
    expect(stats.current).toBe(20)
    expect(stats.average).toBe(27.5)
    expect(stats.highest).toBe(35)
    expect(stats.lowest).toBe(20)
  })

  it("handles single value", () => {
    const stats = computeStats([30])
    expect(stats.current).toBe(30)
    expect(stats.average).toBe(30)
    expect(stats.highest).toBe(30)
    expect(stats.lowest).toBe(30)
  })
})

describe("readingsToChartData", () => {
  it("converts readings to chart data points", () => {
    const readings: SensorReading[] = [
      {
        id: "1",
        house_id: null,
        temperature: 25,
        humidity: 60,
        air_quality: 300,
        fan_status: true,
        created_by: null,
        created_at: "2026-07-30T10:00:00Z",
        updated_at: "2026-07-30T10:00:00Z",
      },
      {
        id: "2",
        house_id: null,
        temperature: 26,
        humidity: 58,
        air_quality: 310,
        fan_status: false,
        created_by: null,
        created_at: "2026-07-30T11:00:00Z",
        updated_at: "2026-07-30T11:00:00Z",
      },
    ]
    const result = readingsToChartData(readings)
    expect(result).toHaveLength(2)
    expect(result[0].temperature).toBe(25)
    expect(result[0].humidity).toBe(60)
    expect(result[0].airQuality).toBe(300)
    expect(result[1].temperature).toBe(26)
  })

  it("returns empty array for empty readings", () => {
    expect(readingsToChartData([])).toEqual([])
  })
})
