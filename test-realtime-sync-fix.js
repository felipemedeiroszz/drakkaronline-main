// Script de Teste: Verificação da Sincronização em Tempo Real Sales ↔ Quote Client
// Execute este script no console do navegador para testar a sincronização

console.log("🧪 TESTE DE SINCRONIZAÇÃO EM TEMPO REAL")
console.log("=" .repeat(60))

// Detectar página atual
const currentPath = window.location.pathname
const isSalesPage = currentPath.includes('/sales')
const isQuoteClientPage = currentPath.includes('/quote-client')

console.log(`📍 Página atual: ${currentPath}`)
console.log(`   - É página Sales: ${isSalesPage}`)
console.log(`   - É página Quote Client: ${isQuoteClientPage}`)

// Função para verificar listeners ativos
function checkActiveListeners() {
  console.log("\n🔍 VERIFICANDO LISTENERS ATIVOS:")
  
  // Verificar se há listeners para eventos customizados
  const eventTypes = ['dealerPricingUpdate', 'salesPriceUpdate', 'storage']
  
  eventTypes.forEach(eventType => {
    // Criar um evento de teste
    const testEvent = eventType === 'storage' 
      ? new StorageEvent('storage', { key: 'test' })
      : new CustomEvent(eventType, { detail: { test: true } })
    
    // Contar quantos listeners respondem
    let listenerCount = 0
    const originalDispatch = window.dispatchEvent
    window.dispatchEvent = function(event) {
      if (event.type === eventType) {
        listenerCount++
      }
      return originalDispatch.call(this, event)
    }
    
    try {
      window.dispatchEvent(testEvent)
      console.log(`   ✅ ${eventType}: ${listenerCount > 0 ? 'ATIVO' : 'INATIVO'}`)
    } catch (e) {
      console.log(`   ❌ ${eventType}: Erro ao testar`)
    }
    
    window.dispatchEvent = originalDispatch
  })
}

// Função para verificar estado do localStorage
function checkLocalStorage() {
  console.log("\n📦 ESTADO DO LOCALSTORAGE:")
  
  const keys = [
    'currentDealerId',
    'dealerPricingLastUpdate',
    'dealerPricingUpdatedBy',
    'lastSalesPriceUpdate'
  ]
  
  keys.forEach(key => {
    const value = localStorage.getItem(key)
    if (value) {
      if (key.includes('Update') && !isNaN(value)) {
        const date = new Date(parseInt(value))
        console.log(`   - ${key}: ${date.toLocaleTimeString()} (${value})`)
      } else if (key === 'lastSalesPriceUpdate') {
        try {
          const data = JSON.parse(value)
          console.log(`   - ${key}: ${JSON.stringify(data, null, 2)}`)
        } catch {
          console.log(`   - ${key}: ${value}`)
        }
      } else {
        console.log(`   - ${key}: ${value}`)
      }
    } else {
      console.log(`   - ${key}: NÃO DEFINIDO`)
    }
  })
}

