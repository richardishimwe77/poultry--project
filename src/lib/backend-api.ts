// Shared utility for calling the Express backend
// Replaces all Supabase data access

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8081"

export interface BackendReading {
  id: number
  temperature: number
  humidity: number
  gaz: number
  added_date: string
}

export interface BackendControl {
  gpio: string
  state: number
}

// ──────────────────────────────────────────
//  Sensor readings
// ──────────────────────────────────────────

export async function fetchReadings(): Promise<BackendReading[]> {
  const res = await fetch(`${BACKEND_URL}/data`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch readings")
  return res.json()
}

export async function fetchAverage(): Promise<{ temperature: number; humidity: number; ammonia: number }> {
  const res = await fetch(`${BACKEND_URL}/average`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch averages")
  const data = await res.json()
  return data[0] || { temperature: 0, humidity: 0, ammonia: 0 }
}

export async function postReading(data: {
  temperature: number
  humidity: number
  airQuality: number
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/insert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to post reading")
}

// ──────────────────────────────────────────
//  Controls (fan = GPIO 19, heater = GPIO 14)
// ──────────────────────────────────────────

export async function fetchControls(): Promise<BackendControl[]> {
  const res = await fetch(`${BACKEND_URL}/fetchcontrols`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch controls")
  return res.json()
}

/** Get the current state of a single GPIO (0 or 1). */
export async function getControlState(gpio: string): Promise<number> {
  const controls = await fetchControls()
  const ctrl = controls.find((c) => c.gpio === gpio)
  return ctrl?.state ?? 0
}

/** Toggle or set a GPIO control. Returns the new state. */
export async function setControlState(gpio: string, state: 0 | 1): Promise<number> {
  const res = await fetch(`${BACKEND_URL}/controls?gpio=${gpio}&state=${state}`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Failed to set GPIO ${gpio}`)
  const data = await res.json()
  return data.on
}

// ──────────────────────────────────────────
//  Auth helpers
// ──────────────────────────────────────────

/** Password from VITE-style env (or ADMIN_PASSWORD). */
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || process.env.VITE_PASSWORD || "123"
}

export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || "admin@poultry.com"
}
