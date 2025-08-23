import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log("🧪 TEST: Fetching fresh data directly from database...")

    // Fetch data directly from database without any caching
    const [
      enginePackages,
      hullColors,
      upholsteryPackages,
      additionalOptions,
      boatModels,
    ] = await Promise.all([
      supabase.from("engine_packages").select("*").order("display_order"),
      supabase.from("hull_colors").select("*").order("display_order"),
      supabase.from("upholstery_packages").select("*").order("display_order"),
      supabase.from("additional_options").select("*").order("display_order"),
      supabase.from("boat_models").select("*").order("name"),
    ])

    const result = {
      timestamp: new Date().toISOString(),
      data: {
        enginePackages: enginePackages.data || [],
        hullColors: hullColors.data || [],
        upholsteryPackages: upholsteryPackages.data || [],
        additionalOptions: additionalOptions.data || [],
        boatModels: boatModels.data || [],
      },
      counts: {
        enginePackages: enginePackages.data?.length || 0,
        hullColors: hullColors.data?.length || 0,
        upholsteryPackages: upholsteryPackages.data?.length || 0,
        additionalOptions: additionalOptions.data?.length || 0,
        boatModels: boatModels.data?.length || 0,
      }
    }

    console.log("🧪 TEST: Fresh data counts:", result.counts)

    const response = NextResponse.json({
      success: true,
      ...result
    })

    // Prevent any caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error("🧪 TEST: Error fetching fresh data:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}