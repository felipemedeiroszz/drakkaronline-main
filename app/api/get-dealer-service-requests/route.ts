import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

// Garantir que a rota seja sempre dinâmica e nunca cacheada
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get("dealerId")
    
    console.log("Debug - Fetching requests for dealerId:", dealerId)

    if (!dealerId) {
      return NextResponse.json(
        {
          success: false,
          error: "dealerId é obrigatório",
        },
        { status: 400 },
      )
    }

    // Buscar o dealer
    const dealers = await DatabaseService.getDealers()
    console.log("Debug - Total dealers in database:", dealers.length)
    
    let dealer = null
    
    // Buscar dealer por ID
    dealer = dealers.find((d) => d.id === dealerId || d.id === dealerId.toString())
    console.log("Debug - Found dealer by ID:", dealer)

    if (!dealer) {
      console.warn("Debug - Dealer not found, returning empty array", { dealerId })
      return NextResponse.json({
        success: true,
        data: [], // Retorna array vazio se dealer não encontrado
      })
    }

    // Buscar solicitações de serviço do dealer
    const serviceRequests = await DatabaseService.getServiceRequestsByDealer(dealer.id!)
    console.log("Debug - Found service requests:", serviceRequests.length)

    // Mapear os dados para o formato esperado pela interface
    const mappedRequests = serviceRequests.map((request) => ({
      id: request.request_id,
      customer: request.customer_name,
      model: request.boat_model,
      type: request.request_type,
      date: new Date(request.created_at || "").toLocaleDateString("pt-BR"),
      status: request.status,
      dealer: dealer.name, // Usar o nome do dealer encontrado
      issues: request.issues || [],
      // Dados adicionais para o modal
      customerEmail: request.customer_email,
      customerPhone: request.customer_phone,
      customerAddress: request.customer_address,
      hullId: request.hull_id,
      purchaseDate: request.purchase_date,
      engineHours: request.engine_hours,
    }))

    return NextResponse.json({
      success: true,
      data: mappedRequests,
    })
  } catch (error) {
    console.error("Erro ao buscar solicitações do dealer:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
