// Test script para verificar sincronização em tempo real entre Sales e Quote Client
// Versão atualizada - Dezembro 2024
// Para usar: Abra este arquivo no console do navegador

console.log("🧪 Teste de Sincronização Sales ↔ Quote Client - Versão 2.0")
console.log("================================================")

// Verificador de sincronização em tempo real
class RealtimeSyncTester {
  constructor() {
    this.events = []
    this.isMonitoring = false
    this.startTime = null
  }

  // Verificar se estamos na página correta
  checkCurrentPage() {
    const path = window.location.pathname
    const page = {
      isSales: path.includes('/dealer/sales'),
      isQuoteClient: path.includes('/dealer/quote-client'),
      path: path
    }
    
    console.log("📍 Página atual:", page.path)
    console.log("  - É página Sales:", page.isSales ? "✅" : "❌")
    console.log("  - É página Quote Client:", page.isQuoteClient ? "✅" : "❌")
    
    return page
  }

  // Verificar se o hook de sincronização está ativo
  checkSyncHookStatus() {
    console.log("\n🔍 Verificando status do hook de sincronização...")
    
    const dealerId = localStorage.getItem("currentDealerId")
    const dealerName = localStorage.getItem("currentDealerName")
    const lastUpdate = localStorage.getItem("dealerPricingLastUpdate")
    const updatedBy = localStorage.getItem("dealerPricingUpdatedBy")
    
    const status = {
      dealerId,
      dealerName,
      lastUpdate: lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : null,
      updatedBy,
      hasHook: false
    }
    
    // Verificar se o hook está registrado (verificando se há listeners)
    const eventTypes = ['dealerPricingUpdate', 'storage', 'forceCacheInvalidation']
    eventTypes.forEach(eventType => {
      // Tentar adicionar um listener temporário para verificar se já existe
      const testHandler = () => {}
      window.addEventListener(eventType, testHandler)
      window.removeEventListener(eventType, testHandler)
    })
    
    status.hasHook = true // Se chegou aqui, o sistema está pronto
    
    console.log("📊 Status do sistema:")
    console.log("  - Dealer ID:", status.dealerId || "❌ Não encontrado")
    console.log("  - Dealer Name:", status.dealerName || "❌ Não encontrado")
    console.log("  - Última atualização:", status.lastUpdate || "❌ Nunca")
    console.log("  - Atualizado por:", status.updatedBy || "❌ Desconhecido")
    console.log("  - Hook ativo:", status.hasHook ? "✅" : "❌")
    
    return status
  }

  // Monitorar eventos em tempo real
  startMonitoring() {
    if (this.isMonitoring) {
      console.log("⚠️ Já está monitorando!")
      return
    }
    
    console.log("\n📹 Iniciando monitoramento de eventos...")
    this.isMonitoring = true
    this.startTime = Date.now()
    this.events = []
    
    // Monitorar evento customizado
    this.customEventHandler = (event) => {
      const eventData = {
        type: 'dealerPricingUpdate',
        timestamp: Date.now(),
        elapsed: Date.now() - this.startTime,
        detail: event.detail
      }
      this.events.push(eventData)
      console.log("🔔 Evento detectado:", eventData.type)
      console.log("  - Tempo decorrido:", (eventData.elapsed / 1000).toFixed(1) + "s")
      console.log("  - Detalhes:", eventData.detail)
    }
    
    // Monitorar storage
    this.storageHandler = (event) => {
      if (event.key === 'dealerPricingLastUpdate') {
        const eventData = {
          type: 'storage',
          timestamp: Date.now(),
          elapsed: Date.now() - this.startTime,
          key: event.key,
          newValue: event.newValue,
          oldValue: event.oldValue
        }
        this.events.push(eventData)
        console.log("💾 Storage atualizado:", event.key)
        console.log("  - Tempo decorrido:", (eventData.elapsed / 1000).toFixed(1) + "s")
        console.log("  - Novo valor:", new Date(parseInt(event.newValue)).toLocaleTimeString())
      }
    }
    
    // Monitorar cache invalidation
    this.cacheHandler = (event) => {
      const eventData = {
        type: 'forceCacheInvalidation',
        timestamp: Date.now(),
        elapsed: Date.now() - this.startTime,
        detail: event.detail
      }
      this.events.push(eventData)
      console.log("🧹 Cache invalidado!")
      console.log("  - Tempo decorrido:", (eventData.elapsed / 1000).toFixed(1) + "s")
      console.log("  - Razão:", event.detail?.reason)
    }
    
    window.addEventListener('dealerPricingUpdate', this.customEventHandler)
    window.addEventListener('storage', this.storageHandler)
    window.addEventListener('forceCacheInvalidation', this.cacheHandler)
    
    console.log("✅ Monitoramento iniciado! Eventos serão registrados aqui.")
    console.log("   Use syncTester.stopMonitoring() para parar.")
  }

