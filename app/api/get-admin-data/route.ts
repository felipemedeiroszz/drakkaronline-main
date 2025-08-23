import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; ttl: number; dataTimestamp?: number }>()
const CACHE_TTL = 5000 // 5 seconds for real-time sync

// Function to get the latest data update timestamp
async function getDataUpdateTimestamp(supabase: any): Promise<number> {
  try {
    // Get the most recent timestamp from any relevant table
    const tables = ['boat_models', 'engine_packages', 'hull_colors', 'upholstery_packages', 'additional_options', 'dealers', 'orders', 'service_requests']
    const promises = tables.map(table => 
      supabase
        .from(table)
        .select('updated_at, created_at')
        .order('updated_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    )
    
    const results = await Promise.all(promises)
    let latestTimestamp = 0
    
    results.forEach(result => {
      if (result.data) {
        const timestamp = new Date(result.data.updated_at || result.data.created_at).getTime()
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp
        }
      }
    })
    
    return latestTimestamp || Date.now()
  } catch (error) {
    console.warn("⚠️ Error getting data update timestamp:", error)
    return Date.now()
  }
}

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  const isExpired = now - cached.timestamp > cached.ttl
  
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

function setCachedData(key: string, data: any, dataTimestamp: number, ttl = CACHE_TTL) {
  cache.set(key, { 
    data, 
    timestamp: Date.now(), 
    ttl,
    dataTimestamp 
  })
}

// Function to check if cache is stale based on data
async function isCacheStale(key: string, supabase: any): Promise<boolean> {
  const cached = cache.get(key)
  if (!cached || !cached.dataTimestamp) return true
  
  try {
    const currentDataTimestamp = await getDataUpdateTimestamp(supabase)
    const isStale = currentDataTimestamp > cached.dataTimestamp
    
    if (isStale) {
      console.log(`📊 Cache stale detected for ${key}:`)
      console.log(`  - Cached data timestamp: ${new Date(cached.dataTimestamp).toISOString()}`)
      console.log(`  - Current data timestamp: ${new Date(currentDataTimestamp).toISOString()}`)
      cache.delete(key) // Remove stale cache
    }
    
    return isStale
  } catch (error) {
    console.warn("⚠️ Error checking cache staleness:", error)
    return false // In case of error, assume cache is still valid
  }
}

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const cacheKey = 'admin-data'
    const url = new URL(request.url)
    const forceRefresh = url.searchParams.get('refresh') === 'true'
    const clearCache = url.searchParams.get('clear_cache') === 'true'

    // Always force refresh if requested or clear all cache for real-time sync
    if (forceRefresh || clearCache) {
      console.log("🔄 Force refresh/clear cache requested - clearing all cache")
      cache.clear()
    }

    // Check if cache is stale based on data (only if not forcing refresh)
    const cacheStale = (forceRefresh || clearCache) ? true : await isCacheStale(cacheKey, supabase)
    
    // Check cache first (if not forcing refresh and cache is not stale)
    if (!forceRefresh && !clearCache && !cacheStale) {
      const cachedResult = getCachedData(cacheKey)
      if (cachedResult) {
        console.log("✅ Returning cached admin data")
        const response = NextResponse.json({
          success: true,
          data: cachedResult,
          cached: true
        })
        
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
        
        return response
      }
    }

    if (cacheStale) {
      console.log("🔄 Cache invalidated due to data updates")
    }

    // Get current data timestamp
    const dataTimestamp = await getDataUpdateTimestamp(supabase)

    // Helper function to safely query a table
    const safeQuery = async (tableName: string, orderBy?: { column: string; ascending: boolean }) => {
      try {
        let query = supabase.from(tableName).select("*")

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending })
        }

        const { data, error } = await query

        if (error) {
          console.error(`Error querying ${tableName}:`, error)
          return []
        }

        return data || []
      } catch (error) {
        console.error(`Exception querying ${tableName}:`, error)
        return []
      }
    }

    // Query all tables with individual error handling
    const [
      enginePackages,
      hullColors,
      upholsteryPackages,
      additionalOptions,
      boatModels,
      dealers,
      orders,
      serviceRequests,
      marketingContent,
      marketingManuals,
      marketingWarranties,
      factoryProduction,
    ] = await Promise.all([
      safeQuery("engine_packages", { column: "display_order", ascending: true }),
      safeQuery("hull_colors", { column: "display_order", ascending: true }),
      safeQuery("upholstery_packages", { column: "display_order", ascending: true }),
      safeQuery("additional_options", { column: "display_order", ascending: true }),
      safeQuery("boat_models", { column: "display_order", ascending: true }),
      safeQuery("dealers", { column: "display_order", ascending: true }),
      safeQuery("orders", { column: "created_at", ascending: false }),
      safeQuery("service_requests", { column: "created_at", ascending: false }),
      safeQuery("marketing_content", { column: "created_at", ascending: false }),
      safeQuery("marketing_manuals", { column: "display_order", ascending: true }),
      safeQuery("marketing_warranties", { column: "display_order", ascending: true }),
      safeQuery("factory_production", { column: "display_order", ascending: true }),
    ])

    // Clean up any potential JSON parsing issues in the data
    const cleanOrders = orders.map((order) => ({
      ...order,
      additional_options: Array.isArray(order.additional_options) ? order.additional_options : [],
    }))

    const cleanServiceRequests = serviceRequests.map((request) => ({
      ...request,
      issues: Array.isArray(request.issues) ? request.issues : [],
    }))

    const cleanFactoryProduction = factoryProduction.map((item) => ({
      ...item,
      additional_options: Array.isArray(item.additional_options) ? item.additional_options : [],
    }))

    const result = {
      enginePackages,
      hullColors,
      upholsteryPackages,
      additionalOptions,
      boatModels,
      dealers,
      orders: cleanOrders,
      serviceRequests: cleanServiceRequests,
      marketingContent,
      marketingManuals,
      marketingWarranties,
      factoryProduction: cleanFactoryProduction,
    }

    console.log("✅ Admin data loaded successfully:")
    console.log("- Boat models:", result.boatModels.length)
    console.log("- Engine packages:", result.enginePackages.length)
    console.log("- Hull colors:", result.hullColors.length)
    console.log("- Upholstery packages:", result.upholsteryPackages.length)
    console.log("- Additional options:", result.additionalOptions.length)
    console.log("- Dealers:", result.dealers.length)
    console.log("- Orders:", result.orders.length)
    console.log("- Service requests:", result.serviceRequests.length)

    // Save to cache with data timestamp
    setCachedData(cacheKey, result, dataTimestamp)

    const response = NextResponse.json({
      success: true,
      data: result,
    })
    
    // Add cache-control headers and data timestamp
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Data-Timestamp', dataTimestamp.toString())
    
    return response
  } catch (error) {
    console.error("Error in get-admin-data:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
