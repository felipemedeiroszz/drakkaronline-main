import { DatabaseService } from "@/lib/database-service"
import { NextResponse } from "next/server"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const { type, items } = await req.json()

    if (!type || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 })
    }

    console.log(`🔄 Salvando ordem para tabela ${type}:`, items)

    // Update display_order for each item
    await DatabaseService.updateDisplayOrder(type, items)

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Save display order error:", errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
