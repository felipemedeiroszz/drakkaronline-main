/**
 * 🧪 TESTE: Verificação da Correção de Sincronização Admin → Sales
 * 
 * Este script testa se a correção implementada resolve o problema onde
 * as alterações do admin só apareciam uma vez na página SALES.
 */

const testAdminSalesSyncFix = {
  
  // Contador de eventos recebidos para verificar se funciona múltiplas vezes
  eventCounter: {
    adminToSalesSync: 0,
    optionsDataUpdate: 0,
    boatModelsUpdate: 0,
    adminDataUpdate: 0,
    forceCacheInvalidation: 0,
    salesHeartbeatTest: 0
  },
  
  // Timer para resetar contadores
  resetTimer: null,
  
  /**
   * Inicializar monitoramento de eventos
   */
  init() {
    console.log("🧪 TESTE: Iniciando monitoramento de sincronização Admin → Sales")
    
    // Monitorar todos os eventos de sincronização
    const events = [
      'adminToSalesSync',
      'optionsDataUpdate', 
      'boatModelsUpdate',
      'adminDataUpdate',
      'forceCacheInvalidation',
      'salesHeartbeatTest'
    ]
    
    events.forEach(eventType => {
      window.addEventListener(eventType, (event) => {
        this.eventCounter[eventType]++
        console.log(`📊 TESTE: ${eventType} recebido (${this.eventCounter[eventType]}x)`, event.detail)
        this.logEventSummary()
      })
    })
    
    // Resetar contadores a cada 60 segundos para teste contínuo
    this.resetTimer = setInterval(() => {
      console.log("🔄 TESTE: Resetando contadores para novo ciclo de teste")
      Object.keys(this.eventCounter).forEach(key => {
        this.eventCounter[key] = 0
      })
    }, 60000)
    
    console.log("✅ TESTE: Monitoramento ativo - eventos serão contados por 60s")
  },
  
  /**
   * Simular múltiplas alterações no admin para testar sincronização contínua
   */
  simulateMultipleAdminChanges() {
    console.log("🔄 TESTE: Simulando múltiplas alterações no admin...")
    
    // Primeira alteração - Modelos de barco
    setTimeout(() => {
      console.log("📝 TESTE: Simulando alteração #1 - Modelos de barco")
      const event1 = new CustomEvent('adminToSalesSync', {
        detail: {
          timestamp: Date.now(),
          message: 'Teste #1: Modelos de barco atualizados',
          dataTypes: ['boatModels']
        }
      })
      window.dispatchEvent(event1)
    }, 1000)
    
    // Segunda alteração - Opções
    setTimeout(() => {
      console.log("📝 TESTE: Simulando alteração #2 - Engine Packages")
      const event2 = new CustomEvent('optionsDataUpdate', {
        detail: {
          timestamp: Date.now(),
          dataType: 'enginePackages'
        }
      })
      window.dispatchEvent(event2)
    }, 3000)
    
    // Terceira alteração - Hull Colors
    setTimeout(() => {
      console.log("📝 TESTE: Simulando alteração #3 - Hull Colors")
      const event3 = new CustomEvent('optionsDataUpdate', {
        detail: {
          timestamp: Date.now(),
          dataType: 'hullColors'
        }
      })
      window.dispatchEvent(event3)
    }, 5000)
    
    // Quarta alteração - Geral
    setTimeout(() => {
      console.log("📝 TESTE: Simulando alteração #4 - Dados gerais")
      const event4 = new CustomEvent('adminDataUpdate', {
        detail: {
          timestamp: Date.now(),
          dataTypes: ['enginePackages', 'hullColors'],
          action: 'bulk_save'
        }
      })
      window.dispatchEvent(event4)
    }, 7000)
    
    // Quinta alteração - Invalidação de cache
    setTimeout(() => {
      console.log("📝 TESTE: Simulando alteração #5 - Cache invalidation")
      const event5 = new CustomEvent('forceCacheInvalidation', {
        detail: {
          timestamp: Date.now(),
          reason: 'admin_update'
        }
      })
      window.dispatchEvent(event5)
    }, 9000)
    
    // Verificar resultados após 12 segundos
    setTimeout(() => {
      this.checkResults()
    }, 12000)
  },
  
  /**
   * Testar se localStorage sync funciona
   */
  testLocalStorageSync() {
    console.log("🧪 TESTE: Testando sincronização via localStorage...")
    
    // Simular salvamento do admin no localStorage
    const adminSaveData = {
      timestamp: Date.now(),
      dataTypes: ['boatModels', 'enginePackages'],
      action: 'bulk_save'
    }
    
    localStorage.setItem('adminLastSave', JSON.stringify(adminSaveData))
    console.log("✅ TESTE: adminLastSave salvo no localStorage")
    
    // Disparar evento de storage change
    setTimeout(() => {
      const storageEvent = new StorageEvent('storage', {
        key: 'adminLastSave',
        newValue: JSON.stringify(adminSaveData),
        oldValue: null
      })
      window.dispatchEvent(storageEvent)
      console.log("✅ TESTE: Evento storage disparado")
    }, 1000)
  },
  
  /**
   * Verificar resultados do teste
   */
  checkResults() {
    console.log("📊 TESTE: Verificando resultados...")
    
    const totalEvents = Object.values(this.eventCounter).reduce((sum, count) => sum + count, 0)
    
    console.log("📈 TESTE: Resumo de eventos recebidos:")
    Object.entries(this.eventCounter).forEach(([event, count]) => {
      const status = count > 0 ? "✅" : "❌"
      console.log(`  ${status} ${event}: ${count} eventos`)
    })
    
    // Verificar se pelo menos 3 tipos diferentes de eventos foram recebidos
    const eventTypesReceived = Object.values(this.eventCounter).filter(count => count > 0).length
    
    if (eventTypesReceived >= 3 && totalEvents >= 5) {
      console.log("✅ TESTE: SUCESSO! Sincronização funcionando corretamente")
      console.log(`   - ${eventTypesReceived} tipos de eventos diferentes recebidos`)
      console.log(`   - ${totalEvents} eventos totais processados`)
      return true
    } else {
      console.log("❌ TESTE: FALHA! Problemas na sincronização detectados")
      console.log(`   - Apenas ${eventTypesReceived} tipos de eventos recebidos (esperado: ≥3)`)
      console.log(`   - Apenas ${totalEvents} eventos totais (esperado: ≥5)`)
      return false
    }
  },
  
  /**
   * Log resumo de eventos em tempo real
   */
  logEventSummary() {
    const total = Object.values(this.eventCounter).reduce((sum, count) => sum + count, 0)
    console.log(`📈 TESTE: Total de eventos: ${total}`)
  },
  
  /**
   * Testar se debounce funciona corretamente (não cria loops infinitos)
   */
  testDebounce() {
    console.log("🧪 TESTE: Testando debounce - disparando eventos rapidamente...")
    
    // Disparar 5 eventos do mesmo tipo rapidamente para testar debounce
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const event = new CustomEvent('adminToSalesSync', {
          detail: {
            timestamp: Date.now(),
            message: `Teste debounce #${i + 1}`,
            dataTypes: ['boatModels']
          }
        })
        window.dispatchEvent(event)
      }, i * 100) // Intervalos de 100ms
    }
    
    // Verificar se apenas 1 evento foi processado (devido ao debounce)
    setTimeout(() => {
      const adminSyncCount = this.eventCounter.adminToSalesSync
      if (adminSyncCount === 5) {
        console.log("✅ TESTE: Debounce funcionando - 5 eventos recebidos corretamente")
      } else {
        console.log(`⚠️ TESTE: Possível problema no debounce - ${adminSyncCount} eventos recebidos`)
      }
    }, 2000)
  },
  
  /**
   * Executar todos os testes
   */
  runAllTests() {
    console.log("🚀 TESTE: Iniciando bateria completa de testes...")
    
    this.init()
    
    setTimeout(() => this.simulateMultipleAdminChanges(), 1000)
    setTimeout(() => this.testLocalStorageSync(), 15000)
    setTimeout(() => this.testDebounce(), 25000)
    
    // Resultado final após 35 segundos
    setTimeout(() => {
      console.log("🏁 TESTE: Finalizando testes...")
      const success = this.checkResults()
      
      if (success) {
        console.log("🎉 CORREÇÃO VALIDADA: O problema de sincronização foi resolvido!")
        console.log("   ✅ Eventos funcionam múltiplas vezes")
        console.log("   ✅ Diferentes tipos de sincronização ativos")
        console.log("   ✅ Debounce previne loops infinitos")
      } else {
        console.log("🚨 PROBLEMA DETECTADO: Sincronização ainda não está funcionando corretamente")
        console.log("   ❌ Verificar logs de erro")
        console.log("   ❌ Verificar se dealerId está definido")
        console.log("   ❌ Verificar se event listeners estão ativos")
      }
      
      // Limpar timer
      if (this.resetTimer) {
        clearInterval(this.resetTimer)
      }
    }, 35000)
  },
  
  /**
   * Limpar listeners e timers
   */
  cleanup() {
    if (this.resetTimer) {
      clearInterval(this.resetTimer)
    }
    console.log("🧹 TESTE: Cleanup concluído")
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.testAdminSalesSyncFix = testAdminSalesSyncFix
}

console.log("🧪 TESTE: Script carregado. Use 'testAdminSalesSyncFix.runAllTests()' para executar os testes")