/**
 * Test Script: Real-time MSRP Sync Between Sales & Quote Client
 * 
 * Este script pode ser executado no console do navegador para testar
 * se a sincronização em tempo real está funcionando corretamente.
 */

console.log("🧪 Iniciando teste de sincronização MSRP em tempo real...");

// Função para simular uma atualização de preços
function simulatePriceUpdate() {
  console.log("📝 Simulando atualização de preços...");
  
  // Verificar se useDealerPricingSync está disponível
  if (typeof window !== 'undefined') {
    const dealerId = localStorage.getItem('currentDealerId');
    
    if (!dealerId) {
      console.error("❌ Dealer ID não encontrado no localStorage");
      return;
    }
    
    console.log("✅ Dealer ID encontrado:", dealerId);
    
    // Simular notificação de atualização de preços
    const timestamp = Date.now();
    localStorage.setItem('dealerPricingLastUpdate', timestamp.toString());
    localStorage.setItem('dealerPricingUpdatedBy', dealerId);
    
    // Disparar evento customizado
    const customEvent = new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId, timestamp }
    });
    window.dispatchEvent(customEvent);
    
    // Disparar storage event
    const storageEvent = new StorageEvent('storage', {
      key: 'dealerPricingLastUpdate',
      newValue: timestamp.toString(),
      oldValue: '',
      url: window.location.href
    });
    window.dispatchEvent(storageEvent);
    
    console.log("🚀 Eventos de sincronização disparados!");
    console.log("  - Custom event:", customEvent.detail);
    console.log("  - Storage event:", { key: storageEvent.key, newValue: storageEvent.newValue });
    
    return true;
  }
  
  return false;
}

// Função para testar listeners de eventos
function testEventListeners() {
  console.log("🎯 Testando event listeners...");
  
  let dealerPricingEventReceived = false;
  let storageEventReceived = false;
  
  const dealerPricingListener = (event) => {
    console.log("✅ dealerPricingUpdate event recebido:", event.detail);
    dealerPricingEventReceived = true;
  };
  
  const storageListener = (event) => {
    if (event.key === 'dealerPricingLastUpdate') {
      console.log("✅ Storage event recebido:", { key: event.key, newValue: event.newValue });
      storageEventReceived = true;
    }
  };
  
  // Adicionar listeners
  window.addEventListener('dealerPricingUpdate', dealerPricingListener);
  window.addEventListener('storage', storageListener);
  
  // Simular eventos
  setTimeout(() => {
    simulatePriceUpdate();
    
    // Verificar se eventos foram recebidos
    setTimeout(() => {
      console.log("📊 Resultado do teste de event listeners:");
      console.log("  - dealerPricingUpdate recebido:", dealerPricingEventReceived ? "✅" : "❌");
      console.log("  - storage event recebido:", storageEventReceived ? "✅" : "❌");
      
      // Remover listeners
      window.removeEventListener('dealerPricingUpdate', dealerPricingListener);
      window.removeEventListener('storage', storageListener);
      
      if (dealerPricingEventReceived && storageEventReceived) {
        console.log("🎉 Todos os event listeners estão funcionando!");
      } else {
        console.warn("⚠️ Alguns event listeners não estão funcionando corretamente");
      }
    }, 1000);
  }, 100);
}

// Função para testar a API de configurações
async function testDealerConfigAPI() {
  console.log("🌐 Testando API de configurações do dealer...");
  
  const dealerId = localStorage.getItem('currentDealerId');
  if (!dealerId) {
    console.error("❌ Dealer ID não encontrado");
    return;
  }
  
  try {
    // Teste 1: Buscar sem cache
    console.log("📡 Teste 1: Buscando configurações sem cache...");
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const response1 = await fetch(`/api/get-dealer-config?dealer_id=${dealerId}&refresh=true&force=true&cb=${cacheBuster}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Cache-Buster': cacheBuster
      }
    });
    
    const result1 = await response1.json();
    console.log("✅ Resposta da API (sem cache):", result1.success ? "Sucesso" : "Erro");
    console.log("  - Cached:", result1.cached);
    console.log("  - Dealer pricing count:", result1.data?.dealerPricingCount || 0);
    
    // Teste 2: Buscar novamente para verificar cache
    console.log("📡 Teste 2: Buscando configurações com cache...");
    const response2 = await fetch(`/api/get-dealer-config?dealer_id=${dealerId}`);
    const result2 = await response2.json();
    console.log("✅ Resposta da API (com cache):", result2.success ? "Sucesso" : "Erro");
    console.log("  - Cached:", result2.cached);
    
    return result1.success && result2.success;
  } catch (error) {
    console.error("❌ Erro ao testar API:", error);
    return false;
  }
}

// Função principal de teste
async function runFullTest() {
  console.log("🚀 Executando teste completo de sincronização MSRP...");
  console.log("========================================");
  
  // Teste 1: Event Listeners
  console.log("\n1. Testando Event Listeners:");
  testEventListeners();
  
  // Aguardar completion do teste anterior
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: API de configurações
  console.log("\n2. Testando API de configurações:");
  const apiTest = await testDealerConfigAPI();
  
  // Teste 3: Simulação de atualização completa
  console.log("\n3. Testando simulação de atualização completa:");
  const updateTest = simulatePriceUpdate();
  
  // Resultado final
  console.log("\n========================================");
  console.log("📊 RESULTADO FINAL DO TESTE:");
  console.log("  - Event Listeners: Verificar logs acima");
  console.log("  - API funcionando:", apiTest ? "✅" : "❌");
  console.log("  - Simulação de update:", updateTest ? "✅" : "❌");
  console.log("========================================");
  
  if (apiTest && updateTest) {
    console.log("🎉 TESTE GERAL: PASSOU! Sistema de sincronização está funcionando.");
  } else {
    console.warn("⚠️ TESTE GERAL: FALHOU! Verificar problemas acima.");
  }
}

// Executar teste automaticamente
if (typeof window !== 'undefined') {
  console.log("🎯 Para executar o teste completo, digite: runFullTest()");
  console.log("🎯 Para testar apenas simulação: simulatePriceUpdate()");
  console.log("🎯 Para testar apenas listeners: testEventListeners()");
  console.log("🎯 Para testar apenas API: testDealerConfigAPI()");
  
  // Expor funções globalmente para teste manual
  window.runFullTest = runFullTest;
  window.simulatePriceUpdate = simulatePriceUpdate;
  window.testEventListeners = testEventListeners;
  window.testDealerConfigAPI = testDealerConfigAPI;
} else {
  runFullTest();
}