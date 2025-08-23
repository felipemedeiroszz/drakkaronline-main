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
    const serviceRequestId = searchParams.get("serviceRequestId")

    if (!serviceRequestId) {
      return NextResponse.json({ error: "Service request ID is required" }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from("service_messages")
      .select("*")
      .eq("service_request_id", serviceRequestId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in GET /api/service-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { serviceRequestId, senderType, senderName, message } = body

    // Validate required fields
    if (!serviceRequestId || !senderType || !senderName || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate sender type
    if (!["admin", "dealer"].includes(senderType)) {
      return NextResponse.json({ error: "Invalid sender type" }, { status: 400 })
    }

    // Validate message length
    if (message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message is too long (max 2000 characters)" }, { status: 400 })
    }

    const { data: newMessage, error } = await supabase
      .from("service_messages")
      .insert({
        service_request_id: serviceRequestId,
        sender_type: senderType,
        sender_name: senderName,
        message: message.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Message sent successfully",
      data: newMessage,
    })
  } catch (error) {
    console.error("Error in POST /api/service-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get("messageId")
    const senderType = searchParams.get("senderType")

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 })
    }

    // Only admin can delete messages
    if (senderType !== "admin") {
      return NextResponse.json({ error: "Unauthorized - only admin can delete messages" }, { status: 403 })
    }

    const { error } = await supabase.from("service_messages").delete().eq("id", messageId)

    if (error) {
      console.error("Error deleting message:", error)
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Message deleted successfully",
    })
  } catch (error) {
    console.error("Error in DELETE /api/service-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
