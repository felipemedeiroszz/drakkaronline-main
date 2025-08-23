import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    const adminPassword = await DatabaseService.getAdminPassword()

    if (currentPassword !== adminPassword) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 })
    }

    await DatabaseService.updateAdminPassword(newPassword)

    return NextResponse.json({ success: true, message: "Password updated successfully!" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
