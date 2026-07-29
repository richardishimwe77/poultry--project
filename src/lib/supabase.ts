import { createClient } from "@supabase/supabase-js"
import type {
  SensorReading,
  SensorReadingInput,
  LogEntry,
  LogInput,
  Admin,
  AdminInput,
  House,
} from "./types"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase env vars not configured")
  return createClient(url, key)
}

// ============================
// HOUSES
// ============================
export async function fetchHouses(): Promise<House[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("houses")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return (data as House[]) || []
}

export async function fetchHouse(id: string): Promise<House | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("houses")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as House
}

export async function createHouse(input: Pick<House, "name" | "location">): Promise<House> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("houses")
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as House
}

export async function updateHouse(id: string, updates: Partial<House>): Promise<House> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("houses")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as House
}

export async function deleteHouse(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("houses").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

// ============================
// SENSOR READINGS
// ============================
export async function fetchSensorReadings(
  startDate: Date,
  endDate: Date,
  houseId?: string,
): Promise<SensorReading[]> {
  const supabase = getSupabaseClient()
  let query = supabase
    .from("sensor_readings")
    .select("*")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true })

  if (houseId) query = query.eq("house_id", houseId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as SensorReading[]) || []
}

export async function createSensorReading(input: SensorReadingInput): Promise<SensorReading> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("sensor_readings")
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SensorReading
}

export async function deleteSensorReading(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("sensor_readings").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function updateSensorReading(
  id: string,
  updates: Partial<SensorReading>,
): Promise<SensorReading> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("sensor_readings")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as SensorReading
}

// ============================
// ADMIN
// ============================
export async function fetchAdmins(): Promise<Admin[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data as Admin[]) || []
}

export async function createAdmin(input: AdminInput): Promise<Admin> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("admin")
    .insert({
      email: input.email,
      password_hash: input.password_hash,
      name: input.name || input.email.split("@")[0],
      role: input.role || "admin",
      is_verified: input.is_verified ?? false,
      verification_token: input.verification_token,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Admin
}

export async function updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("admin")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Admin
}

export async function deleteAdmin(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("admin").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function findAdminByEmail(email: string): Promise<Admin | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .eq("email", email)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Admin | null
}

export async function findAdminById(id: string): Promise<Admin | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as Admin | null
}

// ============================
// LOGS
// ============================
export async function fetchLogs(limit = 100, houseId?: string): Promise<LogEntry[]> {
  const supabase = getSupabaseClient()
  let query = supabase
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (houseId) query = query.eq("house_id", houseId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as LogEntry[]) || []
}

export async function createLog(input: LogInput): Promise<LogEntry> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("logs")
    .insert(input)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as LogEntry
}

export async function deleteLog(id: string) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from("logs").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function fetchLogsByAdmin(adminId: string, limit = 50): Promise<LogEntry[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("logs")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data as LogEntry[]) || []
}
