import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const dealerId = request.nextUrl.searchParams.get("dealerId")

    console.log("🔍 GET /api/get-dealer-quotes - Iniciando")
    console.log("🔍 Parâmetros recebidos - dealerId:", dealerId)

    if (!dealerId) {
      console.error("❌ dealer_id não fornecido")
      return NextResponse.json(
        {
          success: false,
          error: "dealer_id é obrigatório",
        },
        { status: 400 },
      )
    }

    console.log("🔍 Buscando orçamentos para dealer_id:", dealerId)

    // Validar se o dealerId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(dealerId)) {
      console.error("❌ dealer_id não é um UUID válido:", dealerId)
      return NextResponse.json(
        {
          success: false,
          error: "dealer_id deve ser um UUID válido",
        },
        { status: 400 },
      )
    }

    // Verificar se o dealer existe
    console.log("🔍 Verificando se o dealer existe...")
    const dealers = await DatabaseService.getDealers()
    const dealer = dealers.find((d) => d.id === dealerId)
    
    if (!dealer) {
      console.log("❌ Dealer não encontrado para ID:", dealerId)
      console.log("📊 Total de dealers no sistema:", dealers.length)
      return NextResponse.json({
        success: true,
        data: [],
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }

    console.log("✅ Dealer encontrado:", dealer.name)

    // Get quotes for this dealer
    console.log("🔍 Buscando orçamentos do dealer...")
    const quotes = await DatabaseService.getQuotesByDealer(dealerId)

    console.log("📊 Orçamentos encontrados:", quotes.length)
    if (quotes.length > 0) {
      console.log("📋 IDs dos orçamentos:", quotes.map(q => q.quote_id).join(", "))
    }

    // Map database quotes to frontend format
    const mappedQuotes = quotes.map((quote) => ({
      quoteId: quote.quote_id,
      dealer: dealer.name,
      customer: {
        name: quote.customer_name,
        email: quote.customer_email,
        phone: quote.customer_phone,
        address: quote.customer_address,
        city: quote.customer_city,
        state: quote.customer_state,
        zip: quote.customer_zip,
        country: quote.customer_country,
      },
      model: quote.boat_model,
      engine: quote.engine_package,
      hull_color: quote.hull_color,
      upholstery_package: quote.upholstery_package,
      options: Array.isArray(quote.additional_options) ? quote.additional_options : [],
      paymentMethod: quote.payment_method,
      depositAmount: quote.deposit_amount,
      additionalNotes: quote.additional_notes,
      date: quote.created_at ? new Date(quote.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      status: quote.status,
      totalUsd: quote.total_usd,
      totalBrl: quote.total_brl,
      validUntil: quote.valid_until,
    }))

    console.log("✅ Retornando", mappedQuotes.length, "orçamentos mapeados")

    return NextResponse.json({
      success: true,
      data: mappedQuotes,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error("❌ Erro ao buscar orçamentos:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
