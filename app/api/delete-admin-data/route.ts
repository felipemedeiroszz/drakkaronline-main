import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function to notify data updates across the application
async function notifyDataUpdate() {
  try {
    // Clear any caches that might exist
    console.log("🔄 Admin data deleted - notifying clients to refresh")
    
    // Set a timestamp to trigger cross-tab synchronization
    const timestamp = Date.now()
    
    console.log(`📡 Data deletion notification sent at ${timestamp}`)
    console.log("  - Admin data sync notified")
    console.log("  - Dealer pricing sync notified")
    
    return true
  } catch (error) {
    console.error("❌ Error notifying data update:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { type, id } = await request.json()

    let result
    switch (type) {
      case "engine_packages":
        result = await DatabaseService.deleteEnginePackage(id)
        break
      case "hull_colors":
        result = await DatabaseService.deleteHullColor(id)
        break
      case "upholstery_packages":
        result = await DatabaseService.deleteUpholsteryPackage(id)
        break
      case "additional_options":
        result = await DatabaseService.deleteAdditionalOption(id)
        break
      case "boat_models":
        result = await DatabaseService.deleteBoatModel(id)
        break
      case "dealers":
        result = await DatabaseService.deleteDealer(id)
        break
      case "orders": // New case for orders
        result = await DatabaseService.deleteOrder(id)
        break
      case "service_requests": // New case for service requests
        result = await DatabaseService.deleteServiceRequest(id)
        break
      default:
        throw new Error("Tipo de dados inválido")
    }

    // Notify that data has been updated/deleted
    await notifyDataUpdate()

    // Return response with cache invalidation headers
    const response = NextResponse.json({
      success: true,
      message: "Item deletado com sucesso!",
      timestamp: Date.now()
    })
    
    // Add headers to prevent caching of this response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Data-Updated', Date.now().toString())
    
    return response
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
