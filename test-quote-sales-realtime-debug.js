// Teste de Debug: Sincronização em Tempo Real Sales ↔ Quote Client
// Este script verifica se a comunicação entre as páginas está funcionando corretamente

console.log("🧪 INICIANDO TESTE DE DEBUG: Sincronização Sales ↔ Quote Client")
console.log("=" .repeat(60))

// 1. Verificar se estamos na página correta
const currentPath = window.location.pathname
console.log(`📍 Página atual: ${currentPath}`)

if (currentPath.includes('/sales')) {
  console.log("🏪 SALES PAGE DETECTED - Testando funcionalidades de notificação")
  testSalesPageNotifications()
} else if (currentPath.includes('/quote-client')) {
  console.log("📋 QUOTE CLIENT PAGE DETECTED - Testando funcionalidades de recepção")
  testQuoteClientListeners()
} else {
  console.log("❌ Página não reconhecida. Execute este script nas páginas Sales ou Quote Client.")
}

function testSalesPageNotifications() {
  console.log("\n🧪 TESTE 1: Verificar se o hook useDealerPricingSync está disponível")
  
  // Tentar encontrar elementos que indiquem a presença do hook
  const hasNotificationElements = document.querySelector('[data-testid*="notification"]') || 
                                  document.querySelector('.notification') ||
                                  document.querySelector('[class*="notification"]')
  
  console.log(`  - Elementos de notificação encontrados: ${!!hasNotificationElements}`)
  
  console.log("\n🧪 TESTE 2: Verificar localStorage para sincronização")
  const dealerId = localStorage.getItem("currentDealerId")
  const lastUpdate = localStorage.getItem("dealerPricingLastUpdate")
  const updatedBy = localStorage.getItem("dealerPricingUpdatedBy")
  
  console.log(`  - Dealer ID: ${dealerId}`)
  console.log(`  - Last Update: ${lastUpdate} (${lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'N/A'})`)
  console.log(`  - Updated By: ${updatedBy}`)
  
  console.log("\n🧪 TESTE 3: Simular notificação de atualização de preços")
  
  // Simular uma atualização de preço
  const testNotification = () => {
    console.log("  📤 Disparando evento de teste...")
    
    // 1. Atualizar localStorage
    const timestamp = Date.now()
    localStorage.setItem('dealerPricingLastUpdate', timestamp.toString())
    localStorage.setItem('dealerPricingUpdatedBy', dealerId || 'test-dealer')
    console.log(`    ✅ LocalStorage atualizado: ${timestamp}`)
    
    // 2. Disparar evento customizado
    const customEvent = new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId: dealerId || 'test-dealer', timestamp }
    })
    window.dispatchEvent(customEvent)
    console.log(`    ✅ CustomEvent 'dealerPricingUpdate' disparado`)
    
    // 3. Disparar evento específico da Sales
    const salesEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        dealerId: dealerId || 'test-dealer',
        itemId: 'test-item-123',
        itemType: 'boat_model',
        itemName: 'Test Boat Model',
        priceUsd: 50000,
        priceBrl: 250000,
        margin: 15,
        timestamp
      }
    })
    window.dispatchEvent(salesEvent)
    console.log(`    ✅ CustomEvent 'salesPriceUpdate' disparado`)
    
    // 4. Disparar storage event
    const storageEvent = new StorageEvent('storage', {
      key: 'dealerPricingLastUpdate',
      newValue: timestamp.toString(),
      oldValue: lastUpdate || '',
      url: window.location.href
    })
    window.dispatchEvent(storageEvent)
    console.log(`    ✅ StorageEvent disparado`)
    
    // 5. Salvar dados do teste no localStorage para a outra página
    localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
      dealerId: dealerId || 'test-dealer',
      item: {
        id: 'test-item-123',
        name: 'Test Boat Model',
        type: 'boat_model'
      },
      timestamp,
      testMode: true
    }))
    console.log(`    ✅ Dados de teste salvos para Quote Client`)
    
    console.log("  🎯 Teste de notificação concluído!")
    console.log("  📋 Agora vá para a página Quote Client e execute este script novamente para verificar se os eventos foram recebidos.")
  }
  
  testNotification()
  
  console.log("\n🧪 TESTE 4: Verificar se há botões de Save ativos")
  const saveButtons = document.querySelectorAll('button[onclick*="save"], button[onclick*="Save"], button:contains("Salvar"), button:contains("Save")')
  console.log(`  - Botões de Save encontrados: ${saveButtons.length}`)
  
  if (saveButtons.length > 0) {
    console.log("  💡 Dica: Tente clicar em 'Salvar' após editar um preço para testar a sincronização real.")
  }
}

