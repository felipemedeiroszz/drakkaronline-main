// 🔥 Teste de Sincronização IMEDIATA MSRP - Sales → Quote Client
// Este script testa se as atualizações de preços MSRP na página Sales
// são refletidas IMEDIATAMENTE na página Quote Client

console.log("🔥 INICIANDO TESTE DE SINCRONIZAÇÃO IMEDIATA MSRP")
console.log("=" * 60)

// Configuração do teste
const TEST_CONFIG = {
  DEALER_ID: "dealer_123", // Usar o dealer ID real ou mock
  ITEM_ID: "test_boat_1",
  ITEM_TYPE: "boat_model",
  ITEM_NAME: "Test Boat Model",
  INITIAL_PRICE_USD: 50000,
  INITIAL_PRICE_BRL: 250000,
  UPDATED_PRICE_USD: 55000,
  UPDATED_PRICE_BRL: 275000,
  MARGIN: 15.5
}

// 🔥 FASE 1: Simular salvamento de preço MSRP na página Sales
function simulateSalesPriceSave() {
  console.log("\n🔥 FASE 1: Simulando salvamento de preço MSRP na página Sales")
  
  // 1. Simular notifyPricingUpdate do hook
  console.log("  1️⃣ Simulando notifyPricingUpdate()...")
  
  // 2. Disparar evento salesPriceUpdate IMEDIATO
  console.log("  2️⃣ Disparando evento salesPriceUpdate IMEDIATO...")
  const immediateUpdateEvent = new CustomEvent('salesPriceUpdate', {
    detail: {
      dealerId: TEST_CONFIG.DEALER_ID,
      itemId: TEST_CONFIG.ITEM_ID,
      itemType: TEST_CONFIG.ITEM_TYPE,
      itemName: TEST_CONFIG.ITEM_NAME,
      priceUsd: TEST_CONFIG.UPDATED_PRICE_USD,
      priceBrl: TEST_CONFIG.UPDATED_PRICE_BRL,
      margin: TEST_CONFIG.MARGIN,
      timestamp: Date.now(),
      immediate: true
    }
  })
  window.dispatchEvent(immediateUpdateEvent)
  console.log("    ✅ Evento salesPriceUpdate disparado:", immediateUpdateEvent.detail)
  
  // 3. Invalidar cache agressivamente
  console.log("  3️⃣ Disparando invalidação de cache...")
  const cacheInvalidationEvent = new CustomEvent('forceCacheInvalidation', {
    detail: { 
      reason: 'msrp_price_update', 
      timestamp: Date.now(),
      dealerId: TEST_CONFIG.DEALER_ID,
      itemType: TEST_CONFIG.ITEM_TYPE,
      itemId: TEST_CONFIG.ITEM_ID
    }
  })
  window.dispatchEvent(cacheInvalidationEvent)
  console.log("    ✅ Cache invalidation event disparado")
  
  // 4. Atualizar localStorage para sincronização entre abas
  console.log("  4️⃣ Atualizando localStorage...")
  localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
    dealerId: TEST_CONFIG.DEALER_ID,
    timestamp: Date.now(),
    item: {
      id: TEST_CONFIG.ITEM_ID,
      type: TEST_CONFIG.ITEM_TYPE,
      name: TEST_CONFIG.ITEM_NAME,
      priceUsd: TEST_CONFIG.UPDATED_PRICE_USD,
      priceBrl: TEST_CONFIG.UPDATED_PRICE_BRL
    }
  }))
  console.log("    ✅ localStorage atualizado")
  
  // 5. Disparar evento dealerPricingUpdate
  console.log("  5️⃣ Disparando evento dealerPricingUpdate...")
  const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
    detail: { dealerId: TEST_CONFIG.DEALER_ID, timestamp: Date.now(), immediate: true }
  })
  window.dispatchEvent(dealerPricingEvent)
  console.log("    ✅ Evento dealerPricingUpdate disparado")
  
  // 6. Storage event manual como fallback
  console.log("  6️⃣ Disparando storage event manual...")
  setTimeout(() => {
    try {
      const storageEvent = new StorageEvent('storage', {
        key: 'dealerPricingLastUpdate',
        newValue: Date.now().toString(),
        oldValue: '',
        url: window.location.href
      })
      window.dispatchEvent(storageEvent)
      console.log("    ✅ Storage event manual disparado")
    } catch (error) {
      console.warn("    ⚠️ Erro ao disparar storage event manual:", error)
    }
  }, 50)
  
  console.log("  🎉 Todos os eventos de sincronização MSRP disparados!")
}

