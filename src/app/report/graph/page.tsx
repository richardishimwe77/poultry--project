"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { SensorReading, ChartDataPoint, House } from "@/lib/types"
import { computeStats, readingsToChartData } from "@/lib/utils"
import { Download, Printer, ArrowLeft, Warehouse } from "lucide-react"

function GraphReportContent() {
  const searchParams = useSearchParams()
  const reportRef = useRef<HTMLDivElement>(null)
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [house, setHouse] = useState<House | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const filter = searchParams.get("filter") || "daily"
  const houseId = searchParams.get("house_id")
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ filter })
        if (houseId) params.set("house_id", houseId)
        if (start && end) { params.set("start", start); params.set("end", end) }

        const [res, housesRes] = await Promise.all([
          fetch(`/api/sensor-readings?${params}`),
          fetch("/api/houses"),
        ])

        const data: SensorReading[] = await res.json()
        setReadings(data)
        setChartData(readingsToChartData(data))

        const housesData: House[] = await housesRes.json()
        if (houseId) setHouse(housesData.find((h: House) => h.id === houseId) || null)
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [filter, houseId, start, end])

  const tempStats = computeStats(chartData.map((d) => d.temperature))
  const humStats = computeStats(chartData.map((d) => d.humidity))
  const airStats = computeStats(chartData.map((d) => d.airQuality))

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current) return
    setGeneratingPdf(true)
    try {
      const { default: html2pdf } = await import("html2pdf.js")
      await html2pdf().set({
        margin: 10,
        filename: `poultry-report-${filter}-${Date.now()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      }).from(reportRef.current).save()
    } catch {}
    setGeneratingPdf(false)
  }, [filter])

  const handlePrint = useCallback(() => window.print(), [])

  const filterLabel = filter.charAt(0).toUpperCase() + filter.slice(1)
  const periodText = filter === "custom" && start && end ? `${start} to ${end}` : filterLabel

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toolbar — visible on screen, hidden when printing */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/graph" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
              <ArrowLeft size={16} />
              Back
            </a>
            <span className="text-gray-300">|</span>
            <Warehouse size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800">Poultry Farm Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <Download size={16} />
              {generatingPdf ? "Generating..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="max-w-5xl mx-auto p-4 md:p-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Sensor Report</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Period: {periodText} &middot; {chartData.length} readings
                    {house && ` &middot; House: ${house.name}`}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>Generated: {new Date().toLocaleDateString()}</p>
                  <p>{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No readings for this period.</p>
              </div>
            ) : (
              <>
                {/* Temperature */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm break-inside-avoid">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Temperature</h2>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Current", value: tempStats.current, color: "text-blue-600" },
                      { label: "Average", value: tempStats.average, color: "text-green-600" },
                      { label: "Highest", value: tempStats.highest, color: "text-red-600" },
                      { label: "Lowest", value: tempStats.lowest, color: "text-purple-600" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}°C</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v}°C`} />
                      <Tooltip formatter={(value) => [`${value}°C`, "Temperature"]} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="temperature" stroke="#2563eb" strokeWidth={2} dot={false} name="Temperature" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Humidity */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm break-inside-avoid">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Humidity</h2>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Current", value: humStats.current, color: "text-cyan-600" },
                      { label: "Average", value: humStats.average, color: "text-green-600" },
                      { label: "Highest", value: humStats.highest, color: "text-red-600" },
                      { label: "Lowest", value: humStats.lowest, color: "text-purple-600" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}%</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, "Humidity"]} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={false} name="Humidity" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Air Quality */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm break-inside-avoid">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Air Quality</h2>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[
                      { label: "Current", value: airStats.current, color: "text-amber-600" },
                      { label: "Average", value: airStats.average, color: "text-green-600" },
                      { label: "Highest", value: airStats.highest, color: "text-red-600" },
                      { label: "Lowest", value: airStats.lowest, color: "text-purple-600" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xs text-gray-500 uppercase">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value} PPM</p>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v}PPM`} />
                      <Tooltip formatter={(value) => [`${value}PPM`, "Air Quality"]} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="airQuality" stroke="#f59e0b" strokeWidth={2} dot={false} name="Air Quality" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Readings Table */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Raw Readings</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">Time</th>
                          <th className="text-right py-2 px-3 text-gray-500 font-medium">Temp (°C)</th>
                          <th className="text-right py-2 px-3 text-gray-500 font-medium">Humidity (%)</th>
                          <th className="text-right py-2 px-3 text-gray-500 font-medium">Air (PPM)</th>
                          <th className="text-center py-2 px-3 text-gray-500 font-medium">Fan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readings.slice(-50).map((r) => (
                          <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700">
                              {new Date(r.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700">{r.temperature}</td>
                            <td className="py-2 px-3 text-right text-gray-700">{r.humidity}</td>
                            <td className="py-2 px-3 text-right text-gray-700">{r.air_quality}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${r.fan_status ? "bg-green-500" : "bg-gray-300"}`} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function GraphReportPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GraphReportContent />
    </Suspense>
  )
}
