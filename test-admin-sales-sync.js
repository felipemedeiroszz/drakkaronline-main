// 🧪 Script de Teste: Sincronização Admin → Sales
// Para usar: Cole este código no console do navegador em qualquer página

console.log("🧪 Iniciando teste de sincronização Admin → Sales")

// Função para simular salvamento de dados no admin
function simulateAdminSave() {
  console.log("📡 Simulando salvamento no painel admin...")
  
  // 1. Simular evento de atualização de modelos de barco
  setTimeout(() => {
    console.log("🚢 Disparando evento: boatModelsUpdate")
    const boatEvent = new CustomEvent('boatModelsUpdate', {
      detail: { 
        timestamp: Date.now(),
        action: 'update',
        source: 'test_simulation'
      }
    })
    window.dispatchEvent(boatEvent)
  }, 1000)

  // 2. Simular evento de atualização de opções
  setTimeout(() => {
    console.log("⚙️ Disparando evento: optionsDataUpdate")
    const optionsEvent = new CustomEvent('optionsDataUpdate', {
      detail: { 
        timestamp: Date.now(),
        dataType: 'enginePackages',
        action: 'update',
        source: 'test_simulation'
      }
    })
    window.dispatchEvent(optionsEvent)
  }, 2000)

  // 3. Simular evento de invalidação de cache
  setTimeout(() => {
    console.log("🧹 Disparando evento: forceCacheInvalidation")
    const cacheEvent = new CustomEvent('forceCacheInvalidation', {
      detail: { 
        timestamp: Date.now(),
        reason: 'test_admin_save',
        source: 'test_simulation'
      }
    })
    window.dispatchEvent(cacheEvent)
  }, 3000)

  // 4. Simular evento geral de admin
  setTimeout(() => {
    console.log("📊 Disparando evento: adminDataUpdate")
    const adminEvent = new CustomEvent('adminDataUpdate', {
      detail: {
        timestamp: Date.now(),
        dataTypes: ['boatModels', 'enginePackages'],
        action: 'bulk_save',
        source: 'test_simulation'
      }
    })
    window.dispatchEvent(adminEvent)
  }, 4000)

  // 5. Simular novo evento direto admin → sales
  setTimeout(() => {
    console.log("🎯 Disparando evento: adminToSalesSync")
    const salesEvent = new CustomEvent('adminToSalesSync', {
      detail: {
        timestamp: Date.now(),
        message: 'Teste de sincronização admin → sales',
        dataTypes: ['boatModels', 'enginePackages', 'hullColors'],
        source: 'test_simulation'
      }
    })
    window.dispatchEvent(salesEvent)
  }, 5000)

  // 6. Simular atualização no localStorage
  setTimeout(() => {
    console.log("💾 Atualizando localStorage: adminLastSave")
    localStorage.setItem('adminLastSave', JSON.stringify({
      timestamp: Date.now(),
      dataTypes: ['boatModels', 'enginePackages'],
      action: 'bulk_save',
      source: 'test_simulation'
    }))
  }, 6000)

  setTimeout(() => {
    console.log("✅ Teste de simulação completo!")
    console.log("📋 Verifique se a página Sales recebeu as notificações")
  }, 7000)
}

// Função para monitorar eventos na página atual
function monitorEvents() {
  const eventTypes = [
    'optionsDataUpdate',
    'boatModelsUpdate', 
    'dealerPricingUpdate',
    'adminDataUpdate',
    'forceCacheInvalidation',
    'adminToSalesSync',
    'salesSyncTest'
  ]

  console.log("👂 Configurando listeners para monitorar eventos...")

  eventTypes.forEach(eventType => {
    window.addEventListener(eventType, (event) => {
      console.log(`📡 Evento capturado: ${eventType}`, event.detail)
    })
  })

  // Monitorar mudanças no localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'adminLastSave' || event.key === 'adminDataLastUpdate') {
      console.log(`💾 LocalStorage atualizado: ${event.key}`, JSON.parse(event.newValue || '{}'))
    }
  })

  console.log("✅ Listeners configurados para monitoramento")
}

// Função para testar conectividade
function testConnectivity() {
  console.log("🔗 Testando conectividade de eventos...")
  
  const testEvent = new CustomEvent('salesSyncTest', {
    detail: { 
      timestamp: Date.now(), 
      source: 'connectivity_test',
      message: 'Teste de conectividade de eventos'
    }
  })
  window.dispatchEvent(testEvent)
  
  console.log("📤 Evento de teste disparado: salesSyncTest")
}

// Função para verificar estado atual
function checkCurrentState() {
  console.log("🔍 Verificando estado atual...")
  console.log("  - URL atual:", window.location.href)
  console.log("  - LocalStorage adminLastSave:", localStorage.getItem('adminLastSave'))
  console.log("  - LocalStorage adminDataLastUpdate:", localStorage.getItem('adminDataLastUpdate'))
  console.log("  - Conexão online:", window.navigator.onLine)
  console.log("  - User Agent:", window.navigator.userAgent.substring(0, 50) + "...")
}

// Configurar monitoramento automaticamente
monitorEvents()

// Verificar estado inicial
checkCurrentState()

// Exportar funções para uso manual
window.testAdminSalesSync = {
  simulateAdminSave,
  monitorEvents,
  testConnectivity,
  checkCurrentState
}

console.log("🎯 Teste configurado! Comandos disponíveis:")
console.log("  - testAdminSalesSync.simulateAdminSave(): Simula salvamento no admin")
console.log("  - testAdminSalesSync.testConnectivity(): Testa conectividade")
console.log("  - testAdminSalesSync.checkCurrentState(): Verifica estado atual")
console.log("")
console.log("💡 Dica: Execute 'testAdminSalesSync.simulateAdminSave()' para testar")