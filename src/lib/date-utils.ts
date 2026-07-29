import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns"
import type { FilterPeriod } from "./types"

export function getDateRange(filter: FilterPeriod, start?: string, end?: string) {
  const now = new Date()

  switch (filter) {
    case "today": {
      return { startDate: startOfDay(now), endDate: endOfDay(now) }
    }
    case "daily": {
      return { startDate: subDays(startOfDay(now), 1), endDate: endOfDay(now) }
    }
    case "weekly": {
      return { startDate: subDays(startOfDay(now), 7), endDate: endOfDay(now) }
    }
    case "monthly": {
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    }
    case "yearly": {
      return { startDate: startOfYear(now), endDate: endOfYear(now) }
    }
    case "custom": {
      if (start && end) {
        return { startDate: new Date(start), endDate: new Date(end) }
      }
      return { startDate: subDays(startOfDay(now), 7), endDate: endOfDay(now) }
    }
    default: {
      return { startDate: subDays(startOfDay(now), 7), endDate: endOfDay(now) }
    }
  }
}
