import { describe, it, expect } from "vitest"
import { getDateRange } from "@/lib/date-utils"
import { subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

describe("getDateRange", () => {
  it("today filter returns start and end of today", () => {
    const { startDate, endDate } = getDateRange("today")
    const now = new Date()
    expect(startDate.getTime()).toBe(startOfDay(now).getTime())
    expect(endDate.getTime()).toBe(endOfDay(now).getTime())
  })

  it("daily filter returns last 24 hours", () => {
    const { startDate, endDate } = getDateRange("daily")
    const now = new Date()
    expect(startDate.getTime()).toBe(subDays(startOfDay(now), 1).getTime())
    expect(endDate.getTime()).toBe(endOfDay(now).getTime())
  })

  it("weekly filter returns last 7 days", () => {
    const { startDate, endDate } = getDateRange("weekly")
    const now = new Date()
    expect(startDate.getTime()).toBe(subDays(startOfDay(now), 7).getTime())
    expect(endDate.getTime()).toBe(endOfDay(now).getTime())
  })

  it("monthly filter returns current month", () => {
    const { startDate, endDate } = getDateRange("monthly")
    const now = new Date()
    expect(startDate.getTime()).toBe(startOfMonth(now).getTime())
    expect(endDate.getTime()).toBe(endOfMonth(now).getTime())
  })

  it("yearly filter returns current year", () => {
    const { startDate, endDate } = getDateRange("yearly")
    const now = new Date()
    expect(startDate.getTime()).toBe(startOfYear(now).getTime())
    expect(endDate.getTime()).toBe(endOfYear(now).getTime())
  })

  it("custom date range returns correct dates", () => {
    const { startDate, endDate } = getDateRange("custom", "2026-01-01", "2026-01-31")
    expect(startDate.toISOString()).toBe(new Date("2026-01-01").toISOString())
    expect(endDate.toISOString()).toBe(new Date("2026-01-31").toISOString())
  })
})
