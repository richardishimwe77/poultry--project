import type { AuthResponse, House, LogEntry, SensorReading } from "@/lib/types"
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081").replace(/\/$/, "")

class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(init.headers)

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json")
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken()
    }

    throw new ApiError(data?.error || data?.message || "Request failed", response.status)
  }

  return data as T
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchCurrentUser() {
  return apiFetch<{ user: AuthResponse["user"] }>("/auth/me")
}

export async function logoutRequest() {
  return apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" })
}

export async function fetchHouses() {
  return apiFetch<House[]>("/houses")
}

export async function fetchLogs() {
  return apiFetch<LogEntry[]>("/logs")
}

export async function fetchSensorReadings(params: URLSearchParams) {
  return apiFetch<SensorReading[]>(`/sensor-readings?${params.toString()}`)
}

export async function toggleFan() {
  return apiFetch<{ on: number; gpio: string }>("/fan/toggle", { method: "POST" })
}

export async function toggleHeater() {
  return apiFetch<{ on: number; gpio: string }>("/heater/toggle", { method: "POST" })
}
