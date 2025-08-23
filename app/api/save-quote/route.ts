import { DatabaseService } from "@/lib/database-service"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log("📥 POST /api/save-quote - Dados recebidos:", JSON.stringify(data, null, 2))

    // Validar campos obrigatórios
    const requiredFields = [
      { field: data.customer?.name, name: "customerName" },
      { field: data.customer?.email, name: "customerEmail" },
      { field: data.customer?.phone, name: "customerPhone" },
      { field: data.model, name: "boatModel" }, // Changed from data.boatModel to data.model
      { field: data.engine, name: "enginePackage" }, // Changed from data.enginePackage to data.engine
      { field: data.hull_color, name: "hullColor" }, // Changed from data.hullColor to data.hull_color
      { field: data.dealerId, name: "dealerId" },
    ]

    for (const { field, name } of requiredFields) {
      if (!field) {
        console.error(`❌ Campo obrigatório ausente: ${name}`)
        return NextResponse.json({ success: false, error: `Campo obrigatório ausente: ${name}` }, { status: 400 })
      }
    }

    // Gerar ID único para o orçamento
    const quoteId = data.quoteId || DatabaseService.generateQuoteId()
    console.log("🆔 Quote ID:", quoteId)

    // Validar dealerId como UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!data.dealerId || typeof data.dealerId !== "string" || !uuidRegex.test(data.dealerId)) {
      console.error("❌ dealer_id inválido (não é UUID):", data.dealerId)
      return NextResponse.json({ success: false, error: "dealer_id deve ser um UUID válido" }, { status: 400 })
    }

    console.log("✅ dealer_id válido:", data.dealerId)

    // Preparar dados para salvar no banco
    const quoteData = {
      quote_id: quoteId,
      dealer_id: data.dealerId,
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_address: data.customer.address || "",
      customer_city: data.customer.city || "",
      customer_state: data.customer.state || "",
      customer_zip: data.customer.zip || "",
      customer_country: data.customer.country || "",
      boat_model: data.model, // Changed from data.boatModel to data.model
      engine_package: data.engine, // Changed from data.enginePackage to data.engine
      hull_color: data.hull_color, // Changed from data.hullColor to data.hull_color
      upholstery_package: data.upholstery_package || "",
      additional_options: Array.isArray(data.options) ? data.options : [], // Changed from data.additionalOptions to data.options
      payment_method: data.payment_method || "",
      deposit_amount: Number.parseFloat(data.deposit_amount) || 0,
      additional_notes: data.additional_notes || "",
      total_usd: data.totalUsd, // Changed from Number.parseFloat(data.totalUSD) to data.totalUsd
      total_brl: data.totalBrl, // Changed from Number.parseFloat(data.totalBRL) to data.totalBrl
      status: "pending",
      valid_until: data.valid_until || null, // Changed from data.validUntil to data.valid_until
    }

    console.log("📋 Dados preparados para o banco:", JSON.stringify(quoteData, null, 2))

    // Salvar no banco de dados
    console.log("💾 Salvando no banco de dados...")
    const savedQuote = await DatabaseService.createQuote(quoteData)

    console.log("✅ Orçamento salvo com sucesso!")
    console.log("🔍 Dados salvos:")
    console.log("  - ID do registro:", savedQuote?.id)
    console.log("  - Quote ID:", savedQuote?.quote_id)
    console.log("  - Dealer ID:", savedQuote?.dealer_id)
    console.log("  - Customer:", savedQuote?.customer_name)

    return NextResponse.json({
      success: true,
      quoteId: quoteId,
      message: "Orçamento gerado com sucesso!",
      savedData: {
        id: savedQuote?.id,
        quote_id: savedQuote?.quote_id,
        dealer_id: savedQuote?.dealer_id,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    console.error("❌ Erro ao gerar orçamento:", errorMessage)
    console.error("Stack trace:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Erro ao gerar orçamento: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
