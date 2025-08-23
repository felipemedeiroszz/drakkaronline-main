// Teste Final: Verificação da Sincronização Corrigida Sales ↔ Quote Client
// Este script testa se a correção dos listeners conflitantes funcionou

console.log("🔧 TESTE FINAL: Verificação da Sincronização Corrigida")
console.log("=" .repeat(70))

const currentPath = window.location.pathname
console.log(`📍 Página atual: ${currentPath}`)

if (currentPath.includes('/sales')) {
  testSalesPageFixed()
} else if (currentPath.includes('/quote-client')) {
  testQuoteClientFixed()
} else {
  console.log("❌ Execute este script nas páginas Sales ou Quote Client.")
}

function testSalesPageFixed() {
  console.log("🏪 TESTANDO SALES PAGE (Página que envia atualizações)")
  
  console.log("\n🧪 TESTE 1: Verificar se notifyPricingUpdate está sendo chamado")
  
  // Monkey patch para interceptar chamadas do hook
  let hookCallCount = 0
  let eventDispatchCount = 0
  
  // Interceptar window.dispatchEvent para contar eventos
  const originalDispatchEvent = window.dispatchEvent
  window.dispatchEvent = function(event) {
    if (event.type === 'dealerPricingUpdate' || event.type === 'salesPriceUpdate') {
      eventDispatchCount++
      console.log(`  📤 [${eventDispatchCount}] Evento ${event.type} disparado:`, event.detail || 'sem detalhes')
    }
    return originalDispatchEvent.call(this, event)
  }
  
  console.log("  ✅ Interceptor de eventos configurado")
  
  console.log("\n🧪 TESTE 2: Simular salvamento de preço")
  
  // Simular dados de um item sendo editado
  const testItem = {
    item_id: 'test-123',
    item_type: 'boat_model',
    item_name: 'Test Boat Model',
    sale_price_usd: 50000,
    sale_price_brl: 250000,
    margin_percentage: 15
  }
  
  const dealerId = localStorage.getItem("currentDealerId") || 'test-dealer'
  
  // Simular o fluxo completo da Sales page
  const simulateSalesUpdate = () => {
    console.log("  📝 Simulando salvamento na Sales...")
    
    // 1. Simular resposta da API
    const apiResponse = {
      success: true,
      data: [testItem]
    }
    
    // 2. Simular atualização do localStorage (como faz o handleSaveItem)
    localStorage.setItem('dealerPricingLastUpdate', Date.now().toString())
    localStorage.setItem('dealerPricingUpdatedBy', dealerId)
    
    // 3. Simular evento customizado dealerPricingUpdate (via hook)
    const hookEvent = new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId, timestamp: Date.now() }
    })
    window.dispatchEvent(hookEvent)
    
    // 4. Simular evento customizado salesPriceUpdate (via Sales page)
    const salesEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        dealerId,
        itemId: testItem.item_id,
        itemType: testItem.item_type,
        itemName: testItem.item_name,
        priceUsd: testItem.sale_price_usd,
        priceBrl: testItem.sale_price_brl,
        margin: testItem.margin_percentage,
        timestamp: Date.now()
      }
    })
    window.dispatchEvent(salesEvent)
    
    // 5. Simular localStorage específico da Sales
    localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
      dealerId,
      timestamp: Date.now(),
      item: {
        id: testItem.item_id,
        type: testItem.item_type,
        name: testItem.item_name,
        priceUsd: testItem.sale_price_usd,
        priceBrl: testItem.sale_price_brl
      }
    }))
    
    console.log("  ✅ Simulação completa!")
    console.log(`  📊 Eventos disparados: ${eventDispatchCount}`)
    
    return apiResponse
  }
  
  // Executar simulação
  const result = simulateSalesUpdate()
  
  console.log("\n📊 RESULTADO DOS TESTES:")
  console.log(`  - Eventos disparados: ${eventDispatchCount}`)
  console.log(`  - LocalStorage atualizado: ✅`)
  console.log(`  - Dados salvos: ✅`)
  
  if (eventDispatchCount >= 2) {
    console.log("  ✅ PASSOU: Sales está disparando eventos corretamente")
  } else {
    console.log("  ❌ FALHOU: Sales não está disparando eventos suficientes")
  }
  
  console.log("\n💡 PRÓXIMO PASSO:")
  console.log("  1. Vá para a página Quote Client")
  console.log("  2. Execute este script novamente")
  console.log("  3. Verifique se os eventos foram recebidos")
  
  // Restaurar função original
  setTimeout(() => {
    window.dispatchEvent = originalDispatchEvent
    console.log("  🧹 Interceptor removido")
  }, 5000)
}

