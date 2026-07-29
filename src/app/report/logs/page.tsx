"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, Printer, ArrowLeft, Warehouse, AlertTriangle, Info, AlertCircle } from "lucide-react"
import type { LogEntry } from "@/lib/types"
import { fetchLogs } from "@/lib/api"

const iconMap = { info: Info, warning: AlertTriangle, error: AlertCircle }
const badgeMap = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

export default function LogsReportPage() {
  const reportRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchLogs()
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const displayed = filter === "all" ? logs : logs.filter((l) => l.type === filter)

  const handleDownloadPdf = useCallback(async () => {
    if (!reportRef.current) return
    setGeneratingPdf(true)
    try {
      const { default: html2pdf } = await import("html2pdf.js")
      await html2pdf().set({
        margin: 10,
        filename: `poultry-logs-report-${Date.now()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      }).from(reportRef.current).save()
    } catch {}
    setGeneratingPdf(false)
  }, [])

  const handlePrint = useCallback(() => window.print(), [])

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/logs" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
              <ArrowLeft size={16} />
              Back
            </a>
            <span className="text-gray-300">|</span>
            <Warehouse size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-800">Poultry Farm — Logs Report</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
              <Printer size={16} /> Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <Download size={16} /> {generatingPdf ? "Generating..." : "Download PDF"}
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
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">System Logs Report</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {displayed.length} entries &middot;{" "}
                    {logs.filter((l) => l.type === "error").length} errors &middot;{" "}
                    {logs.filter((l) => l.type === "warning").length} warnings
                  </p>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <p>Generated: {new Date().toLocaleDateString()}</p>
                  <p>{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Info", count: logs.filter((l) => l.type === "info").length, color: "text-blue-600 bg-blue-50" },
                { label: "Warnings", count: logs.filter((l) => l.type === "warning").length, color: "text-amber-600 bg-amber-50" },
                { label: "Errors", count: logs.filter((l) => l.type === "error").length, color: "text-red-600 bg-red-50" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border border-gray-200 p-4 shadow-sm ${s.color}`}>
                  <p className="text-xs uppercase font-medium">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.count}</p>
                </div>
              ))}
            </div>

            {/* Log Entries */}
            {displayed.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-gray-500">No log entries found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayed.map((log) => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeMap[log.type]}`}>
                      {log.type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                        {log.admin_id && ` · Admin: ${log.admin_id.slice(0, 8)}...`}
                        {log.house_id && ` · House: ${log.house_id.slice(0, 8)}...`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