// Função para simular atualização de preço (Sales)
function simulatePriceUpdate() {
  if (!isSalesPage) {
    console.log("❌ Esta função só funciona na página Sales")
    return
  }
  
  console.log("\n🚀 SIMULANDO ATUALIZAÇÃO DE PREÇO NA PÁGINA SALES:")
  
  const dealerId = localStorage.getItem('currentDealerId')
  if (!dealerId) {
    console.log("❌ Dealer ID não encontrado")
    return
  }
  
  // Simular evento de atualização
  const updateEvent = new CustomEvent('salesPriceUpdate', {
    detail: {
      dealerId: dealerId,
      itemId: 'test-item-123',
      itemType: 'boat_model',
      itemName: 'Teste Barco XYZ',
      priceUsd: 50000,
      priceBrl: 250000,
      margin: 25,
      timestamp: Date.now()
    }
  })
  
  // Disparar evento
  window.dispatchEvent(updateEvent)
  console.log("   ✅ Evento salesPriceUpdate disparado")
  
  // Atualizar localStorage
  const storageData = {
    dealerId: dealerId,
    timestamp: Date.now(),
    item: {
      id: 'test-item-123',
      type: 'boat_model',
      name: 'Teste Barco XYZ',
      priceUsd: 50000,
      priceBrl: 250000
    }
  }
  localStorage.setItem('lastSalesPriceUpdate', JSON.stringify(storageData))
  console.log("   ✅ LocalStorage atualizado")
  
  // Notificar via dealerPricingUpdate
  const pricingEvent = new CustomEvent('dealerPricingUpdate', {
    detail: { dealerId: dealerId, timestamp: Date.now() }
  })
  window.dispatchEvent(pricingEvent)
  console.log("   ✅ Evento dealerPricingUpdate disparado")
  
  // Atualizar localStorage de pricing
  localStorage.setItem('dealerPricingLastUpdate', Date.now().toString())
  localStorage.setItem('dealerPricingUpdatedBy', dealerId)
  console.log("   ✅ LocalStorage de pricing atualizado")
  
  console.log("\n✅ Simulação completa! Verifique a aba Quote Client para ver se recebeu a atualização.")
}

// Função para verificar recepção (Quote Client)
function checkReception() {
  if (!isQuoteClientPage) {
    console.log("❌ Esta função só funciona na página Quote Client")
    return
  }
  
  console.log("\n📡 VERIFICANDO RECEPÇÃO DE ATUALIZAÇÕES:")
  
  // Adicionar listener temporário para verificar
  let receivedUpdate = false
  
  const testListener = (event) => {
    console.log("   ✅ EVENTO RECEBIDO:", event.type, event.detail)
    receivedUpdate = true
  }
  
  window.addEventListener('salesPriceUpdate', testListener)
  window.addEventListener('dealerPricingUpdate', testListener)
  
  console.log("   🎯 Listeners de teste adicionados. Aguardando eventos...")
  console.log("   💡 Dica: Vá para a aba Sales e execute: simulatePriceUpdate()")
  
  // Remover listeners após 30 segundos
  setTimeout(() => {
    window.removeEventListener('salesPriceUpdate', testListener)
    window.removeEventListener('dealerPricingUpdate', testListener)
    console.log("   🧹 Listeners de teste removidos após 30 segundos")
    if (!receivedUpdate) {
      console.log("   ⚠️ Nenhum evento recebido no período de teste")
    }
  }, 30000)
}

// Menu de funções disponíveis
console.log("\n📋 FUNÇÕES DISPONÍVEIS:")
console.log("   - checkActiveListeners() : Verificar listeners ativos")
console.log("   - checkLocalStorage()    : Verificar estado do localStorage")
if (isSalesPage) {
  console.log("   - simulatePriceUpdate()  : Simular atualização de preço")
}
if (isQuoteClientPage) {
  console.log("   - checkReception()       : Verificar recepção de eventos")
}

// Executar verificações básicas automaticamente
checkActiveListeners()
checkLocalStorage()

// Instruções finais
console.log("\n📖 INSTRUÇÕES DE TESTE:")
console.log("1. Abra duas abas do navegador")
console.log("2. Aba 1: Navegue para /dealer/sales")
console.log("3. Aba 2: Navegue para /dealer/quote-client")
console.log("4. Na aba Sales, execute: simulatePriceUpdate()")
console.log("5. Verifique se a aba Quote Client recebeu a atualização")
console.log("\n💡 Para debug detalhado, ative o console verbose nas duas abas")

// Exportar funções para o escopo global
window.syncTest = {
  checkActiveListeners,
  checkLocalStorage,
  simulatePriceUpdate: isSalesPage ? simulatePriceUpdate : undefined,
  checkReception: isQuoteClientPage ? checkReception : undefined
}

console.log("\n✅ Script carregado! Use window.syncTest para acessar as funções")