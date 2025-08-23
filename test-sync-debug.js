// Script de debug para verificar sincronização entre SALES e Quote Client
// Para usar: Cole este código no console do navegador em cada aba

console.log("🔍 Debug de Sincronização SALES ↔ Quote Client")
console.log("=" .repeat(50))

// Função para monitorar eventos
function setupSyncMonitor() {
  const events = []
  let isMonitoring = true
  
  // Monitorar eventos customizados
  window.addEventListener('dealerPricingUpdate', (event) => {
    const log = {
      type: 'dealerPricingUpdate',
      time: new Date().toLocaleTimeString(),
      detail: event.detail,
      page: window.location.pathname
    }
    events.push(log)
    console.log("📡 Evento dealerPricingUpdate detectado:", log)
  })
  
  // Monitorar mudanças no localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'dealerPricingLastUpdate') {
      const log = {
        type: 'storage',
        time: new Date().toLocaleTimeString(),
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        page: window.location.pathname
      }
      events.push(log)
      console.log("💾 Storage event detectado:", log)
    }
  })
  
  // Monitorar invalidação de cache
  window.addEventListener('forceCacheInvalidation', (event) => {
    const log = {
      type: 'forceCacheInvalidation',
      time: new Date().toLocaleTimeString(),
      detail: event.detail,
      page: window.location.pathname
    }
    events.push(log)
    console.log("🧹 Cache invalidation detectado:", log)
  })
  
  console.log("✅ Monitor de sincronização ativado")
  console.log("📍 Página atual:", window.location.pathname)
  
  return {
    getEvents: () => events,
    stopMonitoring: () => {
      isMonitoring = false
      console.log("⏹️ Monitor desativado")
    }
  }
}

// Função para verificar estado atual
function checkSyncState() {
  console.log("\n📊 Estado Atual da Sincronização")
  console.log("-".repeat(40))
  
  const dealerId = localStorage.getItem("currentDealerId")
  const lastUpdate = localStorage.getItem("dealerPricingLastUpdate")
  const updatedBy = localStorage.getItem("dealerPricingUpdatedBy")
  
  console.log("🆔 Dealer ID:", dealerId || "❌ Não encontrado")
  console.log("⏰ Última atualização:", lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : "❌ Nunca")
  console.log("👤 Atualizado por:", updatedBy || "❌ Desconhecido")
  console.log("📍 Página atual:", window.location.pathname)
  
  // Verificar se está na página correta
  const isSalesPage = window.location.pathname.includes('/dealer/sales')
  const isQuotePage = window.location.pathname.includes('/dealer/quote-client')
  
  if (isSalesPage) {
    console.log("✅ Você está na página SALES")
    console.log("💡 Dica: Edite um preço e salve para testar a sincronização")
  } else if (isQuotePage) {
    console.log("✅ Você está na página Quote Client")
    console.log("💡 Dica: Esta página deve receber atualizações automáticas")
  } else {
    console.log("⚠️ Você não está em SALES nem Quote Client")
  }
  
  return {
    dealerId,
    lastUpdate,
    updatedBy,
    isSalesPage,
    isQuotePage
  }
}

// Função para simular uma atualização de preço (apenas para teste)
function simulatePriceUpdate() {
  const dealerId = localStorage.getItem("currentDealerId")
  
  if (!dealerId) {
    console.error("❌ Dealer ID não encontrado. Faça login primeiro.")
    return
  }
  
  console.log("🚀 Simulando atualização de preço...")
  console.log("  - Dealer ID:", dealerId)
  
  // Disparar evento customizado
  const customEvent = new CustomEvent('dealerPricingUpdate', {
    detail: { 
      dealerId, 
      timestamp: Date.now(),
      source: 'manual_test'
    }
  })
  
  window.dispatchEvent(customEvent)
  console.log("✅ Evento dealerPricingUpdate disparado")
  
  // Atualizar localStorage
  const timestamp = Date.now().toString()
  localStorage.setItem('dealerPricingLastUpdate', timestamp)
  localStorage.setItem('dealerPricingUpdatedBy', dealerId)
  console.log("✅ localStorage atualizado")
  
  // Forçar storage event (para teste na mesma aba)
  setTimeout(() => {
    const storageEvent = new StorageEvent('storage', {
      key: 'dealerPricingLastUpdate',
      newValue: timestamp,
      oldValue: null,
      url: window.location.href
    })
    window.dispatchEvent(storageEvent)
    console.log("✅ Storage event disparado (fallback)")
  }, 100)
}

// Função para verificar se o hook está ativo
function checkHookStatus() {
  console.log("\n🪝 Verificando Status dos Hooks")
  console.log("-".repeat(40))
  
  // Tentar acessar o React DevTools (se disponível)
  try {
    const hasReactDevTools = window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    if (hasReactDevTools) {
      console.log("✅ React DevTools detectado")
    } else {
      console.log("⚠️ React DevTools não detectado")
    }
  } catch (e) {
    console.log("⚠️ Não foi possível verificar React DevTools")
  }
  
  // Verificar se há listeners ativos
  const listeners = window.getEventListeners ? window.getEventListeners(window) : null
  if (listeners) {
    console.log("📡 Event Listeners ativos:")
    Object.keys(listeners).forEach(eventType => {
      if (eventType.includes('dealer') || eventType === 'storage') {
        console.log(`  - ${eventType}: ${listeners[eventType].length} listeners`)
      }
    })
  } else {
    console.log("⚠️ getEventListeners não disponível (use Chrome DevTools)")
  }
}

// Função principal para executar todos os testes
function runSyncDiagnostics() {
  console.clear()
  console.log("🏥 DIAGNÓSTICO COMPLETO DE SINCRONIZAÇÃO")
  console.log("=".repeat(50))
  
  // 1. Verificar estado
  const state = checkSyncState()
  
  // 2. Verificar hooks
  checkHookStatus()
  
  // 3. Configurar monitor
  const monitor = setupSyncMonitor()
  
  console.log("\n📋 INSTRUÇÕES DE TESTE")
  console.log("-".repeat(40))
  
  if (state.isSalesPage) {
    console.log("1. Edite um preço MSRP em qualquer item")
    console.log("2. Clique em 'Salvar'")
    console.log("3. Execute 'monitor.getEvents()' para ver eventos capturados")
    console.log("4. Verifique a aba Quote Client para ver se atualizou")
  } else if (state.isQuotePage) {
    console.log("1. Mantenha esta aba aberta")
    console.log("2. Vá para a aba SALES e edite um preço")
    console.log("3. Execute 'monitor.getEvents()' aqui para ver eventos recebidos")
    console.log("4. Verifique se os preços foram atualizados automaticamente")
  }
  
  console.log("\n🛠️ COMANDOS DISPONÍVEIS:")
  console.log("  - checkSyncState(): Verificar estado atual")
  console.log("  - simulatePriceUpdate(): Simular atualização (teste)")
  console.log("  - monitor.getEvents(): Ver eventos capturados")
  console.log("  - monitor.stopMonitoring(): Parar monitoramento")
  
  return {
    state,
    monitor,
    checkSyncState,
    simulatePriceUpdate,
    checkHookStatus
  }
}

// Executar diagnóstico automaticamente
const syncDebug = runSyncDiagnostics()

// Exportar para uso global
window.syncDebug = syncDebug

console.log("\n✅ Debug carregado! Use 'syncDebug' para acessar as ferramentas.")