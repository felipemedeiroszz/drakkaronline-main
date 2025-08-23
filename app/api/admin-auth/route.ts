import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ success: false, error: "Password is required" }, { status: 400 })
    }

    const adminPassword = await DatabaseService.getAdminPassword()

    if (password === adminPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
