import { NextRequest, NextResponse } from "next/server"

// Admin management is handled through the Express backend / .env credentials.
// This route is disabled.

export async function GET() {
  return NextResponse.json({ error: "Admin management is disabled" }, { status: 400 })
}

export async function POST() {
  return NextResponse.json({ error: "Admin management is disabled" }, { status: 400 })
}

export async function PUT() {
  return NextResponse.json({ error: "Admin management is disabled" }, { status: 400 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Admin management is disabled" }, { status: 400 })
}
