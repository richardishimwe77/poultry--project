import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Sign-up is disabled. Use the preconfigured admin credentials." },
    { status: 400 },
  )
}
