import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DatabaseService } from "@/lib/database-service"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from("factory_production")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching factory production:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Error in factory production GET:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await req.json()

    // Handle empty date strings - convert to null for PostgreSQL
    if (body.expected_completion_date === "") {
      body.expected_completion_date = null
    }

    const { data, error } = await supabase.from("factory_production").upsert(body).select()

    if (error) {
      console.error("Error saving factory production:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in factory production POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("factory_production").delete().eq("id", id)

    if (error) {
      console.error("Error deleting factory production:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in factory production DELETE:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
