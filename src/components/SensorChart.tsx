"use client"

import { useCallback, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts"
import type { ChartDataPoint } from "@/lib/types"
import { exportCSV, exportPNG, printChart } from "@/lib/utils"
import type { SensorReading } from "@/lib/types"
import { Download, Image, Printer } from "lucide-react"

interface Props {
  data: ChartDataPoint[]
  readings: SensorReading[]
  title: string
  dataKey: "temperature" | "humidity" | "airQuality"
  color: string
  unit: string
}

export function SensorChart({
  data,
  readings,
  title,
  dataKey,
  color,
  unit,
}: Props) {
  const chartId = `chart-${dataKey}`
  const [zoomLeft, setZoomLeft] = useState<number | null>(null)
  const [zoomRight, setZoomRight] = useState<number | null>(null)
  const [zoomedData, setZoomedData] = useState<ChartDataPoint[] | null>(null)
  const [refAreaLeft, setRefAreaLeft] = useState<string>("")
  const [refAreaRight, setRefAreaRight] = useState<string>("")

  const handleMouseDown = useCallback((e: { activeLabel?: unknown }) => {
    if (e.activeLabel !== undefined) {
      setRefAreaLeft(String(e.activeLabel))
    }
  }, [])

  const handleMouseMove = useCallback((e: { activeLabel?: unknown }) => {
    if (refAreaLeft && e.activeLabel !== undefined) {
      setRefAreaRight(String(e.activeLabel))
    }
  }, [refAreaLeft])

  const handleMouseUp = useCallback(() => {
    if (refAreaLeft && refAreaRight) {
      const left = Math.min(
        data.findIndex((d) => d.time === refAreaLeft),
        data.findIndex((d) => d.time === refAreaRight),
      )
      const right = Math.max(
        data.findIndex((d) => d.time === refAreaLeft),
        data.findIndex((d) => d.time === refAreaRight),
      )
      if (left !== right) {
        setZoomedData(data.slice(left, right + 1))
        setZoomLeft(left)
        setZoomRight(right)
      }
    }
    setRefAreaLeft("")
    setRefAreaRight("")
  }, [refAreaLeft, refAreaRight, data])

  const resetZoom = useCallback(() => {
    setZoomedData(null)
    setZoomLeft(null)
    setZoomRight(null)
  }, [])

  const displayData = zoomedData || data

  const handleExportCSV = useCallback(() => {
    exportCSV(readings, `${dataKey}_readings.csv`)
  }, [readings, dataKey])

  const handleExportPNG = useCallback(() => {
    exportPNG(chartId, `${dataKey}_chart.png`)
  }, [chartId, dataKey])

  const handlePrint = useCallback(() => {
    printChart(chartId)
  }, [chartId])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-1">
          {zoomedData && (
            <button
              onClick={resetZoom}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Reset Zoom
            </button>
          )}
          <button
            onClick={handleExportPNG}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Export as PNG"
          >
            <Image size={16} />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Export as CSV"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Print Chart"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      <div id={chartId} className="w-full">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={displayData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(v) => `${v}${unit}`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`${value}${unit}`, title]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#6b7280" }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
              animationDuration={500}
              animationEasing="ease-in-out"
              name={title}
            />
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill={color}
                fillOpacity={0.1}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Drag across the chart to zoom in. Click "Reset Zoom" to restore.
      </p>
    </div>
  )
}
