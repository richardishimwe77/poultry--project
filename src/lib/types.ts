// ---- Houses ----
export interface House {
  id: string
  name: string
  location: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ---- Admin ----
export interface Admin {
  id: string
  email: string
  name: string
  role: "admin" | "superadmin"
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AdminInput {
  email: string
  password?: string
  password_hash?: string
  name?: string
  role?: "admin" | "superadmin"
  is_verified?: boolean
  verification_token?: string
  reset_token?: string
  reset_token_expires?: string
}

// ---- Sensor Readings ----
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

export interface SensorReadingInput {
  house_id?: string
  temperature: number
  humidity: number
  air_quality: number
  fan_status?: boolean
  heater_status?: boolean
  created_by?: string
}

// ---- Logs ----
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
