import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get("dealerId")
    
    console.log("🔍 Debug - Parâmetros recebidos:")
    console.log("- Dealer ID:", dealerId)

    if (!dealerId) {
      const errorResponse = NextResponse.json(
        {
          success: false,
          error: "dealerId é obrigatório",
        },
        { status: 400 },
      )
      
      // Add anti-cache headers
      errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      errorResponse.headers.set('Pragma', 'no-cache')
      errorResponse.headers.set('Expires', '0')
      
      return errorResponse
    }

    let orders: any[] = []
    let dealerNameForResponse = ""

    console.log("🔍 Debug - Usando dealer ID:", dealerId)
    
    // Buscar o nome do dealer para a resposta
    const dealers = await DatabaseService.getDealers()
    const dealer = dealers.find(d => String(d.id) === dealerId)
    if (dealer) {
      dealerNameForResponse = dealer.name
      console.log("🔍 Debug - Nome do dealer encontrado:", dealerNameForResponse)
      
      // Buscar pedidos do dealer
      orders = await DatabaseService.getOrdersByDealer(dealerId)
      console.log("🔍 Debug - Pedidos encontrados:", orders.length)
    } else {
      console.log("🔍 Debug - Dealer não encontrado com ID:", dealerId)
      const emptyResponse = NextResponse.json({
        success: true,
        data: [], // Retorna array vazio se dealer não encontrado
        message: "Dealer não encontrado",
      })
      
      // Add anti-cache headers
      emptyResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      emptyResponse.headers.set('Pragma', 'no-cache')
      emptyResponse.headers.set('Expires', '0')
      
      return emptyResponse
    }

    // Mapear os dados para o formato esperado pela interface
    const mappedOrders = orders.map((order) => ({
      orderId: order.order_id,
      dealer: dealerNameForResponse,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
      },
      model: order.boat_model,
      engine: order.engine_package,
      hull_color: order.hull_color,
      upholstery_package: order.upholstery_package, // ADICIONAR ESTA LINHA
      options: order.additional_options || [],
      date: new Date(order.created_at || "").toLocaleDateString("pt-BR"),
      status: order.status,
      totalUsd: order.total_usd,
      totalBrl: order.total_brl,
      customerAddress: order.customer_address,
      customerCity: order.customer_city,
      customerState: order.customer_state,
      customerZip: order.customer_zip,
      customerCountry: order.customer_country,
      paymentMethod: order.payment_method,
      depositAmount: order.deposit_amount,
      additionalNotes: order.additional_notes,
    }))

    const response = NextResponse.json({
      success: true,
      data: mappedOrders,
    })
    
    // Add anti-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error("Erro ao buscar pedidos do dealer:", error)
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
    
    // Add anti-cache headers
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    errorResponse.headers.set('Pragma', 'no-cache')
    errorResponse.headers.set('Expires', '0')
    
    return errorResponse
  }
}
