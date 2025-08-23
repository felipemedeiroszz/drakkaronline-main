import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    console.log("Debug - Received request data:", requestData)

    let dealer = null
    
    // Se tiver dealer_id, buscar direto por ID
    if (requestData.dealer_id) {
      const dealers = await DatabaseService.getDealers()
      dealer = dealers.find((d) => d.id === requestData.dealer_id)
      console.log("Debug - Found dealer by ID:", dealer)
    }
    
    // Se não encontrou por ID ou não tem ID, buscar pelo nome
    if (!dealer && requestData.dealerName) {
      const dealers = await DatabaseService.getDealers()
      console.log("Debug - All dealers:", dealers.map(d => ({ id: d.id, name: d.name })))
      
      dealer = dealers.find((d) => 
        d.name.trim().toLowerCase() === requestData.dealerName.trim().toLowerCase()
      )
      console.log("Debug - Found dealer by name:", dealer)
    }

    if (!dealer) {
      console.error("Debug - Dealer not found for:", { 
        name: requestData.dealerName, 
        id: requestData.dealer_id 
      })
      return NextResponse.json(
        {
          success: false,
          error: "Dealer não encontrado",
        },
        { status: 404 },
      )
    }

    // Preparar dados da solicitação para o banco
    const dbRequestData = {
      request_id: requestData.requestId,
      dealer_id: dealer.id!,
      customer_name: requestData.customer_name,
      customer_email: requestData.customer_email,
      customer_phone: requestData.customer_phone,
      customer_address: requestData.customer_address || "",
      boat_model: requestData.boat_model,
      hull_id: requestData.hull_id,
      purchase_date: requestData.purchase_date,
      engine_hours: requestData.engine_hours || "",
      request_type: requestData.request_type,
      issues: requestData.issues || [],
      status: (requestData.status || "open").toLowerCase(),
    }

    // Salvar no banco
    const savedRequest = await DatabaseService.createServiceRequest(dbRequestData)

    return NextResponse.json({
      success: true,
      serviceRequest: savedRequest,
      message: "Solicitação salva com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao salvar solicitação:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
