import { NextRequest, NextResponse } from "next/server"
import { comparePassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { findAdminByEmail } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await findAdminByEmail(email)
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const valid = await comparePassword(password, (admin as any).password_hash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = signToken({ userId: admin.id, email: admin.email, role: admin.role })

    const { password_hash: _, ...user } = admin as any

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
