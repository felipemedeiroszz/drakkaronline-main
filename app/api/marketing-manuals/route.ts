export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

let db: DatabaseService | null = null
try {
  db = new DatabaseService()
} catch (error) {
  // Environment variables not available during build
  console.log("DatabaseService not available during build")
}

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const manuals = await db.getMarketingManuals()
    return NextResponse.json({ success: true, data: manuals })
  } catch (error) {
    console.error("Error fetching marketing manuals:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch marketing manuals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const manual = await request.json()

    // Validate required fields
    if (!manual.name_en || !manual.name_pt || !manual.url) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await db.saveMarketingManual(manual)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error saving marketing manual:", error)
    return NextResponse.json({ success: false, error: "Failed to save marketing manual" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "Manual ID is required" }, { status: 400 })
    }

    await db.deleteMarketingManual(Number.parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting marketing manual:", error)
    return NextResponse.json({ success: false, error: "Failed to delete marketing manual" }, { status: 500 })
  }
}
