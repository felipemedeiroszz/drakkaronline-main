export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function GET() {
  try {
    let dbService
    try {
      dbService = new DatabaseService()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }
    
    const warranties = await dbService.getMarketingWarranties()

    return NextResponse.json({
      success: true,
      data: warranties,
    })
  } catch (error) {
    console.error("Error fetching marketing warranties:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch warranties" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const warranty = await request.json()
    
    let dbService
    try {
      dbService = new DatabaseService()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }
    
    const savedWarranty = await dbService.saveMarketingWarranty(warranty)

    return NextResponse.json({
      success: true,
      data: savedWarranty,
    })
  } catch (error) {
    console.error("Error saving marketing warranty:", error)
    return NextResponse.json({ success: false, error: "Failed to save warranty" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    let dbService
    try {
      dbService = new DatabaseService()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }
    
    await dbService.deleteMarketingWarranty(Number.parseInt(id))

    return NextResponse.json({
      success: true,
      message: "Warranty deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting marketing warranty:", error)
    return NextResponse.json({ success: false, error: "Failed to delete warranty" }, { status: 500 })
  }
}
