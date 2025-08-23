import { DatabaseService } from "@/lib/database-service"
import { NextResponse } from "next/server"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Global cache clearing function - this will force all caches to be invalidated
function clearAllCaches() {
  console.log("🧹 Clearing all application caches after data save")
  
  // Trigger cache clearing via fetch to the cache-clearing endpoints
  const cacheInvalidationPromises = [
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/get-admin-data?refresh=true&force=true&clear_cache=true`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    }).catch(err => console.warn("Failed to clear admin-data cache:", err)),
    
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/get-dealer-config?refresh=true&force=true&clear_cache=true`, {
      method: 'GET', 
      headers: { 'Cache-Control': 'no-cache' }
    }).catch(err => console.warn("Failed to clear dealer-config cache:", err))
  ]
  
  // Execute cache clearing asynchronously (don't wait for it)
  Promise.all(cacheInvalidationPromises).then(() => {
    console.log("✅ All cache clearing requests sent")
  }).catch(err => {
    console.warn("⚠️ Some cache clearing requests failed:", err)
  })
}

// Helper function to prepare response headers for cache invalidation
function getCacheInvalidationHeaders() {
  const timestamp = Date.now()
  console.log("🔄 Admin data updated - preparing cache invalidation headers")
  console.log(`📡 Data update timestamp: ${timestamp}`)
  
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Data-Updated': timestamp.toString(),
    'X-Admin-Data-Update': timestamp.toString()
  }
}

export async function POST(req: Request) {
  try {
    const { enginePackages, hullColors, upholsteryPackages, additionalOptions, boatModels, dealers, orders, mode } =
      await req.json()

    if (mode === "upsert") {
      const promises = []
      if (enginePackages) promises.push(DatabaseService.saveEnginePackages(enginePackages))
      if (hullColors) promises.push(DatabaseService.saveHullColors(hullColors))
      if (upholsteryPackages) promises.push(DatabaseService.saveUpholsteryPackages(upholsteryPackages))
      if (additionalOptions) promises.push(DatabaseService.saveAdditionalOptions(additionalOptions))
      if (boatModels) promises.push(DatabaseService.saveBoatModels(boatModels))
      if (dealers) promises.push(DatabaseService.saveDealers(dealers))
      if (orders) promises.push(DatabaseService.saveOrders(orders))

      await Promise.all(promises)
      
      // Clear all application caches after successful save
      clearAllCaches()
    }

    // Return response with cache invalidation headers
    const headers = getCacheInvalidationHeaders()
    const response = NextResponse.json({ success: true, timestamp: Date.now() })
    
    // Add headers to prevent caching and notify clients
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Save admin data error:", errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
