import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { quoteId } = await request.json()
    console.log("📥 Convertendo orçamento para pedido:", quoteId)

    if (!quoteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Quote ID é obrigatório",
        },
        { status: 400 },
      )
    }

    // Get the quote from database
    let quote
    try {
      quote = await DatabaseService.getQuoteById(quoteId)
    } catch (error: any) {
      if (error.message === "Supabase configuration is missing") {
        return NextResponse.json(
          {
            success: false,
            error: "Database not configured",
          },
          { status: 503 },
        )
      }
      throw error
    }

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: "Orçamento não encontrado",
        },
        { status: 404 },
      )
    }

    // Generate order ID
    const orderId = DatabaseService.generateOrderId()

    // Map quote data to order data
    const orderData = {
      order_id: orderId,
      dealer_id: quote.dealer_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      customer_address: quote.customer_address || "",
      customer_city: quote.customer_city || "",
      customer_state: quote.customer_state || "",
      customer_zip: quote.customer_zip || "",
      customer_country: quote.customer_country || "",
      boat_model: quote.boat_model,
      engine_package: quote.engine_package,
      hull_color: quote.hull_color,
      upholstery_package: quote.upholstery_package || "",
      additional_options: quote.additional_options || [],
      payment_method: quote.payment_method || "",
      deposit_amount: quote.deposit_amount || 0,
      additional_notes: quote.additional_notes || "",
      total_usd: quote.total_usd,
      total_brl: quote.total_brl,
      status: "pending",
    }

    console.log("💾 Criando pedido com dados:", orderData)

    // Create the order
    const savedOrder = await DatabaseService.createOrder(orderData)

    // Update quote status to accepted
    await DatabaseService.updateQuoteStatus(quoteId, "accepted")

    console.log("✅ Orçamento convertido para pedido com sucesso!")

    return NextResponse.json({
      success: true,
      data: savedOrder,
      message: "Orçamento convertido para pedido com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao converter orçamento:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