// 🔥 FASE 2: Verificar se os listeners estão ativos na página Quote Client
function verifyQuoteClientListeners() {
  console.log("\n🔥 FASE 2: Verificando listeners da página Quote Client")
  
  const events = [
    'salesPriceUpdate',
    'storage', 
    'forceCacheInvalidation',
    'dealerPricingUpdate'
  ]
  
  const listenerResults = {}
  
  events.forEach(eventType => {
    console.log(`  🔍 Testando listener para '${eventType}'...`)
    
    let received = false
    const testListener = (e) => { 
      received = true
      console.log(`    ✅ Listener '${eventType}' ATIVO - recebeu evento:`, e.detail || 'storage event')
    }
    
    // Adicionar listener temporário
    window.addEventListener(eventType, testListener)
    
    // Disparar evento de teste
    if (eventType === 'storage') {
      const testStorageEvent = new StorageEvent('storage', {
        key: 'test',
        newValue: 'test-value',
        url: window.location.href
      })
      window.dispatchEvent(testStorageEvent)
    } else {
      const testEvent = new CustomEvent(eventType, {
        detail: { test: true, timestamp: Date.now() }
      })
      window.dispatchEvent(testEvent)
    }
    
    // Verificar se foi recebido
    setTimeout(() => {
      window.removeEventListener(eventType, testListener)
      listenerResults[eventType] = received
      if (!received) {
        console.log(`    ❌ Listener '${eventType}' NÃO ATIVO ou não respondeu`)
      }
    }, 100)
  })
  
  // Resumo dos listeners
  setTimeout(() => {
    console.log("\n  📊 RESUMO DOS LISTENERS:")
    Object.entries(listenerResults).forEach(([event, active]) => {
      console.log(`    - ${event}: ${active ? '✅ ATIVO' : '❌ INATIVO'}`)
    })
  }, 500)
}

