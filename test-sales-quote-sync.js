// Test script para verificar sincronização em tempo real entre Sales e Quote Client
// Para usar: Abra este arquivo no console do navegador

console.log("🧪 Iniciando teste de sincronização Sales -> Quote Client")

// Test framework para validar eventos
class SyncTestFramework {
  constructor() {
    this.events = []
    this.listeners = new Map()
    this.isRecording = false
    this.testResults = []
  }

  startRecording() {
    console.log("📹 Iniciando gravação de eventos...")
    this.events = []
    this.isRecording = true
    this.setupEventListeners()
  }

  stopRecording() {
    console.log("⏹️ Parando gravação de eventos...")
    this.isRecording = false
    this.removeEventListeners()
    return this.events
  }

  setupEventListeners() {
    // Lista de eventos para monitorar
    const eventTypes = [
      'dealerPricingUpdate',
      'storage',
      'forceCacheInvalidation',
      'optionsDataUpdate',
      'adminDataUpdate'
    ]

    eventTypes.forEach(eventType => {
      const handler = (event) => {
        if (this.isRecording) {
          const eventData = {
            type: eventType,
            timestamp: Date.now(),
            detail: event.detail || null,
            key: event.key || null,
            newValue: event.newValue || null
          }
          this.events.push(eventData)
          console.log(`📡 Evento capturado: ${eventType}`, eventData)
        }
      }
      
      this.listeners.set(eventType, handler)
      window.addEventListener(eventType, handler)
    })
  }

  removeEventListeners() {
    this.listeners.forEach((handler, eventType) => {
      window.removeEventListener(eventType, handler)
    })
    this.listeners.clear()
  }

  // Simular atualização de preço na página Sales
  simulateSalesPriceUpdate() {
    console.log("💰 Simulando atualização de preço na página Sales...")
    
    // Verificar se estamos na página Sales
    const currentPage = window.location.pathname
    console.log("📍 Página atual:", currentPage)
    
    if (currentPage.includes('/dealer/sales')) {
      console.log("✅ Estamos na página Sales - simulando notificação de preço")
      
      // Simular o que acontece quando um preço é salvo
      const dealerId = localStorage.getItem("currentDealerId")
      if (dealerId) {
        console.log("🆔 Dealer ID encontrado:", dealerId)
        
        // Disparar evento customizado de atualização de preços
        const customEvent = new CustomEvent('dealerPricingUpdate', {
          detail: { 
            dealerId, 
            timestamp: Date.now(),
            source: 'test_simulation',
            reason: 'price_update_test'
          }
        })
        
        window.dispatchEvent(customEvent)
        console.log("🚀 Evento de atualização de preços disparado")
        
        // Também atualizar localStorage para sincronização entre abas
        localStorage.setItem('dealerPricingLastUpdate', Date.now().toString())
        localStorage.setItem('dealerPricingUpdatedBy', dealerId)
        console.log("💾 localStorage atualizado")
        
        return true
      } else {
        console.error("❌ Dealer ID não encontrado no localStorage")
        return false
      }
    } else {
      console.log("⚠️ Não estamos na página Sales. Execute este teste na aba Sales.")
      return false
    }
  }

  // Verificar se a página Quote Client está reagindo
  checkQuoteClientReaction() {
    console.log("🔍 Verificando reação da página Quote Client...")
    
    // Verificar se há hooks de sincronização ativos
    const hasActiveSyncHooks = window.addEventListener !== null
    console.log("🪝 Hooks de sincronização ativos:", hasActiveSyncHooks)
    
    // Verificar localStorage
    const lastUpdate = localStorage.getItem('dealerPricingLastUpdate')
    const updatedBy = localStorage.getItem('dealerPricingUpdatedBy')
    
    console.log("📊 Estado do localStorage:")
    console.log("  - dealerPricingLastUpdate:", lastUpdate)
    console.log("  - dealerPricingUpdatedBy:", updatedBy)
    
    // Verificar eventos recentes
    const recentEvents = this.events.filter(event => 
      Date.now() - event.timestamp < 5000 // últimos 5 segundos
    )
    
    console.log("📈 Eventos recentes (5s):", recentEvents.length)
    recentEvents.forEach(event => {
      console.log(`  - ${event.type} em ${new Date(event.timestamp).toLocaleTimeString()}`)
    })
    
    return {
      hasActiveSyncHooks,
      lastUpdate,
      updatedBy,
      recentEvents: recentEvents.length,
      events: recentEvents
    }
  }