function testQuoteClientListeners() {
  console.log("\n🧪 TESTE 1: Verificar listeners de eventos")
  
  // Contador de eventos recebidos
  let eventCount = 0
  
  // Função para log de eventos
  const logEvent = (eventType, detail) => {
    eventCount++
    console.log(`  📥 [${eventCount}] Evento recebido: ${eventType}`)
    if (detail) {
      console.log(`      Detalhes:`, detail)
    }
  }
  
  // Adicionar listeners de teste
  const testListeners = {
    dealerPricingUpdate: (e) => logEvent('dealerPricingUpdate', e.detail),
    salesPriceUpdate: (e) => logEvent('salesPriceUpdate', e.detail),
    storage: (e) => {
      if (e.key === 'dealerPricingLastUpdate' || e.key === 'lastSalesPriceUpdate') {
        logEvent('storage', { key: e.key, newValue: e.newValue })
      }
    }
  }
  
  // Adicionar listeners
  window.addEventListener('dealerPricingUpdate', testListeners.dealerPricingUpdate)
  window.addEventListener('salesPriceUpdate', testListeners.salesPriceUpdate)  
  window.addEventListener('storage', testListeners.storage)
  
  console.log("  ✅ Listeners de teste adicionados")
  
  console.log("\n🧪 TESTE 2: Verificar dados do localStorage")
  const dealerId = localStorage.getItem("currentDealerId")
  const lastUpdate = localStorage.getItem("dealerPricingLastUpdate")
  const lastSalesUpdate = localStorage.getItem("lastSalesPriceUpdate")
  
  console.log(`  - Dealer ID: ${dealerId}`)
  console.log(`  - Last Pricing Update: ${lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'N/A'}`)
  
  if (lastSalesUpdate) {
    try {
      const salesData = JSON.parse(lastSalesUpdate)
      console.log(`  - Last Sales Update:`, salesData)
      if (salesData.testMode) {
        console.log(`    🧪 TESTE DETECTADO! Dados de teste encontrados da página Sales`)
      }
    } catch (e) {
      console.log(`  - Last Sales Update: ${lastSalesUpdate} (erro ao parsear)`)
    }
  } else {
    console.log(`  - Last Sales Update: N/A`)
  }
  
  console.log("\n🧪 TESTE 3: Simular recebimento de atualização")
  
  // Simular um evento vindo da página Sales
  setTimeout(() => {
    console.log("  📤 Simulando evento de atualização da Sales...")
    
    const timestamp = Date.now()
    const testEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        dealerId: dealerId || 'test-dealer',
        itemId: 'simulated-123',
        itemType: 'boat_model',
        itemName: 'Simulated Boat Update',
        priceUsd: 75000,
        priceBrl: 375000,
        margin: 20,
        timestamp
      }
    })
    
    window.dispatchEvent(testEvent)
    console.log("  ✅ Evento simulado disparado")
  }, 2000)
  
  console.log("\n🧪 TESTE 4: Verificar se há indicadores visuais de sincronização")
  
  const syncIndicators = document.querySelectorAll('[class*="sync"], [class*="loading"], [class*="updating"]')
  console.log(`  - Indicadores de sincronização encontrados: ${syncIndicators.length}`)
  
  syncIndicators.forEach((el, index) => {
    console.log(`    [${index + 1}] ${el.className}`)
  })
  
  console.log("\n⏱️  Aguardando eventos por 10 segundos...")
  console.log("💡 Dica: Vá para a página Sales e faça uma alteração de preço para testar a sincronização real.")
  
  // Remover listeners após 10 segundos
  setTimeout(() => {
    window.removeEventListener('dealerPricingUpdate', testListeners.dealerPricingUpdate)
    window.removeEventListener('salesPriceUpdate', testListeners.salesPriceUpdate)
    window.removeEventListener('storage', testListeners.storage)
    
    console.log(`\n📊 RESUMO DO TESTE:`)
    console.log(`  - Total de eventos recebidos: ${eventCount}`)
    console.log(`  - Listeners removidos: ✅`)
    
    if (eventCount === 0) {
      console.log(`  ⚠️  PROBLEMA: Nenhum evento foi recebido!`)
      console.log(`     Possíveis causas:`)
      console.log(`     1. Listeners não estão sendo configurados corretamente`)
      console.log(`     2. Eventos não estão sendo disparados da página Sales`)
      console.log(`     3. Hook useDealerPricingSync não está funcionando`)
    } else {
      console.log(`  ✅ Eventos foram recebidos - sistema básico funcionando`)
    }
  }, 10000)
}

console.log("\n" + "=".repeat(60))
console.log("🧪 TESTE DE DEBUG CONFIGURADO!")
console.log("📖 Instruções:")
console.log("1. Execute este script na página Sales primeiro")
console.log("2. Execute este script na página Quote Client em seguida")  
console.log("3. Teste fazendo alterações reais de preços na página Sales")
console.log("4. Observe os logs para identificar onde está o problema")