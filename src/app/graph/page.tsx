"use client"

import { useCallback, useEffect, useState } from "react"
import type { ChartDataPoint, FilterPeriod, SensorReading, House } from "@/lib/types"
import { computeStats, readingsToChartData } from "@/lib/utils"
import { FilterBar } from "@/components/FilterBar"
import { StatisticsPanel } from "@/components/StatisticsPanel"
import { SensorChart } from "@/components/SensorChart"
import { FileText, Thermometer, Droplets, Wind } from "lucide-react"
import { fetchHouses, fetchSensorReadings } from "@/lib/api"

export default function GraphPage() {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [filter, setFilter] = useState<FilterPeriod>("daily")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouse, setSelectedHouse] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"temperature" | "humidity" | "airQuality">("temperature")

  useEffect(() => {
    fetchHouses()
      .then((data) => {
        if (Array.isArray(data)) {
          setHouses(data)
          if (data.length > 0 && !selectedHouse) setSelectedHouse(data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const fetchData = useCallback(
    async (period: FilterPeriod, houseId: string, start?: string, end?: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.set("filter", period)
        if (houseId) params.set("house_id", houseId)
        if (period === "custom" && start && end) {
          params.set("start", start)
          params.set("end", end)
        }
        const data: SensorReading[] = await fetchSensorReadings(params)
        setReadings(data)
        setChartData(readingsToChartData(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setReadings([])
        setChartData([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (selectedHouse) fetchData(filter, selectedHouse, customStart || undefined, customEnd || undefined)
  }, [fetchData, filter, selectedHouse, customStart, customEnd])

  const handleFilterChange = useCallback((newFilter: FilterPeriod) => {
    setFilter(newFilter)
    if (newFilter !== "custom") {
      setCustomStart("")
      setCustomEnd("")
    }
  }, [])

  const handleCustomRange = useCallback((start: string, end: string) => {
    setCustomStart(start)
    setCustomEnd(end)
  }, [])

  const temperatureStats = computeStats(chartData.map((d) => d.temperature))
  const humidityStats = computeStats(chartData.map((d) => d.humidity))
  const airQualityStats = computeStats(chartData.map((d) => d.airQuality))

  const filterLabel =
    filter === "custom" && customStart && customEnd
      ? `${customStart} to ${customEnd}`
      : filter.charAt(0).toUpperCase() + filter.slice(1)

  const tabs = [
    { key: "temperature" as const, label: "Temperature", icon: Thermometer, color: "text-blue-600", border: "border-blue-600" },
    { key: "humidity" as const, label: "Humidity", icon: Droplets, color: "text-cyan-600", border: "border-cyan-600" },
    { key: "airQuality" as const, label: "Air Quality", icon: Wind, color: "text-amber-600", border: "border-amber-600" },
  ]

  const statMap = {
    temperature: temperatureStats,
    humidity: humidityStats,
    airQuality: airQualityStats,
  }

  const chartConfig = {
    temperature: { title: "Temperature History", color: "#2563eb", unit: "°C" },
    humidity: { title: "Humidity History", color: "#06b6d4", unit: "%" },
    airQuality: { title: "Air Quality History", color: "#f59e0b", unit: "PPM" },
  }

  const openPdfViewer = () => {
    const params = new URLSearchParams({ filter })
    if (selectedHouse) params.set("house_id", selectedHouse)
    if (customStart) params.set("start", customStart)
    if (customEnd) params.set("end", customEnd)
    window.open(`/report/graph?${params}`, "_blank")
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sensor Graphs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filterLabel} &middot; {chartData.length} readings
            {houses.find((h) => h.id === selectedHouse)?.name && ` &middot; ${houses.find((h) => h.id === selectedHouse)?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {houses.length > 1 && (
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={openPdfViewer}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <FileText size={16} />
            PDF Viewer
          </button>
        </div>
      </div>

      <FilterBar active={filter} onFilterChange={handleFilterChange} onCustomRange={handleCustomRange} />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-6 text-center">
          <p className="text-yellow-700 font-medium">No sensor readings found for this period.</p>
          <p className="text-yellow-600 text-sm mt-1">Try selecting a wider date range.</p>
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <>
          {/* Tabbed navigation */}
          <div className="flex border-b border-gray-200 mb-6 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? `${tab.color} ${tab.border}`
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Active chart */}
          <div className="mb-2">
            <StatisticsPanel
              title={activeTab === "temperature" ? "Temperature" : activeTab === "humidity" ? "Humidity" : "Air Quality"}
              stats={statMap[activeTab]}
              unit={chartConfig[activeTab].unit}
            />
          </div>
          <SensorChart
            key={activeTab}
            data={chartData}
            readings={readings}
            title={chartConfig[activeTab].title}
            dataKey={activeTab}
            color={chartConfig[activeTab].color}
            unit={chartConfig[activeTab].unit}
          />
        </>
      )}
    </div>
  )
}
