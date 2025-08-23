import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET() {
  try {
    const email = await DatabaseService.getNotificationEmail()

    return NextResponse.json({
      success: true,
      email: email,
    })
  } catch (error: any) {
    console.error("Error fetching notification email:", error)

    // Handle different types of errors
    if (error.message?.includes("Rate limit") || error.message?.includes("Too Many")) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      )
    }

    if (error.message?.includes("Network error")) {
      return NextResponse.json(
        { success: false, error: "Network error. Please check your connection." },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notification email" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    await DatabaseService.updateNotificationEmail(email)

    return NextResponse.json({
      success: true,
      message: "Notification email updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating notification email:", error)

    // Handle different types of errors
    if (error.message?.includes("Rate limit") || error.message?.includes("Too Many")) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      )
    }

    if (error.message?.includes("Network error")) {
      return NextResponse.json(
        { success: false, error: "Network error. Please check your connection." },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification email" },
      { status: 500 },
    )
  }
}
