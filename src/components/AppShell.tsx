"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DashboardNav } from "@/components/DashboardNav"
import { useAuth } from "@/context/AuthContext"

const publicPaths = ["/login", "/signup"]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.replace("/login")
    }
  }, [isPublicPath, loading, router, user])

  if (!isPublicPath && (loading || !user)) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <>
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </>
  )
}
