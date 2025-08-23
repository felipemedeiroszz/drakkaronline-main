// 🔥 TESTE DE SINCRONIZAÇÃO EM TEMPO REAL - VALORES DESTACADOS EM AZUL
// Este script verifica se os valores MSRP destacados em azul forte estão sendo
// atualizados em tempo real entre as páginas SALES e QUOTE CLIENT

console.log("🔥 INICIANDO TESTE DE SINCRONIZAÇÃO VALORES AZUL FORTE")
console.log("=" * 60)

// Configuração do teste
const MSRP_SYNC_TEST = {
  DEALER_ID: "test_dealer_123",
  TEST_ITEMS: [
    {
      id: "drakkar_200_bb",
      name: "DRAKKAR 200 BB",
      type: "boat_model",
      current_price_brl: 130171.00,
      new_price_brl: 290201.33,  // Este é o valor destacado em azul na print
      current_price_usd: 26000,
      new_price_usd: 58000,
      margin: 123.0
    },
    {
      id: "drakkar_255_cc", 
      name: "DRAKKAR 255 CC",
      type: "boat_model",
      current_price_brl: 386818.00,
      new_price_brl: 420000.00,
      current_price_usd: 77000,
      new_price_usd: 84000,
      margin: 120.0
    }
  ],
  PAGES_TO_TEST: ['SALES', 'QUOTE_CLIENT']
}

// 🔧 Função para verificar elementos destacados em azul
function findBlueHighlightedPrices() {
  console.log("\n🔍 VERIFICANDO ELEMENTOS COM DESTAQUE AZUL...")
  
  const selectors = [
    '.text-blue-600',
    '.text-blue-700', 
    '.text-blue-800',
    '.text-blue-900',
    '.font-bold.text-blue',
    '.text-green-600', // Na Sales, preços MSRP aparecem em verde
    '[style*="color: blue"]',
    '[style*="color: #"]'
  ]
  
  const foundElements = []
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    elements.forEach(el => {
      const text = el.textContent || el.innerText
      if (text && (text.includes('R$') || text.includes('$') || text.includes('290.201,33'))) {
        foundElements.push({
          selector,
          element: el,
          text: text.trim(),
          classes: el.className,
          style: el.style.cssText
        })
      }
    })
  })
  
  console.log(`  📊 Encontrados ${foundElements.length} elementos com preços destacados:`)
  foundElements.forEach((item, index) => {
    console.log(`    ${index + 1}. ${item.selector}: "${item.text}"`)
    console.log(`       Classes: ${item.classes}`)
    if (item.style) console.log(`       Style: ${item.style}`)
  })
  
  return foundElements
}

// 🔧 Função para verificar se está na página correta
function detectCurrentPage() {
  const url = window.location.pathname
  const title = document.title || ''
  const h1Text = document.querySelector('h1')?.textContent || ''
  
  let page = 'UNKNOWN'
  if (url.includes('/dealer/sales') || h1Text.includes('Sales Configuration') || h1Text.includes('Configuração de Vendas')) {
    page = 'SALES'
  } else if (url.includes('/dealer/quote-client') || h1Text.includes('Quote Client') || h1Text.includes('Orçamento Cliente')) {
    page = 'QUOTE_CLIENT'
  }
  
  console.log(`\n📍 PÁGINA DETECTADA: ${page}`)
  console.log(`  URL: ${url}`)
  console.log(`  Title: ${title}`)
  console.log(`  H1: ${h1Text}`)
  
  return page
}

