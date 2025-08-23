// Debug script para testar sincronização MSRP
// Este script deve ser executado no console do navegador

console.log("🔍 INICIANDO DEBUG DA SINCRONIZAÇÃO MSRP");

// 1. Verificar se os listeners estão registrados
function checkEventListeners() {
  console.log("\n📡 Verificando listeners de eventos...");
  
  // Testar se os eventos conseguem ser disparados e recebidos
  let eventReceived = false;
  
  // Criar listener temporário para testar
  const testListener = (event) => {
    eventReceived = true;
    console.log("✅ Evento recebido:", event.type, event.detail);
  };
  
  // Registrar listener
  window.addEventListener('salesPriceUpdate', testListener);
  
  // Disparar evento de teste
  window.dispatchEvent(new CustomEvent('salesPriceUpdate', {
    detail: { test: true, timestamp: Date.now() }
  }));
  
  // Remover listener
  window.removeEventListener('salesPriceUpdate', testListener);
  
  console.log("📡 Teste de listener:", eventReceived ? "✅ FUNCIONANDO" : "❌ FALHOU");
  return eventReceived;
}

// 2. Verificar se o dealerId está configurado
function checkDealerId() {
  console.log("\n🏪 Verificando dealer ID...");
  const dealerId = localStorage.getItem("currentDealerId");
  console.log("Dealer ID:", dealerId || "❌ NÃO ENCONTRADO");
  return dealerId;
}

// 3. Verificar se o hook está ativo
function checkHookStatus() {
  console.log("\n🎯 Verificando status do hook...");
  
  // Verificar se há instância do sync manager
  const hasInstance = window.DealerPricingSyncManager || false;
  console.log("Sync Manager:", hasInstance ? "✅ ENCONTRADO" : "❌ NÃO ENCONTRADO");
  
  // Verificar localStorage relacionado
  const lastUpdate = localStorage.getItem('dealerPricingLastUpdate');
  const updatedBy = localStorage.getItem('dealerPricingUpdatedBy');
  
  console.log("Última atualização:", lastUpdate || "Nenhuma");
  console.log("Atualizado por:", updatedBy || "Nenhum");
  
  return { hasInstance, lastUpdate, updatedBy };
}

// 4. Simular salvamento de MSRP
function simulateMSRPSave(dealerId) {
  console.log("\n💰 Simulando salvamento de MSRP...");
  
  if (!dealerId) {
    console.log("❌ Dealer ID necessário para simulação");
    return false;
  }
  
  const testData = {
    dealerId: dealerId,
    itemId: "test_item_1",
    itemType: "boat_model", 
    itemName: "Test Boat Model",
    priceUsd: 55000,
    priceBrl: 275000,
    margin: 15.5,
    timestamp: Date.now(),
    immediate: true
  };
  
  console.log("Dados de teste:", testData);
  
  // 1. Disparar evento salesPriceUpdate
  console.log("📡 Disparando salesPriceUpdate...");
  window.dispatchEvent(new CustomEvent('salesPriceUpdate', { detail: testData }));
  
  // 2. Atualizar localStorage
  console.log("💾 Atualizando localStorage...");
  localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
    dealerId: dealerId,
    timestamp: Date.now(),
    item: {
      id: testData.itemId,
      type: testData.itemType,
      name: testData.itemName,
      priceUsd: testData.priceUsd,
      priceBrl: testData.priceBrl
    }
  }));
  
  // 3. Disparar evento dealerPricingUpdate
  console.log("📡 Disparando dealerPricingUpdate...");
  window.dispatchEvent(new CustomEvent('dealerPricingUpdate', {
    detail: { dealerId, timestamp: Date.now(), immediate: true }
  }));
  
  // 4. Disparar evento de cache invalidation
  console.log("🧹 Disparando forceCacheInvalidation...");
  window.dispatchEvent(new CustomEvent('forceCacheInvalidation', {
    detail: { 
      reason: 'msrp_price_update',
      timestamp: Date.now(),
      dealerId,
      itemType: testData.itemType,
      itemId: testData.itemId
    }
  }));
  
  console.log("✅ Todos os eventos disparados!");
  return true;
}

