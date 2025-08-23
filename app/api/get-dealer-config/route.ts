import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if environment variables are available (not during build)
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const dynamic = 'force-dynamic'

// 🔧 CRÍTICO: Cache ultra-agressivo para atualizações MSRP em tempo real
const cache = new Map<string, { data: any; timestamp: number; ttl: number; dataTimestamp?: number }>()
const CACHE_TTL = 5000 // 🔧 REDUZIDO: De 30s para 5s para atualizações mais rápidas
const MSRP_UPDATE_CACHE_TTL = 1000 // 🔧 NOVO: TTL ultra-baixo para atualizações MSRP (1 segundo)
const FORCE_REFRESH_INTERVAL = 3000 // 🔧 REDUZIDO: Para forçar refresh mais frequente

// 🔧 CRÍTICO: Verificar se há atualizações MSRP recentes em localStorage
function hasMSRPUpdatesRecent(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const lastUpdate = localStorage.getItem('lastSalesPriceUpdate')
    if (!lastUpdate) return false
    
    const updateData = JSON.parse(lastUpdate)
    const timeDiff = Date.now() - updateData.timestamp
    
    // Se há atualizações MSRP nos últimos 10 segundos, considerar recente
    return timeDiff < 10000
  } catch (error) {
    return false
  }
}

// 🔧 MELHORADO: Função para obter timestamp da última atualização com foco em dealer_pricing
async function getDataUpdateTimestamp(): Promise<number> {
  if (!supabase) return Date.now()
  
  try {
    // 🔧 CRITICAL: Priorizar tabela dealer_pricing para atualizações MSRP
    const dealerPricingResult = await supabase
      .from('dealer_pricing')
      .select('updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(1)
    
    let latestTimestamp = 0
    
    if (dealerPricingResult.data && dealerPricingResult.data.length > 0) {
      const dealerPricingTimestamp = new Date(
        dealerPricingResult.data[0].updated_at || dealerPricingResult.data[0].created_at
      ).getTime()
      latestTimestamp = dealerPricingTimestamp
      console.log(`🔥 MSRP: dealer_pricing latest timestamp: ${new Date(dealerPricingTimestamp).toISOString()}`)
    }
    
    // 🔧 SECUNDÁRIO: Verificar outras tabelas apenas se não há atualizações recentes de MSRP
    const tables = ['boat_models', 'engine_packages', 'hull_colors', 'upholstery_packages', 'additional_options', 'dealers']
    
    const promises = tables.map(async table => {
      try {
        const result = await supabase
          .from(table)
          .select('updated_at, created_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        
        return { table, data: result.data, error: result.error }
      } catch (error) {
        return { table, data: null, error }
      }
    })
    
    const results = await Promise.all(promises)
    
    results.forEach(({ table, data, error }) => {
      if (data && !error) {
        const timestamp = new Date(data.updated_at || data.created_at).getTime()
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp
        }
        console.log(`📊 Table ${table} latest timestamp: ${new Date(timestamp).toISOString()}`)
      }
    })
    
    console.log(`🔥 Overall latest data timestamp: ${new Date(latestTimestamp).toISOString()}`)
    return latestTimestamp || Date.now()
  } catch (error) {
    console.warn("⚠️ Erro ao obter timestamp de atualização dos dados:", error)
    return Date.now()
  }
}

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (!cached) return null
  
  const now = Date.now()
  const isExpired = now - cached.timestamp > cached.ttl
  
  if (isExpired) {
    console.log(`🧹 Cache expirado para ${key}, removendo`)
    cache.delete(key)
    return null
  }
  
  return cached.data
}

function setCachedData(key: string, data: any, dataTimestamp: number, ttl = CACHE_TTL) {
  cache.set(key, { 
    data, 
    timestamp: Date.now(), 
    ttl,
    dataTimestamp 
  })
  console.log(`💾 Cache atualizado para ${key} com timestamp: ${new Date(dataTimestamp).toISOString()}, TTL: ${ttl}ms`)
}

// 🔧 CRÍTICO: Verificação de cache desatualizado ultra-sensível para MSRP
async function isCacheStale(key: string): Promise<boolean> {
  const cached = cache.get(key)
  if (!cached || !cached.dataTimestamp) {
    console.log(`📊 Cache ${key} não existe ou sem timestamp, considerando stale`)
    return true
  }
  
  try {
    const currentDataTimestamp = await getDataUpdateTimestamp()
    const timeDiffMs = currentDataTimestamp - cached.dataTimestamp
    
    // 🔧 CRÍTICO: Para atualizações MSRP, tolerância ZERO
    const isStale = timeDiffMs > 0 // Qualquer diferença > 0 é considerada stale
    
    if (isStale) {
      console.log(`🔥 MSRP Cache stale detected for ${key}:`)
      console.log(`  - Cached data timestamp: ${new Date(cached.dataTimestamp).toISOString()}`)
      console.log(`  - Current data timestamp: ${new Date(currentDataTimestamp).toISOString()}`)
      console.log(`  - Time difference: ${timeDiffMs}ms`)
      cache.delete(key) // Remove cache desatualizado imediatamente
    } else {
      console.log(`📊 Cache ${key} ainda é válido (diferença: ${timeDiffMs}ms)`)
    }
    
    return isStale
  } catch (error) {
    console.warn("⚠️ Erro ao verificar staleness do cache:", error)
    return true // Em caso de erro, sempre buscar dados frescos
  }
}