// 🔧 Função para simular atualização de preço MSRP
function simulateMSRPUpdate(item) {
  console.log(`\n🚀 SIMULANDO ATUALIZAÇÃO MSRP PARA: ${item.name}`)
  console.log(`  Preço atual BRL: R$ ${item.current_price_brl.toLocaleString('pt-BR')}`)
  console.log(`  Novo preço BRL: R$ ${item.new_price_brl.toLocaleString('pt-BR')} (AZUL FORTE)`)
  
  // 1. Simular salvamento na API
  console.log("  1️⃣ Simulando salvamento na API /dealer-pricing...")
  
  // 2. Simular notifyPricingUpdate do hook
  console.log("  2️⃣ Simulando notifyPricingUpdate()...")
  if (window.notifyPricingUpdate) {
    window.notifyPricingUpdate(MSRP_SYNC_TEST.DEALER_ID)
  }
  
  // 3. Disparar evento salesPriceUpdate IMEDIATO
  console.log("  3️⃣ Disparando evento salesPriceUpdate IMEDIATO...")
  const immediateUpdateEvent = new CustomEvent('salesPriceUpdate', {
    detail: {
      dealerId: MSRP_SYNC_TEST.DEALER_ID,
      itemId: item.id,
      itemType: item.type,
      itemName: item.name,
      priceUsd: item.new_price_usd,
      priceBrl: item.new_price_brl,
      margin: item.margin,
      timestamp: Date.now(),
      immediate: true
    }
  })
  window.dispatchEvent(immediateUpdateEvent)
  console.log("    ✅ Evento disparado:", immediateUpdateEvent.detail)
  
  // 4. Invalidar cache
  console.log("  4️⃣ Disparando invalidação de cache...")
  const cacheEvent = new CustomEvent('forceCacheInvalidation', {
    detail: { 
      reason: 'msrp_price_update', 
      timestamp: Date.now(),
      dealerId: MSRP_SYNC_TEST.DEALER_ID,
      itemType: item.type,
      itemId: item.id
    }
  })
  window.dispatchEvent(cacheEvent)
  console.log("    ✅ Cache invalidation disparado")
  
  // 5. Atualizar localStorage para sincronização entre abas
  console.log("  5️⃣ Atualizando localStorage...")
  localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
    dealerId: MSRP_SYNC_TEST.DEALER_ID,
    timestamp: Date.now(),
    item: {
      id: item.id,
      type: item.type,
      name: item.name,
      priceUsd: item.new_price_usd,
      priceBrl: item.new_price_brl
    }
  }))
  
  // 6. Disparar storage event manual
  console.log("  6️⃣ Disparando storage event...")
  const storageEvent = new StorageEvent('storage', {
    key: 'dealerPricingLastUpdate',
    newValue: Date.now().toString(),
    oldValue: '',
    url: window.location.href
  })
  window.dispatchEvent(storageEvent)
  console.log("    ✅ Storage event disparado")
  
  // 7. Trigger dealerPricingUpdate
  console.log("  7️⃣ Disparando dealerPricingUpdate...")
  const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
    detail: { dealerId: MSRP_SYNC_TEST.DEALER_ID, timestamp: Date.now(), immediate: true }
  })
  window.dispatchEvent(dealerPricingEvent)
  console.log("    ✅ Dealer pricing event disparado")
  
  console.log("🎉 SIMULAÇÃO DE ATUALIZAÇÃO MSRP CONCLUÍDA!")
}

// 🔧 Função para monitorar mudanças nos valores azuis
function monitorBlueValueChanges() {
  console.log("\n👁️ INICIANDO MONITORAMENTO DE MUDANÇAS NOS VALORES AZUIS...")
  
  const initialValues = findBlueHighlightedPrices()
  console.log(`  📊 Capturados ${initialValues.length} valores iniciais`)
  
  // Monitorar por 30 segundos
  let changeCount = 0
  const startTime = Date.now()
  
  const monitor = setInterval(() => {
    const currentValues = findBlueHighlightedPrices()
    
    // Comparar com valores iniciais
    let hasChanges = false
    currentValues.forEach((current, index) => {
      const initial = initialValues[index]
      if (initial && current.text !== initial.text) {
        hasChanges = true
        changeCount++
        console.log(`  🔄 MUDANÇA DETECTADA ${changeCount}:`)
        console.log(`    Antes: "${initial.text}"`)
        console.log(`    Depois: "${current.text}"`)
        console.log(`    Elemento: ${current.selector}`)
        console.log(`    Tempo: ${((Date.now() - startTime) / 1000).toFixed(1)}s`)
      }
    })
    
    if (Date.now() - startTime > 30000) {
      clearInterval(monitor)
      console.log(`\n🏁 MONITORAMENTO CONCLUÍDO`)
      console.log(`  Total de mudanças detectadas: ${changeCount}`)
      console.log(`  Tempo total: 30s`)
    }
  }, 500) // Verificar a cada 500ms
  
  return monitor
}