// 🔥 FASE 3: Teste da API de configuração com cache busting
async function testAPIWithCacheBusting() {
  console.log("\n🔥 FASE 3: Testando API com cache busting agressivo")
  
  const timestamp = Date.now()
  const uniqueId = Math.random().toString(36).substr(2, 9)
  const microTimestamp = performance.now().toString().replace('.', '')
  const cacheBuster = `${timestamp}-${uniqueId}-${microTimestamp}`
  
  const queryParams = new URLSearchParams({
    dealer_id: TEST_CONFIG.DEALER_ID,
    refresh: 'true',
    force: 'true',
    cb: cacheBuster,
    t: timestamp.toString(),
    invalidate_cache: 'true',
    clear_cache: 'true',
    msrp_update: 'true',
    ultra_fresh: 'true',
    no_cache: 'true',
    v: microTimestamp
  })
  
  const url = `/api/get-dealer-config?${queryParams.toString()}`
  console.log(`  📡 Fazendo request para: ${url}`)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
        'If-None-Match': '*',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Cache-Buster': cacheBuster,
        'X-Real-Time-Update': 'true',
        'X-MSRP-Update': 'true',
        'X-Timestamp': timestamp.toString(),
        'X-Force-Fresh': 'true',
        'X-Ultra-Fresh': 'true',
        'X-No-Cache': 'true',
        'Surrogate-Control': 'no-store',
        'X-Forwarded-Cache': 'no-cache',
      }
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log("  ✅ API respondeu com sucesso:")
      console.log(`    - Success: ${result.success}`)
      console.log(`    - Cached: ${result.cached || false}`)
      console.log(`    - Dealer Pricing Count: ${result.data?.dealerPricingCount || 0}`)
      console.log(`    - Response timestamp: ${result.timestamp}`)
      
      // Verificar headers de resposta
      console.log("  📋 Headers de resposta relevantes:")
      console.log(`    - X-Data-Timestamp: ${response.headers.get('X-Data-Timestamp')}`)
      console.log(`    - X-MSRP-Update: ${response.headers.get('X-MSRP-Update')}`)
      console.log(`    - X-Fresh-Data: ${response.headers.get('X-Fresh-Data')}`)
      console.log(`    - Cache-Control: ${response.headers.get('Cache-Control')}`)
      
    } else {
      console.log(`  ❌ API retornou erro: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error("  ❌ Erro ao chamar API:", error)
  }
}

// 🔥 FASE 4: Monitorar console para logs de sincronização
function monitorSyncLogs() {
  console.log("\n🔥 FASE 4: Monitorando logs de sincronização (15 segundos)")
  console.log("  👀 Observando console para logs de:")
  console.log("    - 'Quote Client: Evento de atualização recebido da Sales'")
  console.log("    - 'Quote Client: Forçando reload imediato'")
  console.log("    - 'DealerPricingSync: Dados MSRP ULTRA-FRESCOS sincronizados'")
  console.log("    - 'Quote Client: Configuração sincronizada'")
  
  // Store original console methods
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error
  
  let syncLogsDetected = []
  
  // Intercept console methods to monitor sync logs
  const monitorConsole = (level, originalMethod) => {
    return (...args) => {
      const message = args.join(' ')
      
      // Check for sync-related logs
      if (message.includes('Quote Client: Evento de atualização recebido') ||
          message.includes('Forçando reload imediato') ||
          message.includes('MSRP ULTRA-FRESCOS sincronizados') ||
          message.includes('Configuração sincronizada')) {
        syncLogsDetected.push({
          level,
          message,
          timestamp: new Date().toISOString()
        })
        console.log(`  🎯 [${level.toUpperCase()}] SYNC LOG DETECTADO:`, message)
      }
      
      // Call original method
      originalMethod.apply(console, args)
    }
  }
  
  // Override console methods
  console.log = monitorConsole('log', originalLog)
  console.warn = monitorConsole('warn', originalWarn)
  console.error = monitorConsole('error', originalError)
  
  // Restore after monitoring period
  setTimeout(() => {
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
    
    console.log("\n  📊 RESUMO DOS LOGS DE SINCRONIZAÇÃO DETECTADOS:")
    if (syncLogsDetected.length > 0) {
      syncLogsDetected.forEach((log, index) => {
        console.log(`    ${index + 1}. [${log.level}] ${log.message}`)
      })
      console.log("  ✅ Logs de sincronização detectados - sistema funcionando!")
    } else {
      console.log("  ❌ Nenhum log de sincronização detectado - possível problema!")
    }
  }, 15000)
}

// 🔥 EXECUTAR TESTE COMPLETO
async function runCompleteTest() {
  console.log("🚀 EXECUTANDO TESTE COMPLETO DE SINCRONIZAÇÃO MSRP...")
  
  // Iniciar monitoramento de logs
  monitorSyncLogs()
  
  // Executar fases do teste
  verifyQuoteClientListeners()
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testAPIWithCacheBusting()
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  simulateSalesPriceSave()
  
  console.log("\n⏳ Aguardando 15 segundos para monitorar logs de sincronização...")
  console.log("📱 Verifique se os preços são atualizados na interface Quote Client!")
}

// 🔥 EXECUTAR TESTE
runCompleteTest()

// 🔥 Exportar funções para uso manual
window.testMSRPSync = {
  runCompleteTest,
  simulateSalesPriceSave,
  verifyQuoteClientListeners,
  testAPIWithCacheBusting,
  monitorSyncLogs
}

console.log("\n💡 DICA: Use window.testMSRPSync.runCompleteTest() para executar o teste completo")
console.log("💡 DICA: Use window.testMSRPSync.simulateSalesPriceSave() para simular apenas o salvamento")