// 5. Verificar resposta da API
async function testAPI(dealerId) {
  console.log("\n🌐 Testando API get-dealer-config...");
  
  if (!dealerId) {
    console.log("❌ Dealer ID necessário para teste da API");
    return false;
  }
  
  try {
    const timestamp = Date.now();
    const url = `/api/get-dealer-config?dealer_id=${dealerId}&refresh=true&force=true&msrp_update=true&cb=${timestamp}`;
    
    console.log("📡 URL da API:", url);
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-MSRP-Update': 'true',
        'X-Real-Time-Update': 'true',
        'X-Cache-Buster': timestamp.toString()
      }
    });
    
    console.log("📡 Status da resposta:", response.status);
    console.log("📡 Headers da resposta:", [...response.headers.entries()]);
    
    const data = await response.json();
    console.log("📊 Dados recebidos:", data);
    
    if (data.success) {
      console.log("✅ API funcionando - Preços MSRP:", data.data?.dealerPricingCount || 0);
      return true;
    } else {
      console.log("❌ API retornou erro:", data.error);
      return false;
    }
  } catch (error) {
    console.log("❌ Erro ao chamar API:", error);
    return false;
  }
}

// 6. Executar todos os testes
async function runAllTests() {
  console.log("🔍 EXECUTANDO TODOS OS TESTES DE DEBUG\n");
  
  const results = {};
  
  // Teste 1: Event listeners
  results.eventListeners = checkEventListeners();
  
  // Teste 2: Dealer ID
  const dealerId = checkDealerId();
  results.dealerId = !!dealerId;
  
  // Teste 3: Hook status
  results.hookStatus = checkHookStatus();
  
  // Teste 4: Simulação MSRP (se tiver dealer ID)
  if (dealerId) {
    results.msrpSimulation = simulateMSRPSave(dealerId);
    
    // Aguardar um pouco e testar API
    console.log("\n⏳ Aguardando 2 segundos antes de testar API...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 5: API
    results.apiTest = await testAPI(dealerId);
  } else {
    results.msrpSimulation = false;
    results.apiTest = false;
  }
  
  // Resumo dos resultados
  console.log("\n📋 RESUMO DOS TESTES:");
  console.log("Event Listeners:", results.eventListeners ? "✅ OK" : "❌ FALHOU");
  console.log("Dealer ID:", results.dealerId ? "✅ OK" : "❌ FALHOU");
  console.log("Hook Status:", results.hookStatus.hasInstance ? "✅ OK" : "❌ FALHOU");
  console.log("MSRP Simulation:", results.msrpSimulation ? "✅ OK" : "❌ FALHOU");
  console.log("API Test:", results.apiTest ? "✅ OK" : "❌ FALHOU");
  
  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : result.hasInstance
  );
  
  console.log("\n🎯 RESULTADO GERAL:", allPassed ? "✅ TODOS OS TESTES PASSARAM" : "❌ ALGUNS TESTES FALHARAM");
  
  if (!allPassed) {
    console.log("\n💡 POSSÍVEIS SOLUÇÕES:");
    if (!results.eventListeners) console.log("- Verificar se JavaScript está habilitado");
    if (!results.dealerId) console.log("- Fazer login novamente para configurar dealer ID");
    if (!results.hookStatus.hasInstance) console.log("- Verificar se a página está carregada completamente");
    if (!results.msrpSimulation) console.log("- Verificar console para erros de JavaScript");
    if (!results.apiTest) console.log("- Verificar conectividade de rede e configuração da API");
  }
  
  return results;
}

// Função para executar teste específico de sincronização entre páginas
function testCrossPageSync() {
  console.log("\n🔄 TESTE DE SINCRONIZAÇÃO ENTRE PÁGINAS");
  console.log("1. Execute este script na página SALES (/dealer/sales)");
  console.log("2. Abra a página QUOTE CLIENT (/dealer/quote-client) em outra aba");
  console.log("3. Volte para esta aba e execute: simulateMSRPSave(localStorage.getItem('currentDealerId'))");
  console.log("4. Verifique na aba QUOTE CLIENT se aparece notificação");
}

// Disponibilizar funções globalmente para uso manual
window.debugMSRPSync = {
  runAllTests,
  checkEventListeners,
  checkDealerId, 
  checkHookStatus,
  simulateMSRPSave,
  testAPI,
  testCrossPageSync
};

console.log("\n🚀 Script de debug carregado!");
console.log("Execute: debugMSRPSync.runAllTests() para testar tudo");
console.log("Ou execute: debugMSRPSync.testCrossPageSync() para testar entre páginas");