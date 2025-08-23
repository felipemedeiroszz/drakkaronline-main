/**
 * 🧪 TESTE: Sincronização em Tempo Real SALES ↔ Quote Client
 * 
 * Este script testa se as alterações na página SALES são refletidas
 * automaticamente na página Quote Client em tempo real.
 * 
 * Para testar:
 * 1. Abra duas abas:
 *    - Aba 1: /dealer/sales
 *    - Aba 2: /dealer/quote-client
 * 2. Execute este script no console da aba SALES
 * 3. Observe se a aba Quote Client recebe as atualizações automaticamente
 */

console.log("🧪 Iniciando teste de sincronização SALES → Quote Client")

// Simular uma atualização de preços na página SALES
function testRealtimeSync() {
  console.log("📡 Simulando atualização de preços...")
  
  // Obter dealer ID
  const dealerId = localStorage.getItem("currentDealerId")
  if (!dealerId) {
    console.error("❌ Dealer ID não encontrado no localStorage")
    return
  }
  
  console.log("🏢 Dealer ID:", dealerId)
  
  // Simular notificação de atualização (como seria feito na página SALES)
  try {
    // 1. Atualizar timestamp no localStorage
    const timestamp = Date.now()
    localStorage.setItem('dealerPricingLastUpdate', timestamp.toString())
    localStorage.setItem('dealerPricingUpdatedBy', dealerId)
    console.log("✅ LocalStorage atualizado:", {
      dealerPricingLastUpdate: timestamp,
      dealerPricingUpdatedBy: dealerId
    })
    
    // 2. Disparar evento customizado
    const customEvent = new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId, timestamp }
    })
    window.dispatchEvent(customEvent)
    console.log("✅ Evento customizado disparado:", customEvent.detail)
    
    // 3. Disparar storage event para outras abas
    const storageEvent = new StorageEvent('storage', {
      key: 'dealerPricingLastUpdate',
      newValue: timestamp.toString(),
      oldValue: '',
      url: window.location.href
    })
    setTimeout(() => {
      window.dispatchEvent(storageEvent)
      console.log("✅ Storage event disparado para outras abas")
    }, 100)
    
    console.log("🎯 Teste completo! Verifique a aba Quote Client para ver se recebeu a atualização.")
    console.log("📋 Logs esperados na aba Quote Client:")
    console.log("   - 📡 Quote Client: Real-time update detected, reloading dealer config...")
    console.log("   - 🔄 DealerPricingSync: Recebida notificação de atualização")
    console.log("   - 🔄 Quote Client: Atualizando configuração devido à sincronização de preços")
    console.log("   - ✅ Quote Client: Configuração sincronizada com sucesso via hook!")
    
  } catch (error) {
    console.error("❌ Erro durante o teste:", error)
  }
}

// Função para testar continuamente
function testContinuous() {
  console.log("🔄 Iniciando teste contínuo (a cada 5 segundos)...")
  let counter = 1
  
  const interval = setInterval(() => {
    console.log(`\n🧪 Teste #${counter}:`)
    testRealtimeSync()
    counter++
    
    if (counter > 5) {
      clearInterval(interval)
      console.log("🏁 Teste contínuo finalizado.")
    }
  }, 5000)
  
  return interval
}

// Executar teste único
testRealtimeSync()

console.log("\n📝 Comandos disponíveis:")
console.log("testRealtimeSync()     - Executa um teste único")
console.log("testContinuous()      - Executa testes contínuos")

// Disponibilizar funções globalmente para uso no console
window.testRealtimeSync = testRealtimeSync
window.testContinuous = testContinuous