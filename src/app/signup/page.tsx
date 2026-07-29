"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Warehouse } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => router.push("/login"), 3000)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Warehouse className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">Poultry Farm</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Sign-up Disabled</h2>
          <p className="text-gray-500 text-sm mb-4">
            New account registration is not available. Use the preconfigured admin credentials to sign in.
          </p>
          <p className="text-gray-400 text-xs">Redirecting to sign in...</p>
        </div>
      </div>
    </div>
  )
}
