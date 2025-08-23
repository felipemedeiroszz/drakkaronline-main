/**
 * 🔥 TESTE DE VERIFICAÇÃO: Sincronização MSRP Quote Client ↔ Sales
 * 
 * Este script testa se a página quote-client SEMPRE busca valores MSRP atualizados da página sales
 * 
 * Para testar:
 * 1. Abra a página Sales (/dealer/sales)
 * 2. Abra a página Quote Client (/dealer/quote-client) em outra aba
 * 3. Execute este script no console de qualquer aba
 * 4. Observe os logs e eventos sendo disparados
 */

console.log("🧪 INICIANDO TESTE DE SINCRONIZAÇÃO MSRP")

// Simular atualização de preço MSRP na página Sales
function testMSRPUpdate() {
  console.log("🔥 TESTE: Simulando atualização de preço MSRP...")
  
  const dealerId = localStorage.getItem("currentDealerId") || "test-dealer"
  const timestamp = Date.now()
  
  // 1. Marcar localStorage como se um preço MSRP foi atualizado
  const msrpUpdateData = {
    dealerId: dealerId,
    timestamp: timestamp,
    item: {
      id: "test-boat-model-1",
      type: "boat_model",
      name: "Test Boat Model",
      priceUsd: 25000,
      priceBrl: 125000
    }
  }
  
  localStorage.setItem('lastSalesPriceUpdate', JSON.stringify(msrpUpdateData))
  console.log("✅ TESTE: localStorage MSRP update marcado:", msrpUpdateData)
  
  // 2. Disparar evento customizado de atualização MSRP
  const msrpUpdateEvent = new CustomEvent('salesPriceUpdate', {
    detail: {
      dealerId: dealerId,
      itemId: "test-boat-model-1",
      itemType: "boat_model",
      itemName: "Test Boat Model",
      priceUsd: 25000,
      priceBrl: 125000,
      margin: 15.5,
      timestamp: timestamp,
      immediate: true,
      msrpUpdate: true,
      forceSync: true,
      apiMetadata: {
        msrpUpdate: true,
        updateTimestamp: new Date().toISOString()
      }
    }
  })
  
  window.dispatchEvent(msrpUpdateEvent)
  console.log("✅ TESTE: Evento salesPriceUpdate MSRP disparado:", msrpUpdateEvent.detail)
  
  // 3. Disparar evento de invalidação de cache
  const cacheInvalidationEvent = new CustomEvent('forceCacheInvalidation', {
    detail: { 
      reason: 'msrp_test_update', 
      timestamp: timestamp,
      dealerId: dealerId
    }
  })
  
  window.dispatchEvent(cacheInvalidationEvent)
  console.log("✅ TESTE: Evento forceCacheInvalidation disparado:", cacheInvalidationEvent.detail)
  
  // 4. Notificar hook de pricing sync
  const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
    detail: { dealerId: dealerId, timestamp: timestamp, immediate: true }
  })
  
  window.dispatchEvent(dealerPricingEvent)
  console.log("✅ TESTE: Evento dealerPricingUpdate disparado:", dealerPricingEvent.detail)
  
  console.log("🧪 TESTE COMPLETO: Todos os eventos MSRP disparados")
  console.log("👀 VERIFIQUE: Se você está na página Quote Client, deve ver notificações e atualizações")
  
  return {
    success: true,
    dealerId: dealerId,
    timestamp: timestamp,
    events: ['salesPriceUpdate', 'forceCacheInvalidation', 'dealerPricingUpdate'],
    localStorage: 'lastSalesPriceUpdate updated'
  }
}

// Verificar se há listeners ativos para eventos MSRP
function checkMSRPListeners() {
  console.log("🔍 VERIFICANDO: Listeners de eventos MSRP...")
  
  const events = ['salesPriceUpdate', 'dealerPricingUpdate', 'forceCacheInvalidation']
  
  events.forEach(eventType => {
    const testEvent = new CustomEvent(eventType, {
      detail: { test: true, timestamp: Date.now() }
    })
    
    console.log(`🔍 Testando listener para: ${eventType}`)
    window.dispatchEvent(testEvent)
  })
  
  console.log("✅ VERIFICAÇÃO: Eventos de teste disparados - verifique logs para ver se foram capturados")
}

