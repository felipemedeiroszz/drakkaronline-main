export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const dealerId = searchParams.get("dealerId")
    const dealerName = searchParams.get("dealerName")

    let query = supabase.from("dealer_inventory").select("*").order("created_at", { ascending: false })

    if (dealerId) {
      query = query.eq("dealer_id", dealerId)
    } else if (dealerName) {
      query = query.eq("dealer_name", dealerName)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching inventory:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Error in GET /api/dealer-inventory:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { action } = body

    if (action === "add") {
      // Add new inventory item
      const inventoryData = {
        dealer_id: body.dealerId || body.dealer_id || "",
        dealer_name: body.dealerName || body.dealer_name || "",
        boat_model: body.boat_model,
        boat_color: body.boat_color,
        engine_package: body.engine_package,
        cost_price: body.cost_price || 0,
        sale_price: body.sale_price || 0,
        status: body.status || "available",
        date_added: body.date_added || new Date().toISOString().split("T")[0],
        notes: body.notes || "",
      }

      // Validate required fields
      if (
        !inventoryData.dealer_name ||
        !inventoryData.boat_model ||
        !inventoryData.boat_color ||
        !inventoryData.engine_package
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Dealer name, boat model, boat color, and engine package are required",
          },
          { status: 400 },
        )
      }

      const { data, error } = await supabase.from("dealer_inventory").insert([inventoryData]).select()

      if (error) {
        console.error("Error creating inventory item:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: data[0] })
    } else if (action === "update") {
      // Update existing inventory item
      const { id, ...updateData } = body

      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required for update" }, { status: 400 })
      }

      const inventoryData = {
        boat_model: updateData.boat_model,
        boat_color: updateData.boat_color,
        engine_package: updateData.engine_package,
        cost_price: updateData.cost_price || 0,
        sale_price: updateData.sale_price || 0,
        status: updateData.status || "available",
        date_added: updateData.date_added,
        notes: updateData.notes || "",
      }

      const { data, error } = await supabase.from("dealer_inventory").update(inventoryData).eq("id", id).select()

      if (error) {
        console.error("Error updating inventory item:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: data[0] })
    } else if (action === "delete") {
      // Delete inventory item
      const { id } = body

      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required for deletion" }, { status: 400 })
      }

      const { error } = await supabase.from("dealer_inventory").delete().eq("id", id)

      if (error) {
        console.error("Error deleting inventory item:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in POST /api/dealer-inventory:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required for update" }, { status: 400 })
    }

    // Normalize field names
    const normalizedData = {
      dealer_name: updateData.dealer_name || updateData.dealerName,
      boat_model: updateData.boat_model || updateData.boatModel,
      boat_color: updateData.boat_color || updateData.boatColor,
      engine_package: updateData.engine_package || updateData.enginePackage,
      cost_price: updateData.cost_price || updateData.costPrice || 0,
      sale_price: updateData.sale_price || updateData.salePrice || 0,
      status: updateData.status || "available",
      date_added: updateData.date_added || updateData.dateAdded,
      notes: updateData.notes || "",
    }

    const { data, error } = await supabase.from("dealer_inventory").update(normalizedData).eq("id", id).select()

    if (error) {
      console.error("Error updating inventory item:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("Error in PUT /api/dealer-inventory:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required for deletion" }, { status: 400 })
    }

    const { error } = await supabase.from("dealer_inventory").delete().eq("id", id)

    if (error) {
      console.error("Error deleting inventory item:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/dealer-inventory:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
