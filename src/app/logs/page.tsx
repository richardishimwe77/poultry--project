"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Info, AlertCircle, Filter, FileText } from "lucide-react"
import type { LogEntry } from "@/lib/types"
import { fetchLogs } from "@/lib/api"

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
}

const colorMap = {
  info: "text-blue-600 bg-blue-50 border-blue-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  error: "text-red-600 bg-red-50 border-red-200",
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchLogs()
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {logs.length} entries &middot; {logs.filter((l) => l.type === "error").length} errors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button
            onClick={() => window.open("/report/logs", "_blank")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <FileText size={16} />
            PDF Viewer
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
          <p className="text-gray-500">No log entries found.</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {filtered.map((log) => {
            const Icon = iconMap[log.type]
            return (
              <div
                key={log.id}
                className={`rounded-xl border p-4 flex items-start gap-3 shadow-sm ${colorMap[log.type]}`}
              >
                <Icon size={20} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{log.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs opacity-70">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    {log.admin_id && (
                      <span className="text-xs opacity-50">admin: {log.admin_id.slice(0, 8)}...</span>
                    )}
                    {log.house_id && (
                      <span className="text-xs opacity-50">house: {log.house_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