// Verificar estado atual do localStorage relacionado a MSRP
function checkMSRPState() {
  console.log("📊 VERIFICANDO: Estado atual MSRP no localStorage...")
  
  const msrpKeys = [
    'lastSalesPriceUpdate',
    'dealerPricingLastUpdate',
    'dealerPricingUpdatedBy',
    'currentDealerId'
  ]
  
  const state = {}
  
  msrpKeys.forEach(key => {
    const value = localStorage.getItem(key)
    state[key] = value ? JSON.parse(value) : null
    console.log(`📊 ${key}:`, state[key])
  })
  
  return state
}

// Simular múltiplas atualizações MSRP em sequência
function testMSRPBurst() {
  console.log("🚀 TESTE: Simulando rajada de atualizações MSRP...")
  
  const dealerId = localStorage.getItem("currentDealerId") || "test-dealer"
  const baseTimestamp = Date.now()
  
  // Simular 5 atualizações em sequência com pequenos intervalos
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const timestamp = baseTimestamp + (i * 100)
      
      const msrpEvent = new CustomEvent('salesPriceUpdate', {
        detail: {
          dealerId: dealerId,
          itemId: `test-item-${i}`,
          itemType: "boat_model",
          itemName: `Test Item ${i}`,
          priceUsd: 20000 + (i * 1000),
          priceBrl: 100000 + (i * 5000),
          margin: 15.5,
          timestamp: timestamp,
          immediate: true,
          msrpUpdate: true,
          forceSync: true
        }
      })
      
      window.dispatchEvent(msrpEvent)
      console.log(`🚀 TESTE BURST ${i + 1}/5: Evento MSRP disparado`, msrpEvent.detail)
    }, i * 200) // 200ms entre cada evento
  }
  
  console.log("🚀 TESTE BURST: 5 eventos MSRP agendados com intervalos de 200ms")
  console.log("👀 VERIFIQUE: Quote Client deve processar todos sem conflitos")
}

// Função principal de teste
function runMSRPSyncTest() {
  console.log("🧪 ==============================================")
  console.log("🧪 EXECUTANDO SUITE COMPLETA DE TESTES MSRP")
  console.log("🧪 ==============================================")
  
  console.log("\n1️⃣ Verificando estado inicial...")
  checkMSRPState()
  
  console.log("\n2️⃣ Verificando listeners ativos...")
  checkMSRPListeners()
  
  console.log("\n3️⃣ Testando atualização MSRP única...")
  const singleTestResult = testMSRPUpdate()
  
  console.log("\n4️⃣ Aguardando 3 segundos antes do teste de rajada...")
  setTimeout(() => {
    console.log("\n5️⃣ Testando rajada de atualizações MSRP...")
    testMSRPBurst()
    
    setTimeout(() => {
      console.log("\n6️⃣ Verificando estado final...")
      checkMSRPState()
      
      console.log("\n🧪 ==============================================")
      console.log("🧪 SUITE DE TESTES MSRP COMPLETA")
      console.log("🧪 ==============================================")
      console.log("✅ Se você está na página Quote Client, deve ter visto:")
      console.log("   - Notificações de atualização MSRP")
      console.log("   - Indicadores visuais de carregamento")
      console.log("   - Logs de sincronização nos DevTools")
      console.log("🧪 ==============================================")
    }, 3000)
  }, 3000)
  
  return singleTestResult
}

// Expor funções globalmente para uso manual
window.testMSRPUpdate = testMSRPUpdate
window.checkMSRPListeners = checkMSRPListeners
window.checkMSRPState = checkMSRPState
window.testMSRPBurst = testMSRPBurst
window.runMSRPSyncTest = runMSRPSyncTest

console.log("🧪 TESTES MSRP CARREGADOS!")
console.log("📋 FUNÇÕES DISPONÍVEIS:")
console.log("   - runMSRPSyncTest()     // Executa suite completa")
console.log("   - testMSRPUpdate()      // Testa uma atualização MSRP")
console.log("   - checkMSRPListeners()  // Verifica listeners ativos")
console.log("   - checkMSRPState()      // Verifica estado localStorage")
console.log("   - testMSRPBurst()       // Testa múltiplas atualizações")
console.log("🚀 Execute: runMSRPSyncTest() para começar!")