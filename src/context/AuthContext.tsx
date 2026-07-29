"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Admin } from "@/lib/types"
import { fetchCurrentUser, loginRequest, logoutRequest } from "@/lib/api"
import { clearStoredToken, setStoredToken } from "@/lib/auth-storage"

interface AuthContextValue {
  user: Omit<Admin, "password_hash"> | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string, name?: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<Admin, "password_hash"> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentUser()
      .then((data) => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {
        clearStoredToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const data = await loginRequest(email, password)
      setStoredToken(data.token)
      setUser(data.user)
      return null
    } catch (error) {
      clearStoredToken()
      setUser(null)
      return error instanceof Error ? error.message : "Login failed"
    }
  }, [])

  const signup = useCallback(async (_email: string, _password: string, _name?: string): Promise<string | null> => {
    return "Sign-up is disabled. Use the preconfigured admin credentials."
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {}
    clearStoredToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
