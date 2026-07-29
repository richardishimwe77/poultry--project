import type { ChartDataPoint, SensorReading, SensorStats } from "./types"
import { format } from "date-fns"

export function readingsToChartData(readings: SensorReading[]): ChartDataPoint[] {
  return readings.map((r) => ({
    time: format(new Date(r.created_at), "MMM dd HH:mm"),
    temperature: r.temperature,
    humidity: r.humidity,
    airQuality: r.air_quality,
  }))
}

export function computeStats(values: number[]): SensorStats {
  if (values.length === 0) {
    return { current: 0, average: 0, highest: 0, lowest: 0 }
  }
  return {
    current: values[values.length - 1],
    average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
    highest: Math.max(...values),
    lowest: Math.min(...values),
  }
}

export function exportCSV(readings: SensorReading[], filename: string) {
  const header = "id,temperature,humidity,air_quality,fan_status,created_at"
  const rows = readings.map((r) =>
    `${r.id},${r.temperature},${r.humidity},${r.air_quality},${r.fan_status},${r.created_at}`,
  )
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPNG(elementId: string, filename: string) {
  const { toPng } = await import("html-to-image")
  const node = document.getElementById(elementId)
  if (!node) return
  const dataUrl = await toPng(node, { backgroundColor: "#ffffff" })
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  link.click()
}

export function printChart(elementId: string) {
  const node = document.getElementById(elementId)
  if (!node) return
  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(
    `<html><head><title>Print Chart</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh}img{max-width:100%}</style></head><body>`,
  )
  import("html-to-image").then(({ toPng }) => {
    toPng(node, { backgroundColor: "#ffffff" }).then((dataUrl) => {
      win.document.write(`<img src="${dataUrl}" />`)
      win.document.write("</body></html>")
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 500)
    })
  })
}
