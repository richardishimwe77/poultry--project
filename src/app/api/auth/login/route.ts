import { NextRequest, NextResponse } from "next/server"
import { comparePassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { getAdminEmail } from "@/lib/backend-api"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Check against presaved .env credentials
    const validEmail = email === getAdminEmail()
    const validPassword = await comparePassword(password)

    if (!validEmail || !validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = signToken({
      userId: "admin-1",
      email: getAdminEmail(),
      role: "admin",
    })

    const user = {
      id: "admin-1",
      email: getAdminEmail(),
      name: "Admin",
      role: "admin" as const,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const response = NextResponse.json({ user, token })
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 })
  }
}