// 🔧 CRÍTICO: Detecção de atualizações MSRP baseada em múltiplas fontes
function shouldInvalidateForMSRP(request: NextRequest): boolean {
  const msrpUpdate = request.headers.get('x-msrp-update') === 'true'
  const realTimeUpdate = request.headers.get('x-real-time-update') === 'true'
  const pricingUpdate = request.nextUrl.searchParams.get('msrp_update') === 'true'
  const cacheBuster = request.headers.get('x-cache-buster') || request.nextUrl.searchParams.get('cb')
  
  return msrpUpdate || realTimeUpdate || pricingUpdate || !!cacheBuster
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 503 }
      )
    }

    const dealerId = request.nextUrl.searchParams.get("dealer_id")
    const cacheKey = `dealer-config-${dealerId || 'global'}`
    
    // 🔧 ULTRA-CRÍTICO: Detecção agressiva de força de refresh para MSRP
    const forceRefresh = request.headers.get('cache-control')?.includes('no-cache') || 
                        request.nextUrl.searchParams.get('refresh') === 'true' ||
                        request.nextUrl.searchParams.get('force') === 'true' ||
                        request.headers.get('x-cache-buster') !== null ||
                        request.headers.get('x-real-time-update') === 'true' ||
                        request.headers.get('x-msrp-update') === 'true' ||
                        request.nextUrl.searchParams.get('cb') !== null ||
                        request.nextUrl.searchParams.get('t') !== null ||
                        request.nextUrl.searchParams.get('invalidate_cache') === 'true' ||
                        request.nextUrl.searchParams.get('clear_cache') === 'true' ||
                        request.nextUrl.searchParams.get('msrp_update') === 'true'
    
    const isMSRPUpdate = shouldInvalidateForMSRP(request)
    const cacheBuster = request.headers.get('x-cache-buster') || request.nextUrl.searchParams.get('cb') || request.nextUrl.searchParams.get('t')

    console.log("🔍 GET dealer config - Parâmetros de cache MSRP:")
    console.log("  - Dealer ID:", dealerId)
    console.log("  - Force refresh:", forceRefresh)
    console.log("  - MSRP Update:", isMSRPUpdate)
    console.log("  - Cache buster:", cacheBuster)

    // 🔥 ULTRA-CRÍTICO: Para atualizações MSRP, SEMPRE invalidar TUDO + Verificações extras
    if (isMSRPUpdate || forceRefresh) {
      console.log("🔥 MSRP UPDATE DETECTED: Invalidando TODO o cache IMEDIATAMENTE")
      
      // 🔥 STEP 1: Limpar todo o cache interno
      cache.clear()
      console.log("🔥 MSRP: Cache interno COMPLETAMENTE limpo")
      
      // 🔥 STEP 2: Limpar cache específico do dealer com verificação extra
      if (dealerId) {
        const dealerSpecificKeys = [
          `dealer-config-${dealerId}`, 
          `dealer-pricing-${dealerId}`,
          `dealer-data-${dealerId}`,
          `config-${dealerId}`
        ]
        dealerSpecificKeys.forEach(key => {
          if (cache.has(key)) {
            cache.delete(key)
            console.log(`🔥 Cache específico ${key} invalidado para MSRP update`)
          }
        })
      }
      
      // 🔥 STEP 3: Invalidar também qualquer cache global
      const globalKeys = ['global-config', 'dealer-config-global', 'boat-models-global']
      globalKeys.forEach(key => {
        if (cache.has(key)) {
          cache.delete(key)
          console.log(`🔥 Cache global ${key} invalidado para MSRP update`)
        }
      })
      
      console.log("🔥 MSRP: TODOS os caches invalidados - dados serão ultra-frescos")
    }

    // 🔧 CRÍTICO: Sempre verificar staleness para garantir dados MSRP frescos
    const cacheStale = await isCacheStale(cacheKey)
    const mustRefresh = forceRefresh || isMSRPUpdate || cacheStale
    
    if (mustRefresh) {
      console.log("🔥 MSRP: Refresh obrigatório detectado - buscando dados ultra-frescos")
    }
    
    // 🔧 CRITICAL: Para MSRP updates, NUNCA usar cache
    if (!mustRefresh && !isMSRPUpdate) {
      const cachedResult = getCachedData(cacheKey)
      if (cachedResult) {
        console.log("✅ Retornando dados do cache (validados para não-MSRP)")
        return NextResponse.json({
          success: true,
          data: cachedResult,
          cached: true,
          timestamp: Date.now()
        })
      }
    } else {
      console.log("🔥 MSRP: Ignorando cache - buscando dados frescos obrigatoriamente")
    }

    // Obter timestamp atual dos dados
    const dataTimestamp = await getDataUpdateTimestamp()
    console.log("🔥 MSRP: Data timestamp atual:", new Date(dataTimestamp).toISOString())

    // Buscar informações do dealer
    let dealerCountry = "All"
    if (dealerId) {
      const { data: dealerData, error: dealerError } = await supabase
        .from("dealers")
        .select("country")
        .eq("id", dealerId)
        .single()

      if (dealerError) {
        console.warn("⚠️ Dealer não encontrado, usando configurações globais")
      } else {
        dealerCountry = dealerData?.country || "All"
        console.log("🌍 País do dealer:", dealerCountry)
      }
    }

    // 🔧 ULTRA-CRÍTICO: Buscar preços MSRP com timestamp exato para garantir dados ultra-frescos
    let dealerPricing: any[] = []
    if (dealerId) {
      console.log(`🔥 MSRP: Buscando preços ULTRA-FRESCOS para dealer: ${dealerId}`)
      const { data: pricingData, error: pricingError } = await supabase
        .from("dealer_pricing")
        .select("*")
        .eq("dealer_id", dealerId)
        .order('updated_at', { ascending: false })

      if (pricingError) {
        console.error("❌ Erro ao buscar preços do dealer:", pricingError)
      } else if (pricingData) {
        dealerPricing = pricingData
        console.log("🔥 MSRP: Preços ULTRA-FRESCOS encontrados:", dealerPricing.length)
        
        // 🔧 SEMPRE logar preços para MSRP updates
        if (isMSRPUpdate || forceRefresh) {
          console.log("🔥 MSRP: Preços detalhados (ultra-fresh data):")
          pricingData.forEach(p => {
            console.log(`  - ${p.item_type}/${p.item_id}: USD ${p.sale_price_usd}, BRL ${p.sale_price_brl} (${p.margin_percentage}%) - Updated: ${p.updated_at}`)
          })
        }
      } else {
        console.log("🔥 MSRP: Nenhum preço encontrado para este dealer")
      }
    }

    // Função para aplicar preços MSRP do dealer
    const applyDealerPricing = (items: any[], itemType: string) => {
      console.log(`🔥 MSRP: Aplicando preços para ${itemType}, ${items.length} itens`)
      
      return items.map((item) => {
        const dealerPrice = dealerPricing.find((p) => p.item_type === itemType && String(p.item_id) === String(item.id))

        if (dealerPrice) {
          console.log(`🔥 MSRP encontrado para ${itemType} ID:${item.id} - USD: ${dealerPrice.sale_price_usd}, BRL: ${dealerPrice.sale_price_brl}`)
          return {
            ...item,
            usd: item.usd, // Manter preço dealer original
            brl: item.brl, // Manter preço dealer original
            price_usd: dealerPrice.sale_price_usd || item.usd,
            price_brl: dealerPrice.sale_price_brl || item.brl,
            sale_price_usd: dealerPrice.sale_price_usd,
            sale_price_brl: dealerPrice.sale_price_brl,
            dealer_configured: true,
            margin_percentage: dealerPrice.margin_percentage || 0,
            cost_usd: item.usd,
            cost_brl: item.brl,
          }
        }

        return {
          ...item,
          dealer_configured: false,
          cost_usd: item.usd,
          cost_brl: item.brl,
        }
      })
    }

    // Buscar modelos de barco
    const { data: boatModels, error: boatError } = await supabase.from("boat_models").select("*").order("name")

    if (boatError) {
      console.error("Erro ao buscar modelos de barco:", boatError)
      return NextResponse.json({ success: false, error: boatError.message }, { status: 500 })
    }

    // Buscar pacotes de motor (filtrados por país)
    const { data: enginePackages, error: engineError } = await supabase
      .from("engine_packages")
      .select("*")
      .order("name")

    if (engineError) {
      console.error("Erro ao buscar pacotes de motor:", engineError)
      return NextResponse.json({ success: false, error: engineError.message }, { status: 500 })
    }

    // Filtrar pacotes de motor por país
    console.log("🔍 Filtrando pacotes de motor:")
    console.log("- Total de pacotes antes do filtro:", enginePackages?.length || 0)
    console.log("- País do dealer:", dealerCountry)

    enginePackages?.forEach((pkg: any, index: number) => {
      const shouldShow =
        !pkg.countries ||
        pkg.countries.length === 0 ||
        pkg.countries.includes("All") ||
        pkg.countries.includes(dealerCountry)
      console.log(
        `- Pacote ${index + 1} "${pkg.name}": países=[${pkg.countries?.join(", ") || "nenhum"}], mostrar=${shouldShow}`,
      )
    })

    const filteredEnginePackages =
      enginePackages?.filter((pkg: any) => {
        // Se não há países configurados ou está vazio, mostrar para todos
        if (!pkg.countries || pkg.countries.length === 0) return true

        // Se contém "All", mostrar para todos os dealers
        if (pkg.countries.includes("All")) return true

        // Mostrar apenas se o país do dealer está na lista de países do pacote
        return pkg.countries.includes(dealerCountry)
      }) || []

    console.log("- Total de pacotes após filtro:", filteredEnginePackages.length)

    // Buscar cores de casco
    const { data: hullColors, error: hullError } = await supabase.from("hull_colors").select("*").order("name")

    if (hullError) {
      console.error("Erro ao buscar cores de casco:", hullError)
      return NextResponse.json({ success: false, error: hullError.message }, { status: 500 })
    }

    // Buscar pacotes de estofamento
    const { data: upholsteryPackages, error: upholsteryError } = await supabase
      .from("upholstery_packages")
      .select("*")
      .order("name")

    if (upholsteryError) {
      console.error("Erro ao buscar pacotes de estofamento:", upholsteryError)
      return NextResponse.json({ success: false, error: upholsteryError.message }, { status: 500 })
    }

    // Buscar opções adicionais (filtradas por país)
    const { data: additionalOptions, error: optionsError } = await supabase
      .from("additional_options")
      .select("*")
      .order("name")

    if (optionsError) {
      console.error("Erro ao buscar opções adicionais:", optionsError)
      return NextResponse.json({ success: false, error: optionsError.message }, { status: 500 })
    }

    // Filtrar opções adicionais por país
    const filteredAdditionalOptions =
      additionalOptions?.filter((option: any) => {
        if (!option.countries || option.countries.length === 0) return true
        return option.countries.includes("All") || option.countries.includes(dealerCountry)
      }) || []

    // Aplicar preços MSRP do dealer a todos os itens
    const processedBoatModels = applyDealerPricing(boatModels || [], "boat_model")
    const processedEnginePackages = applyDealerPricing(filteredEnginePackages, "engine_package")
    const processedHullColors = applyDealerPricing(hullColors || [], "hull_color")
    const processedUpholsteryPackages = applyDealerPricing(upholsteryPackages || [], "upholstery_package")
    const processedAdditionalOptions = applyDealerPricing(filteredAdditionalOptions, "additional_option")

    const result = {
      boatModels: processedBoatModels,
      enginePackages: processedEnginePackages,
      hullColors: processedHullColors,
      upholsteryPackages: processedUpholsteryPackages,
      additionalOptions: processedAdditionalOptions,
      dealerCountry,
      dealerPricingCount: dealerPricing.length,
    }

    console.log("🔥 MSRP: Configurações carregadas com dados ultra-frescos:")
    console.log("- Modelos de barco:", result.boatModels.length)
    console.log("- Pacotes de motor:", result.enginePackages.length)
    console.log("- Cores de casco:", result.hullColors.length)
    console.log("- Pacotes de estofamento:", result.upholsteryPackages.length)
    console.log("- Opções adicionais:", result.additionalOptions.length)
    console.log("- Preços MSRP configurados:", result.dealerPricingCount)

    // 🔧 CRÍTICO: Para atualizações MSRP, usar TTL ultra-baixo
    const cacheTimeToLive = isMSRPUpdate ? MSRP_UPDATE_CACHE_TTL : CACHE_TTL
    setCachedData(cacheKey, result, dataTimestamp, cacheTimeToLive)

    const response = NextResponse.json({
      success: true,
      data: result,
    })
    
    // 🔧 CRÍTICO: Headers ultra-agressivos para invalidar qualquer cache de cliente/proxy
    response.headers.set('X-Data-Timestamp', dataTimestamp.toString())
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('X-Accel-Expires', '0')
    
    // 🔧 NOVO: Headers específicos para MSRP updates
    if (isMSRPUpdate) {
      response.headers.set('X-MSRP-Update', 'true')
      response.headers.set('X-Fresh-Data', Date.now().toString())
      response.headers.set('X-Cache-TTL', cacheTimeToLive.toString())
    }
    
    return response
  } catch (error) {
    console.error("Erro interno:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
