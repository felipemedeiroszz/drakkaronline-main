import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const { dealerId } = await request.json()

    if (!dealerId) {
      return NextResponse.json({ success: false, error: "Dealer ID is required" }, { status: 400 })
    }

    const dealer = await DatabaseService.getDealerById(dealerId)

    if (!dealer) {
      return NextResponse.json({ success: false, error: "Dealer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: dealer }, { status: 200 })
  } catch (error) {
    console.error("Error fetching dealer details:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