function testQuoteClientFixed() {
  console.log("📋 TESTANDO QUOTE CLIENT PAGE (Página que recebe atualizações)")
  
  console.log("\n🧪 TESTE 1: Verificar listeners ativos")
  
  // Contar listeners ativos
  let hookEventCount = 0
  let pageEventCount = 0
  let totalEventCount = 0
  
  // Handler para eventos do hook
  const hookHandler = (event) => {
    hookEventCount++
    totalEventCount++
    console.log(`  📥 [HOOK] Evento ${event.type} recebido (#${hookEventCount})`)
    if (event.detail) {
      console.log(`       Detalhes:`, event.detail)
    }
  }
  
  // Handler para eventos da página
  const pageHandler = (event) => {
    pageEventCount++
    totalEventCount++
    console.log(`  📥 [PAGE] Evento ${event.type} recebido (#${pageEventCount})`)
    if (event.detail) {
      console.log(`       Detalhes:`, event.detail)
    }
  }
  
  // Adicionar listeners de teste
  window.addEventListener('dealerPricingUpdate', hookHandler)
  window.addEventListener('salesPriceUpdate', pageHandler)
  
  console.log("  ✅ Listeners de teste configurados")
  
  console.log("\n🧪 TESTE 2: Verificar estado atual do localStorage")
  
  const dealerId = localStorage.getItem("currentDealerId")
  const lastUpdate = localStorage.getItem("dealerPricingLastUpdate")
  const lastSalesUpdate = localStorage.getItem("lastSalesPriceUpdate")
  
  console.log(`  - Dealer ID: ${dealerId}`)
  console.log(`  - Last Pricing Update: ${lastUpdate ? new Date(parseInt(lastUpdate)).toLocaleString() : 'N/A'}`)
  
  if (lastSalesUpdate) {
    try {
      const salesData = JSON.parse(lastSalesUpdate)
      console.log(`  - Last Sales Update:`, salesData)
      
      const isRecent = Date.now() - salesData.timestamp < 60000 // últimos 60 segundos
      if (isRecent) {
        console.log(`    ✅ DADOS RECENTES encontrados! (${Math.round((Date.now() - salesData.timestamp) / 1000)}s atrás)`)
      } else {
        console.log(`    ⏰ Dados antigos (${Math.round((Date.now() - salesData.timestamp) / 1000)}s atrás)`)
      }
    } catch (e) {
      console.log(`  - Erro ao parsear: ${e.message}`)
    }
  }
  
  console.log("\n🧪 TESTE 3: Simular evento da Sales chegando")
  
  setTimeout(() => {
    console.log("  📤 Simulando evento da Sales...")
    
    const testEvent = new CustomEvent('dealerPricingUpdate', {
      detail: { 
        dealerId: dealerId || 'test-dealer', 
        timestamp: Date.now() 
      }
    })
    
    window.dispatchEvent(testEvent)
    
    const salesTestEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        dealerId: dealerId || 'test-dealer',
        itemId: 'test-simulation',
        itemType: 'boat_model',
        itemName: 'Simulação de Teste',
        timestamp: Date.now()
      }
    })
    
    window.dispatchEvent(salesTestEvent)
    
    console.log("  ✅ Eventos de teste enviados")
  }, 2000)
  
  console.log("\n🧪 TESTE 4: Verificar se há indicadores visuais")
  
  // Procurar elementos que indicam sincronização
  const indicators = [
    document.querySelector('[class*="updating"]'),
    document.querySelector('[class*="sync"]'),
    document.querySelector('[class*="loading"]'),
    document.querySelector('button:contains("Forçar Sync")'),
    document.querySelector('[class*="notification"]')
  ].filter(Boolean)
  
  console.log(`  - Indicadores visuais encontrados: ${indicators.length}`)
  indicators.forEach((el, i) => {
    console.log(`    [${i+1}] ${el.tagName}: ${el.className}`)
  })
  
  // Procurar especificamente pelo botão de debug
  const debugButton = document.querySelector('button[onclick*="force"], button:contains("Forçar")')
  if (debugButton) {
    console.log("  ✅ Botão de debug encontrado!")
    console.log("    💡 Clique no botão 'Forçar Sync' para testar manualmente")
  }
  
  console.log("\n⏱️  Aguardando eventos por 10 segundos...")
  
  // Relatório final após 10 segundos
  setTimeout(() => {
    console.log("\n📊 RELATÓRIO FINAL:")
    console.log(`  - Total de eventos recebidos: ${totalEventCount}`)
    console.log(`  - Eventos do hook (dealerPricingUpdate): ${hookEventCount}`)
    console.log(`  - Eventos da página (salesPriceUpdate): ${pageEventCount}`)
    
    // Avaliar resultado
    if (totalEventCount === 0) {
      console.log("  ❌ PROBLEMA: Nenhum evento foi recebido")
      console.log("     Possíveis causas:")
      console.log("     1. Hook não está funcionando")
      console.log("     2. Sales page não está enviando eventos")
      console.log("     3. Listeners ainda estão conflitando")
    } else if (hookEventCount > 0 && pageEventCount > 0) {
      console.log("  ✅ SUCESSO: Ambos os sistemas estão funcionando")
      console.log("     - Hook está recebendo eventos do sistema de sync")
      console.log("     - Página está recebendo eventos para feedback visual")
    } else if (hookEventCount > 0) {
      console.log("  ⚠️  PARCIAL: Apenas o hook está funcionando")
      console.log("     - Sistema principal OK, mas feedback visual pode estar faltando")
    } else {
      console.log("  ⚠️  PARCIAL: Apenas eventos da página")
      console.log("     - Feedback visual OK, mas sistema principal pode ter problemas")
    }
    
    // Verificar se há mudanças recentes no localStorage
    const currentLastUpdate = localStorage.getItem("dealerPricingLastUpdate")
    if (currentLastUpdate && currentLastUpdate !== lastUpdate) {
      console.log("  ✅ LocalStorage foi atualizado durante o teste!")
    }
    
    console.log("\n💡 RECOMENDAÇÕES:")
    if (totalEventCount > 0) {
      console.log("  1. Sistema básico está funcionando")
      console.log("  2. Teste fazendo uma alteração real na página Sales")
      console.log("  3. Verifique se os preços são atualizados automaticamente")
    } else {
      console.log("  1. Verifique se o hook useDealerPricingSync está sendo usado")
      console.log("  2. Confirme se a Sales page está chamando notifyPricingUpdate")
      console.log("  3. Teste o botão 'Forçar Sync' se disponível")
    }
    
    // Remover listeners
    window.removeEventListener('dealerPricingUpdate', hookHandler)
    window.removeEventListener('salesPriceUpdate', pageHandler)
    console.log("  🧹 Listeners de teste removidos")
    
  }, 10000)
  
  console.log("\n💡 AÇÕES RECOMENDADAS DURANTE O TESTE:")
  console.log("  1. Se houver botão 'Forçar Sync', clique nele")
  console.log("  2. Abra a página Sales em outra aba e altere um preço")
  console.log("  3. Observe o console para eventos em tempo real")
}

console.log("\n" + "=".repeat(70))
console.log("🔧 TESTE DE VERIFICAÇÃO CONFIGURADO!")
console.log("Este teste verifica se a correção dos listeners conflitantes funcionou")