// 🔧 Função principal de teste
function runMSRPSyncTest() {
  console.log("\n🔥 EXECUTANDO TESTE COMPLETO DE SINCRONIZAÇÃO MSRP")
  
  const currentPage = detectCurrentPage()
  
  // Encontrar valores azuis atuais
  const blueValues = findBlueHighlightedPrices()
  
  // Iniciar monitoramento
  const monitor = monitorBlueValueChanges()
  
  if (currentPage === 'SALES') {
    console.log("\n🏪 TESTE NA PÁGINA SALES:")
    console.log("  - Simulando salvamento de preço MSRP")
    console.log("  - Verificando se eventos são disparados corretamente")
    
    setTimeout(() => {
      simulateMSRPUpdate(MSRP_SYNC_TEST.TEST_ITEMS[0])
    }, 2000)
    
  } else if (currentPage === 'QUOTE_CLIENT') {
    console.log("\n📝 TESTE NA PÁGINA QUOTE CLIENT:")
    console.log("  - Aguardando eventos de atualização")
    console.log("  - Monitorando mudanças nos valores azuis")
    console.log("  - Verificando se preços são atualizados automaticamente")
    
    // Simular evento externo (como se viesse da página Sales)
    setTimeout(() => {
      console.log("\n📡 Simulando evento externo da página Sales...")
      simulateMSRPUpdate(MSRP_SYNC_TEST.TEST_ITEMS[0])
    }, 3000)
    
  } else {
    console.log("❌ PÁGINA NÃO RECONHECIDA - Abra a página /dealer/sales ou /dealer/quote-client")
    return
  }
  
  // Verificação final após 15 segundos
  setTimeout(() => {
    console.log("\n🔍 VERIFICAÇÃO FINAL DOS VALORES AZUIS...")
    const finalValues = findBlueHighlightedPrices()
    
    console.log("📊 RELATÓRIO FINAL:")
    console.log(`  Página testada: ${currentPage}`)
    console.log(`  Valores azuis encontrados: ${finalValues.length}`)
    console.log(`  Tempo total do teste: 15s`)
    
    // Verificar se R$ 290.201,33 aparece (valor da print)
    const targetValue = "290.201,33"
    const foundTargetValue = finalValues.some(v => v.text.includes(targetValue))
    
    if (foundTargetValue) {
      console.log(`  ✅ VALOR ALVO ENCONTRADO: R$ ${targetValue}`)
    } else {
      console.log(`  ❌ VALOR ALVO NÃO ENCONTRADO: R$ ${targetValue}`)
    }
    
    console.log("\n🎯 INSTRUÇÕES PARA TESTE MANUAL:")
    console.log("1. Abra duas abas:")
    console.log("   - Aba 1: /dealer/sales")
    console.log("   - Aba 2: /dealer/quote-client")
    console.log("2. Na Aba 1, edite um preço MSRP e salve")
    console.log("3. Observe se o valor azul forte na Aba 2 atualiza automaticamente")
    console.log("4. O valor R$ 290.201,33 deve aparecer destacado em azul forte")
    
  }, 15000)
}

// 🔧 Verificar se há problemas nos event listeners
function checkEventListeners() {
  console.log("\n🎧 VERIFICANDO EVENT LISTENERS...")
  
  const events = [
    'salesPriceUpdate',
    'dealerPricingUpdate', 
    'forceCacheInvalidation',
    'storage'
  ]
  
  events.forEach(eventName => {
    console.log(`  🎧 Testando listener para '${eventName}'...`)
    
    const testEvent = new CustomEvent(eventName, {
      detail: { test: true, timestamp: Date.now() }
    })
    
    try {
      window.dispatchEvent(testEvent)
      console.log(`    ✅ Evento '${eventName}' disparado com sucesso`)
    } catch (error) {
      console.log(`    ❌ Erro ao disparar '${eventName}':`, error)
    }
  })
}

// 🚀 EXECUTAR TESTE
console.log("🔥 INICIANDO TESTE DE SINCRONIZAÇÃO DE VALORES AZUL FORTE...")
console.log("⏰ Tempo estimado: 30 segundos")
console.log("\n")

checkEventListeners()
runMSRPSyncTest()

// Expor funções para teste manual
window.msrpSyncTest = {
  run: runMSRPSyncTest,
  findBlueValues: findBlueHighlightedPrices,
  simulateUpdate: simulateMSRPUpdate,
  monitor: monitorBlueValueChanges,
  config: MSRP_SYNC_TEST
}

console.log("\n🔧 FUNÇÕES DISPONÍVEIS NO CONSOLE:")
console.log("  window.msrpSyncTest.run() - Executar teste completo")
console.log("  window.msrpSyncTest.findBlueValues() - Encontrar valores azuis")
console.log("  window.msrpSyncTest.simulateUpdate(item) - Simular atualização")
console.log("  window.msrpSyncTest.monitor() - Monitorar mudanças")