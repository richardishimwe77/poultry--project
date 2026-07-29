"use client"

import type { FilterPeriod } from "@/lib/types"

interface Props {
  active: FilterPeriod
  onFilterChange: (filter: FilterPeriod) => void
  onCustomRange: (start: string, end: string) => void
}

const filters: { key: FilterPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
]

export function FilterBar({ active, onFilterChange, onCustomRange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === f.key
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {f.label}
        </button>
      ))}
      {active === "custom" && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            onChange={(e) => {
              const end = (document.getElementById("custom-end") as HTMLInputElement)?.value
              if (e.target.value && end) onCustomRange(e.target.value, end)
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            id="custom-end"
            type="date"
            onChange={(e) => {
              const start = (document.querySelector<HTMLInputElement>(
                "input[type='date']",
              ))?.value
              if (start && e.target.value) onCustomRange(start, e.target.value)
            }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />
        </div>
      )}
    </div>
  )
}