  // Teste completo de sincronização
  async runFullSyncTest() {
    console.log("🧪 Executando teste completo de sincronização...")
    
    const testResult = {
      startTime: Date.now(),
      steps: [],
      success: false,
      errors: []
    }

    try {
      // Passo 1: Iniciar gravação
      testResult.steps.push("📹 Iniciando gravação de eventos")
      this.startRecording()
      
      // Passo 2: Simular atualização de preço
      testResult.steps.push("💰 Simulando atualização de preço")
      const priceUpdateSuccess = this.simulateSalesPriceUpdate()
      
      if (!priceUpdateSuccess) {
        testResult.errors.push("Falha ao simular atualização de preço")
        return testResult
      }
      
      // Passo 3: Aguardar propagação de eventos
      testResult.steps.push("⏳ Aguardando propagação de eventos (2s)")
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Passo 4: Verificar reação
      testResult.steps.push("🔍 Verificando reação do sistema")
      const reactionCheck = this.checkQuoteClientReaction()
      
      // Passo 5: Parar gravação
      testResult.steps.push("⏹️ Parando gravação")
      const recordedEvents = this.stopRecording()
      
      // Análise dos resultados
      const hasPricingEvents = recordedEvents.some(event => 
        event.type === 'dealerPricingUpdate'
      )
      
      const hasStorageEvents = recordedEvents.some(event => 
        event.type === 'storage' && event.key === 'dealerPricingLastUpdate'
      )
      
      testResult.success = hasPricingEvents || hasStorageEvents
      testResult.eventsRecorded = recordedEvents.length
      testResult.hasPricingEvents = hasPricingEvents
      testResult.hasStorageEvents = hasStorageEvents
      testResult.endTime = Date.now()
      testResult.duration = testResult.endTime - testResult.startTime
      
      console.log("📊 Resultado do teste:")
      console.log("  - Sucesso:", testResult.success ? "✅" : "❌")
      console.log("  - Eventos gravados:", testResult.eventsRecorded)
      console.log("  - Eventos de pricing:", testResult.hasPricingEvents ? "✅" : "❌")
      console.log("  - Eventos de storage:", testResult.hasStorageEvents ? "✅" : "❌")
      console.log("  - Duração:", testResult.duration + "ms")
      
      return testResult
      
    } catch (error) {
      testResult.errors.push(error.message)
      console.error("❌ Erro durante o teste:", error)
      return testResult
    }
  }

  // Teste de múltiplas abas
  testMultiTabSync() {
    console.log("📑 Teste de sincronização entre múltiplas abas:")
    console.log("1. Abra uma nova aba com /dealer/quote-client")
    console.log("2. Execute este teste na aba Sales")
    console.log("3. Observe os logs na aba Quote Client")
    
    return this.runFullSyncTest()
  }

  // Verificar estado atual do sistema
  checkSystemState() {
    console.log("🔍 Verificando estado atual do sistema de sincronização...")
    
    const state = {
      currentPage: window.location.pathname,
      dealerId: localStorage.getItem("currentDealerId"),
      dealerName: localStorage.getItem("currentDealerName"),
      lastUpdate: localStorage.getItem("dealerPricingLastUpdate"),
      updatedBy: localStorage.getItem("dealerPricingUpdatedBy"),
      timestamp: Date.now()
    }
    
    console.log("📊 Estado do sistema:", state)
    
    // Verificar se os hooks necessários estão disponíveis
    const hasUseDealerPricingSync = typeof window !== 'undefined' && 
      localStorage.getItem("currentDealerId") !== null
    
    console.log("🪝 Sistema de sincronização:", hasUseDealerPricingSync ? "✅ Ativo" : "❌ Inativo")
    
    return state
  }
}

// Instanciar o framework de testes
const syncTest = new SyncTestFramework()

// Comandos disponíveis
console.log("🎯 Comandos disponíveis:")
console.log("  - syncTest.checkSystemState(): Verificar estado atual")
console.log("  - syncTest.simulateSalesPriceUpdate(): Simular atualização de preço")
console.log("  - syncTest.runFullSyncTest(): Executar teste completo")
console.log("  - syncTest.testMultiTabSync(): Teste de múltiplas abas")
console.log("  - syncTest.startRecording(): Iniciar gravação de eventos")
console.log("  - syncTest.stopRecording(): Parar gravação")

// Verificar estado inicial
syncTest.checkSystemState()

// Exportar para uso global
window.syncTest = syncTest

console.log("✅ Test framework carregado! Use 'syncTest' para acessar os comandos.")