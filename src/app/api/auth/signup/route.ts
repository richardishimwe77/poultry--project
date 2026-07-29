import { NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { sendVerificationEmail } from "@/lib/auth/email"
import { createAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const password_hash = await hashPassword(password)
    const verification_token = crypto.randomUUID()

    const admin = await createAdmin({
      email,
      password_hash,
      name: name || email.split("@")[0],
      role: "admin",
      is_verified: false,
      verification_token,
    })

    await sendVerificationEmail(email, verification_token)

    const token = signToken({ userId: admin.id, email: admin.email, role: admin.role })

    const { password_hash: _, ...user } = admin as any

    const response = NextResponse.json({ user, token }, { status: 201 })
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (err: any) {
    if (err.message?.includes("duplicate key") || err.message?.includes("already exists")) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }
    return NextResponse.json({ error: err.message || "Signup failed" }, { status: 500 })
  }
}
