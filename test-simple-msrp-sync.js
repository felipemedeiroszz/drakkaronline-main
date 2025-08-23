// Script simplificado para testar sincronização MSRP
// Cole este código no console do navegador (F12)

console.log("🔥 TESTE SIMPLIFICADO DE SINCRONIZAÇÃO MSRP");

// Função para testar sincronização
function testMSRPSync() {
  console.log("\n🧪 Iniciando teste de sincronização MSRP...");
  
  // 1. Verificar se estamos na página correta
  const isQuoteClient = window.location.pathname.includes('/quote-client');
  const isSales = window.location.pathname.includes('/sales');
  
  console.log("📍 Página atual:", window.location.pathname);
  console.log("📍 É Quote Client?", isQuoteClient);
  console.log("📍 É Sales?", isSales);
  
  // 2. Verificar dealer ID
  const dealerId = localStorage.getItem("currentDealerId");
  console.log("🏪 Dealer ID:", dealerId || "❌ NÃO ENCONTRADO");
  
  if (!dealerId) {
    console.error("❌ ERRO: Dealer ID não encontrado. Faça login novamente.");
    return false;
  }
  
  // 3. Se estiver na página Sales, simular salvamento de MSRP
  if (isSales) {
    console.log("💰 Simulando salvamento de MSRP na página Sales...");
    
    // Disparar todos os eventos que a página Sales normalmente dispara
    const testData = {
      dealerId: dealerId,
      itemId: `test_${Date.now()}`,
      itemType: "boat_model",
      itemName: "Test Boat - Manual Sync",
      priceUsd: 60000,
      priceBrl: 300000,
      margin: 20,
      timestamp: Date.now(),
      immediate: true
    };
    
    console.log("📡 Disparando evento salesPriceUpdate...");
    window.dispatchEvent(new CustomEvent('salesPriceUpdate', { detail: testData }));
    
    console.log("📡 Disparando evento dealerPricingUpdate...");
    window.dispatchEvent(new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId, timestamp: Date.now(), immediate: true }
    }));
    
    console.log("💾 Atualizando localStorage...");
    localStorage.setItem('lastSalesPriceUpdate', JSON.stringify({
      dealerId: dealerId,
      timestamp: Date.now(),
      item: testData
    }));
    
    console.log("✅ Eventos disparados! Verifique a página Quote Client.");
    return true;
  }
  
  // 4. Se estiver na página Quote Client, forçar reload
  if (isQuoteClient) {
    console.log("🔄 Forçando reload na página Quote Client...");
    
    // Tentar encontrar a função de reload
    if (window.debugMSRPSync && window.debugMSRPSync.testAPI) {
      window.debugMSRPSync.testAPI(dealerId);
    } else {
      // Disparar eventos para forçar reload
      console.log("📡 Disparando eventos para forçar reload...");
      
      window.dispatchEvent(new CustomEvent('forceCacheInvalidation', {
        detail: { 
          reason: 'manual_test',
          timestamp: Date.now(),
          dealerId
        }
      }));
      
      window.dispatchEvent(new CustomEvent('dealerPricingUpdate', {
        detail: { dealerId, timestamp: Date.now(), immediate: true }
      }));
    }
    
    console.log("✅ Reload forçado! Verifique se os dados foram atualizados.");
    return true;
  }
  
  console.log("⚠️ Esta página não suporta o teste. Vá para /dealer/sales ou /dealer/quote-client");
  return false;
}

// Função para verificar status atual
function checkMSRPStatus() {
  console.log("\n📊 STATUS ATUAL DA SINCRONIZAÇÃO MSRP");
  
  const dealerId = localStorage.getItem("currentDealerId");
  const lastUpdate = localStorage.getItem('lastSalesPriceUpdate');
  const pricingUpdate = localStorage.getItem('dealerPricingLastUpdate');
  
  console.log("🏪 Dealer ID:", dealerId || "❌ Não encontrado");
  console.log("💰 Última atualização MSRP:", lastUpdate ? JSON.parse(lastUpdate) : "❌ Nenhuma");
  console.log("🔄 Último pricing update:", pricingUpdate || "❌ Nenhum");
  
  // Verificar se há elementos na página
  const isQuoteClient = window.location.pathname.includes('/quote-client');
  if (isQuoteClient) {
    const msrpElements = document.querySelectorAll('[title*="MSRP"], [title*="msrp"]');
    console.log("💰 Elementos MSRP encontrados na página:", msrpElements.length);
    
    const pricingCountElements = document.querySelectorAll('*:contains("preços MSRP"), *:contains("MSRP prices")');
    console.log("📊 Elementos de contagem MSRP:", pricingCountElements.length);
  }
  
  return {
    dealerId,
    lastUpdate: lastUpdate ? JSON.parse(lastUpdate) : null,
    pricingUpdate
  };
}

// Função para simular uma atualização completa
function simulateFullUpdate() {
  console.log("\n🚀 SIMULANDO ATUALIZAÇÃO COMPLETA DE MSRP");
  
  const dealerId = localStorage.getItem("currentDealerId");
  if (!dealerId) {
    console.error("❌ Dealer ID necessário");
    return false;
  }
  
  console.log("1️⃣ Disparando salesPriceUpdate...");
  window.dispatchEvent(new CustomEvent('salesPriceUpdate', {
    detail: {
      dealerId,
      itemId: `full_test_${Date.now()}`,
      itemType: "boat_model",
      itemName: "Full Test Boat",
      priceUsd: 75000,
      priceBrl: 375000,
      margin: 25,
      timestamp: Date.now(),
      immediate: true
    }
  }));
  
  setTimeout(() => {
    console.log("2️⃣ Disparando dealerPricingUpdate...");
    window.dispatchEvent(new CustomEvent('dealerPricingUpdate', {
      detail: { dealerId, timestamp: Date.now(), immediate: true }
    }));
  }, 500);
  
  setTimeout(() => {
    console.log("3️⃣ Disparando forceCacheInvalidation...");
    window.dispatchEvent(new CustomEvent('forceCacheInvalidation', {
      detail: { 
        reason: 'full_test_update',
        timestamp: Date.now(),
        dealerId
      }
    }));
  }, 1000);
  
  setTimeout(() => {
    console.log("✅ Simulação completa finalizada!");
    checkMSRPStatus();
  }, 2000);
  
  return true;
}

// Disponibilizar funções globalmente
window.testMSRPSync = testMSRPSync;
window.checkMSRPStatus = checkMSRPStatus;
window.simulateFullUpdate = simulateFullUpdate;

console.log("\n🎯 FUNÇÕES DISPONÍVEIS:");
console.log("• testMSRPSync() - Executa teste básico");
console.log("• checkMSRPStatus() - Verifica status atual");
console.log("• simulateFullUpdate() - Simula atualização completa");

console.log("\n💡 INSTRUÇÕES:");
console.log("1. Abra a página /dealer/sales em uma aba");
console.log("2. Abra a página /dealer/quote-client em outra aba");
console.log("3. Na aba Sales, execute: testMSRPSync()");
console.log("4. Verifique na aba Quote Client se há atualizações");
console.log("5. Use checkMSRPStatus() para verificar o estado");

// Executar verificação inicial
checkMSRPStatus();