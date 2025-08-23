export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if environment variables are available (not during build)
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function GET(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const dealerId = searchParams.get("dealer_id")

    if (!dealerId) {
      return NextResponse.json({ success: false, error: "dealer_id é obrigatório" }, { status: 400 })
    }

    // Buscar preços configurados ESPECIFICAMENTE por este dealer
    const { data: dealerPricing, error: pricingError } = await supabase
      .from("dealer_pricing")
      .select("*")
      .eq("dealer_id", dealerId) // Filtro específico por dealer
      .order("item_type", { ascending: true })
      .order("item_name", { ascending: true })

    if (pricingError) {
      console.error("Erro ao buscar preços do dealer:", pricingError)
      return NextResponse.json({ success: false, error: pricingError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: dealerPricing || [],
      message: `Preços específicos do dealer ${dealerId}`,
    })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { dealer_id, item_type, item_id, item_name, sale_price_usd, sale_price_brl, margin_percentage } = body

    console.log("💰 MSRP: Dados recebidos na API:", body)

    // item_id deve ser string não vazia
    const itemId = String(item_id ?? "").trim()
    if (!itemId) {
      return NextResponse.json({ success: false, error: "item_id é obrigatório" }, { status: 400 })
    }

    // Validação dos campos obrigatórios
    if (!dealer_id?.trim()) {
      return NextResponse.json({ success: false, error: "dealer_id é obrigatório" }, { status: 400 })
    }

    if (!item_type?.trim()) {
      return NextResponse.json({ success: false, error: "item_type é obrigatório" }, { status: 400 })
    }

    if (!item_name?.trim()) {
      return NextResponse.json({ success: false, error: "item_name é obrigatório" }, { status: 400 })
    }

    // Validação e limitação de valores numéricos para evitar overflow
    const validateAndLimitNumber = (value: any, fieldName: string, maxValue = 99999999.99) => {
      const num = Number(value) || 0
      if (isNaN(num)) {
        throw new Error(`${fieldName} deve ser um número válido`)
      }
      if (num < 0) {
        throw new Error(`${fieldName} não pode ser negativo`)
      }
      if (num > maxValue) {
        throw new Error(`${fieldName} excede o valor máximo permitido (${maxValue})`)
      }
      return Math.round(num * 100) / 100 // Limita a 2 casas decimais
    }

    try {
      const validatedSalePriceUsd = validateAndLimitNumber(sale_price_usd, "Preço de venda USD")
      const validatedSalePriceBrl = validateAndLimitNumber(sale_price_brl, "Preço de venda BRL")
      const validatedMarginPercentage = validateAndLimitNumber(margin_percentage, "Margem percentual", 999.99)

      // 🔥 NOVO: Capturar timestamp ANTES do save para garantir ordem cronológica correta
      const updateTimestamp = new Date().toISOString()
      const epochTimestamp = Date.now()

      // Dados específicos para este dealer
      const pricingData = {
        dealer_id: dealer_id.trim(),
        item_type: item_type.trim(),
        item_id: itemId,
        item_name: item_name.trim(),
        sale_price_usd: validatedSalePriceUsd,
        sale_price_brl: validatedSalePriceBrl,
        margin_percentage: validatedMarginPercentage,
        updated_at: updateTimestamp,
      }

      console.log("💰 MSRP: Dados processados para salvar:", pricingData)

      // Upsert: atualiza se existe, cria se não existe
      // A combinação dealer_id + item_type + item_id deve ser única
      const { data, error } = await supabase
        .from("dealer_pricing")
        .upsert(pricingData, {
          onConflict: "dealer_id,item_type,item_id",
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error("❌ Erro ao salvar preço específico do dealer:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      console.log("✅ MSRP: Preço salvo com sucesso:", data)

      // 🔥 CRÍTICO: Criar resposta com headers especiais para sincronização MSRP
      const response = NextResponse.json({
        success: true,
        data,
        message: `Preço MSRP salvo especificamente para o dealer ${dealer_id}`,
        // 🔥 NOVO: Metadados para sincronização
        syncMetadata: {
          msrpUpdate: true,
          dealerId: dealer_id.trim(),
          itemType: item_type.trim(),
          itemId: itemId,
          itemName: item_name.trim(),
          priceUsd: validatedSalePriceUsd,
          priceBrl: validatedSalePriceBrl,
          margin: validatedMarginPercentage,
          timestamp: epochTimestamp,
          updateTimestamp: updateTimestamp
        }
      })

      // 🔥 CRÍTICO: Headers especiais para forçar sincronização MSRP
      response.headers.set('X-MSRP-Update', 'true')
      response.headers.set('X-Dealer-ID', dealer_id.trim())
      response.headers.set('X-Update-Timestamp', epochTimestamp.toString())
      response.headers.set('X-Force-Sync', 'true')
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('X-Invalidate-Cache', 'dealer-config,pricing')

      return response
    } catch (validationError: any) {
      console.error("❌ Erro de validação:", validationError)
      return NextResponse.json({ success: false, error: validationError.message }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    const dealerId = searchParams.get("dealer_id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    // Se dealer_id for fornecido, garantir que só pode deletar seus próprios preços
    let query = supabase.from("dealer_pricing").delete().eq("id", id)

    if (dealerId) {
      query = query.eq("dealer_id", dealerId)
    }

    const { error } = await query

    if (error) {
      console.error("Erro ao deletar preço:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Preço específico do dealer deletado com sucesso",
    })
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
