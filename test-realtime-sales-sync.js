// Test script para verificar sincronização em tempo real entre Admin e Sales
// Para usar: Abra este arquivo no console do navegador

console.log("🧪 Iniciando teste de sincronização em tempo real Sales <-> Admin")

// Simular eventos do painel administrativo
function simulateAdminChanges() {
  console.log("🔧 Simulando mudança em Engine Packages...")
  window.dispatchEvent(new CustomEvent('optionsDataUpdate', {
    detail: {
      timestamp: Date.now(),
      dataType: 'enginePackages',
      action: 'update'
    }
  }))

  setTimeout(() => {
    console.log("🎨 Simulando mudança em Hull Colors...")
    window.dispatchEvent(new CustomEvent('optionsDataUpdate', {
      detail: {
        timestamp: Date.now(),
        dataType: 'hullColors',
        action: 'update'
      }
    }))
  }, 2000)

  setTimeout(() => {
    console.log("🪑 Simulando mudança em Upholstery Packages...")
    window.dispatchEvent(new CustomEvent('optionsDataUpdate', {
      detail: {
        timestamp: Date.now(),
        dataType: 'upholsteryPackages',
        action: 'update'
      }
    }))
  }, 4000)

  setTimeout(() => {
    console.log("⚙️ Simulando mudança em Additional Options...")
    window.dispatchEvent(new CustomEvent('optionsDataUpdate', {
      detail: {
        timestamp: Date.now(),
        dataType: 'additionalOptions',
        action: 'update'
      }
    }))
  }, 6000)

  setTimeout(() => {
    console.log("🚢 Simulando mudança em Boat Models...")
    window.dispatchEvent(new CustomEvent('boatModelsUpdate', {
      detail: {
        timestamp: Date.now(),
        action: 'update'
      }
    }))
  }, 8000)

  setTimeout(() => {
    console.log("🧹 Simulando invalidação forçada de cache...")
    window.dispatchEvent(new CustomEvent('forceCacheInvalidation', {
      detail: {
        timestamp: Date.now(),
        reason: 'test_sync'
      }
    }))
  }, 10000)

  setTimeout(() => {
    console.log("✅ Teste de sincronização concluído!")
  }, 12000)
}

// Adicionar listeners para verificar se os eventos estão sendo capturados
function setupTestListeners() {
  const eventTypes = [
    'optionsDataUpdate',
    'boatModelsUpdate',
    'forceCacheInvalidation',
    'dealerPricingUpdate',
    'adminDataUpdate'
  ]

  eventTypes.forEach(eventType => {
    window.addEventListener(eventType, (event) => {
      console.log(`📡 Evento capturado: ${eventType}`, event.detail)
    })
  })
}

// Inicializar teste
setupTestListeners()

console.log("🎯 Event listeners configurados. Execute 'simulateAdminChanges()' para iniciar o teste.")
console.log("📋 Comandos disponíveis:")
console.log("  - simulateAdminChanges(): Simula mudanças do admin")
console.log("  - setupTestListeners(): Configura listeners de teste")

// Exportar funções para uso manual
window.testRealtimeSync = {
  simulateAdminChanges,
  setupTestListeners
}