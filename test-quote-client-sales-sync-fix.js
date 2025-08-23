/**
 * 🧪 TESTE OTIMIZADO: Sincronização BALANCEADA SALES ↔ Quote Client
 * 
 * Este script testa a nova implementação otimizada de sincronização
 * entre a página SALES e Quote Client com debounce inteligente
 * e eventos essenciais apenas.
 * 
 * Para testar:
 * 1. Abra duas abas:
 *    - Aba 1: /dealer/sales
 *    - Aba 2: /dealer/quote-client
 * 2. Execute este script no console da aba SALES
 * 3. Observe se a aba Quote Client recebe as atualizações SEM loops infinitos
 */

console.log("🧪 Iniciando teste OTIMIZADO de sincronização SALES → Quote Client")

// Simular uma atualização de preços MSRP na página SALES com sistema otimizado
function testOptimizedSync() {
  console.log("💰 Simulando atualização OTIMIZADA de preços MSRP...")
  
  // Obter dealer ID
  const dealerId = localStorage.getItem("currentDealerId")
  if (!dealerId) {
    console.error("❌ Dealer ID não encontrado no localStorage")
    return
  }
  
  console.log("🏢 Dealer ID:", dealerId)
  
  // Dados de teste
  const testData = {
    dealerId,
    itemId: '123',
    itemType: 'boat_model',
    itemName: 'Test Boat Model',
    priceUsd: 50000,
    priceBrl: 250000,
    margin: 25,
    timestamp: Date.now()
  }
  
  console.log("📊 Dados de teste:", testData)
  
  try {
    console.log("🔄 INICIANDO sequência de eventos OTIMIZADA...")
    
    // 1. EVENTO PRINCIPAL: salesPriceUpdate (IMEDIATO)
    console.log("1️⃣ Disparando evento principal: salesPriceUpdate")
    const mainEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        ...testData,
        immediate: true
      }
    })
    window.dispatchEvent(mainEvent)
    console.log("✅ Evento salesPriceUpdate disparado")
    
    // 2. MARCAR MSRP UPDATE no localStorage (IMEDIATO)
    console.log("2️⃣ Marcando MSRP update no localStorage")
    localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
      dealerId,
      timestamp: Date.now(),
      item: {
        id: testData.itemId,
        type: testData.itemType,
        name: testData.itemName,
        priceUsd: testData.priceUsd,
        priceBrl: testData.priceBrl
      }
    }))
    console.log("✅ localStorage MSRP update marcado")
    
    // 3. EVENTO SECUNDÁRIO: dealerPricingUpdate (com delay otimizado)
    setTimeout(() => {
      console.log("3️⃣ Disparando evento secundário: dealerPricingUpdate")
      const dealerEvent = new CustomEvent('dealerPricingUpdate', {
        detail: { dealerId, timestamp: Date.now(), immediate: false }
      })
      window.dispatchEvent(dealerEvent)
      console.log("✅ dealerPricingUpdate disparado")
    }, 1000) // Delay otimizado de 1 segundo
    
    console.log("🎯 Teste OTIMIZADO completo! Verifique a aba Quote Client:")
    console.log("📋 Comportamento esperado na aba Quote Client:")
    console.log("   - ✅ Atualização suave SEM loops infinitos")
    console.log("   - ✅ Sincronização em ~1-2 segundos")
    console.log("   - ✅ Notificação de atualização")
    console.log("   - ✅ Valores atualizados corretamente")
    console.log("   - ❌ SEM múltiplas chamadas excessivas")
    console.log("   - ❌ SEM indicadores de atualização infinitos")
    
    // Log de timing otimizado
    console.log("⏱️ Timeline dos eventos OTIMIZADA:")
    console.log("   - 0ms: salesPriceUpdate (evento principal)")
    console.log("   - 0ms: localStorage update")
    console.log("   - 1000ms: dealerPricingUpdate (fallback)")
    
  } catch (error) {
    console.error("❌ Erro durante o teste otimizado:", error)
  }
}

// Função para teste contínuo otimizado (para verificar estabilidade)
function testContinuousOptimized() {
  console.log("🔄 Iniciando teste contínuo OTIMIZADO (a cada 15 segundos)...")
  let counter = 1
  
  const interval = setInterval(() => {
    console.log(`\n🧪 Teste Otimizado #${counter}:`)
    testOptimizedSync()
    counter++
    
    if (counter > 3) {
      clearInterval(interval)
      console.log("🏁 Teste contínuo otimizado finalizado.")
      console.log("✅ Se não houve loops infinitos, a correção está funcionando!")
    }
  }, 15000) // Intervalo maior para evitar sobrecarga
  
  return interval
}

// Função para verificar se há sinais de loop infinito
function checkForInfiniteLoop() {
  console.log("🔍 Verificando sinais de loop infinito...")
  
  // Contador de eventos para detectar loops
  let eventCount = 0
  const eventTypes = ['salesPriceUpdate', 'dealerPricingUpdate', 'storage']
  
  const eventCounters = {}
  eventTypes.forEach(type => {
    eventCounters[type] = 0
    
    window.addEventListener(type, () => {
      eventCounters[type]++
      eventCount++
    })
  })
  
  // Verificar após 10 segundos
  setTimeout(() => {
    console.log("📊 Relatório de eventos (últimos 10s):")
    Object.entries(eventCounters).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} eventos`)
      if (count > 10) {
        console.warn(`  ⚠️ MUITOS EVENTOS: ${type} pode estar em loop!`)
      }
    })
    
    if (eventCount > 20) {
      console.error("🚨 POSSÍVEL LOOP INFINITO DETECTADO! Muitos eventos em 10s.")
    } else {
      console.log("✅ Número de eventos normal. Sincronização estável!")
    }
  }, 10000)
  
  console.log("✅ Monitor de loop iniciado. Aguarde 10s para o relatório...")
}

// Executar teste único
testOptimizedSync()

console.log("\n📝 Comandos disponíveis:")
console.log("testOptimizedSync()        - Executa um teste otimizado único")
console.log("testContinuousOptimized()  - Executa testes contínuos otimizados")
console.log("checkForInfiniteLoop()     - Monitora eventos para detectar loops")

// Disponibilizar funções globalmente para uso no console
window.testOptimizedSync = testOptimizedSync
window.testContinuousOptimized = testContinuousOptimized
window.checkForInfiniteLoop = checkForInfiniteLoop

console.log("\n🎉 Script de teste OTIMIZADO carregado!")
console.log("💡 Use checkForInfiniteLoop() para monitorar a estabilidade da sincronização")

// Auto-iniciar monitor de loop para verificação
setTimeout(() => {
  console.log("\n🔍 Iniciando monitor automático de loops...")
  checkForInfiniteLoop()
}, 2000)