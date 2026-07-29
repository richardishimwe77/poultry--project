// Simple password check against presaved .env credentials
// No bcrypt needed — just compare against ADMIN_PASSWORD env var

import { getAdminPassword } from "@/lib/backend-api"

export async function comparePassword(password: string, _hash?: string): Promise<boolean> {
  return password === getAdminPassword()
}

// stub — unused but kept to avoid import errors
export async function hashPassword(_password: string): Promise<string> {
  return ""
}
