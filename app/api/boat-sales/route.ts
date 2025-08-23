export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if environment variables are available (not during build)
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const dealerName = searchParams.get("dealer")

    if (!dealerName) {
      return NextResponse.json({ success: false, error: "Dealer name is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("boat_sales")
      .select("*")
      .eq("dealer_name", dealerName)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching boat sales:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Error in boat sales GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      dealerName,
      boatModel,
      salePriceUsd,
      salePriceEur,
      salePriceBrl,
      salePriceGbp,
      currency,
      marginPercentage,
      notes,
    } = body

    if (!dealerName || !boatModel) {
      return NextResponse.json({ success: false, error: "Dealer name and boat model are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("boat_sales")
      .upsert({
        dealer_name: dealerName,
        boat_model: boatModel,
        sale_price_usd: salePriceUsd || 0,
        sale_price_eur: salePriceEur || 0,
        sale_price_brl: salePriceBrl || 0,
        sale_price_gbp: salePriceGbp || 0,
        currency: currency || "USD",
        margin_percentage: marginPercentage || 0,
        notes: notes || "",
      })
      .select()

    if (error) {
      console.error("Error saving boat sale:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in boat sales POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const dealerName = searchParams.get("dealer")

    if (!id || !dealerName) {
      return NextResponse.json({ success: false, error: "ID and dealer name are required" }, { status: 400 })
    }

    const { error } = await supabase.from("boat_sales").delete().eq("id", id).eq("dealer_name", dealerName)

    if (error) {
      console.error("Error deleting boat sale:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in boat sales DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
