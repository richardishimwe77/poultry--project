"use client"

import type { SensorStats } from "@/lib/types"

interface Props {
  title: string
  stats: SensorStats
  unit: string
}

export function StatisticsPanel({ title, stats, unit }: Props) {
  const cards = [
    { label: `Current ${title}`, value: stats.current, color: "text-blue-600" },
    { label: `Average ${title}`, value: stats.average, color: "text-green-600" },
    { label: `Highest ${title}`, value: stats.highest, color: "text-red-600" },
    { label: `Lowest ${title}`, value: stats.lowest, color: "text-purple-600" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {card.label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>
            {card.value}
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