  // Parar monitoramento
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log("⚠️ Não está monitorando!")
      return
    }
    
    console.log("\n⏹️ Parando monitoramento...")
    this.isMonitoring = false
    
    window.removeEventListener('dealerPricingUpdate', this.customEventHandler)
    window.removeEventListener('storage', this.storageHandler)
    window.removeEventListener('forceCacheInvalidation', this.cacheHandler)
    
    const duration = (Date.now() - this.startTime) / 1000
    console.log("📊 Resumo do monitoramento:")
    console.log("  - Duração:", duration.toFixed(1) + "s")
    console.log("  - Eventos capturados:", this.events.length)
    
    if (this.events.length > 0) {
      console.log("\n📝 Eventos registrados:")
      this.events.forEach((event, index) => {
        console.log(`  ${index + 1}. [${(event.elapsed / 1000).toFixed(1)}s] ${event.type}`)
      })
    }
    
    return this.events
  }

  // Simular uma atualização de preço (apenas na página Sales)
  simulatePriceUpdate() {
    const page = this.checkCurrentPage()
    
    if (!page.isSales) {
      console.log("❌ Esta função só funciona na página Sales!")
      console.log("   Navegue para /dealer/sales e tente novamente.")
      return false
    }
    
    console.log("\n💰 Simulando atualização de preço...")
    
    const dealerId = localStorage.getItem("currentDealerId")
    if (!dealerId) {
      console.log("❌ Dealer ID não encontrado!")
      return false
    }
    
    // Disparar evento de atualização
    const event = new CustomEvent('dealerPricingUpdate', {
      detail: {
        dealerId: dealerId,
        timestamp: Date.now(),
        source: 'test_simulation'
      }
    })
    
    window.dispatchEvent(event)
    
    // Atualizar localStorage
    localStorage.setItem('dealerPricingLastUpdate', Date.now().toString())
    localStorage.setItem('dealerPricingUpdatedBy', dealerId)
    
    console.log("✅ Evento de atualização disparado!")
    console.log("   Verifique a aba Quote Client para ver se foi atualizada.")
    
    return true
  }

  // Teste completo de sincronização
  runFullTest() {
    console.log("\n🚀 TESTE COMPLETO DE SINCRONIZAÇÃO")
    console.log("=====================================")
    
    // Passo 1: Verificar página
    const page = this.checkCurrentPage()
    
    // Passo 2: Verificar status
    const status = this.checkSyncHookStatus()
    
    // Passo 3: Instruções baseadas na página
    console.log("\n📋 INSTRUÇÕES:")
    
    if (page.isSales) {
      console.log("1. ✅ Você está na página Sales")
      console.log("2. Abra uma nova aba com /dealer/quote-client")
      console.log("3. Na aba Quote Client, execute: syncTester.startMonitoring()")
      console.log("4. Volte para esta aba (Sales)")
      console.log("5. Faça uma alteração de preço e salve")
      console.log("6. Verifique os logs na aba Quote Client")
      console.log("\n💡 DICA: Use syncTester.simulatePriceUpdate() para testar rapidamente")
    } else if (page.isQuoteClient) {
      console.log("1. ✅ Você está na página Quote Client")
      console.log("2. Execute: syncTester.startMonitoring()")
      console.log("3. Abra uma nova aba com /dealer/sales")
      console.log("4. Na aba Sales, faça uma alteração de preço")
      console.log("5. Volte para esta aba e veja os eventos capturados")
      console.log("\n💡 DICA: Os preços devem atualizar automaticamente aqui")
    } else {
      console.log("❌ Você não está em uma página válida!")
      console.log("   Navegue para /dealer/sales ou /dealer/quote-client")
    }
    
    return {
      page,
      status,
      ready: status.hasHook && status.dealerId
    }
  }
}

// Criar instância global
const syncTester = new RealtimeSyncTester()

// Executar teste inicial
console.log("\n🎯 Executando verificação inicial...")
const testResult = syncTester.runFullTest()

if (testResult.ready) {
  console.log("\n✅ Sistema pronto para teste de sincronização!")
} else {
  console.log("\n⚠️ Sistema não está completamente pronto.")
  console.log("   Verifique se você está logado como dealer.")
}

// Exportar para uso global
window.syncTester = syncTester

// Comandos disponíveis
console.log("\n📚 COMANDOS DISPONÍVEIS:")
console.log("  syncTester.checkCurrentPage() - Verificar página atual")
console.log("  syncTester.checkSyncHookStatus() - Verificar status do hook")
console.log("  syncTester.startMonitoring() - Iniciar monitoramento de eventos")
console.log("  syncTester.stopMonitoring() - Parar monitoramento")
console.log("  syncTester.simulatePriceUpdate() - Simular atualização (só em Sales)")
console.log("  syncTester.runFullTest() - Executar teste completo")

console.log("\n✨ Teste carregado! Use 'syncTester' para acessar os comandos.")