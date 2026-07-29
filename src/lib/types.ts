// ---- Houses ----
export interface House {
  id: string
  name: string
  location: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---- Admin (simplified — no verification tokens, no SMTP) ----
export interface Admin {
  id: string
  email: string
  name: string
  role: "admin" | "superadmin"
  is_verified: boolean
  created_at: string
  updated_at: string
}

// ---- Sensor Readings (mapped from Express backend) ----
export interface SensorReading {
  id: string
  house_id: string | null
  temperature: number
  humidity: number
  air_quality: number
  fan_status: boolean
  heater_status: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

// ---- Chart / Filter ----
export type FilterPeriod = "today" | "daily" | "weekly" | "monthly" | "yearly" | "custom"

export interface ChartDataPoint {
  time: string
  temperature: number
  humidity: number
  airQuality: number
}

export interface SensorStats {
  current: number
  average: number
  highest: number
  lowest: number
}

// ---- Auth ----
export interface AuthResponse {
  user: Omit<Admin, "password_hash"> | null
  token: string
  error?: string
}

// ---- Logs (simplified — no dedicated backend table) ----
export interface LogEntry {
  id: string
  admin_id: string | null
  house_id: string | null
  message: string
  type: "info" | "warning" | "error"
  metadata?: Record<string, unknown>
  created_at: string
}

export interface LogInput {
  admin_id?: string
  house_id?: string
  message: string
  type?: "info" | "warning" | "error"
  metadata?: Record<string, unknown>
}
