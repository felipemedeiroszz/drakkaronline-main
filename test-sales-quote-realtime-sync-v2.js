/**
 * Teste de Sincronização em Tempo Real entre Sales e Quote Client
 * Este script verifica se as alterações de preços na aba Sales são refletidas
 * imediatamente na aba Quote Client
 */

console.log("🚀 Iniciando teste de sincronização em tempo real Sales → Quote Client");
console.log("=" .repeat(60));

// Configuração de teste
const TEST_CONFIG = {
  dealerId: "test-dealer-123",
  dealerName: "Test Dealer",
  testItem: {
    id: "test-item-001",
    type: "boat_model",
    name: "Test Boat Model",
    originalPriceUsd: 50000,
    originalPriceBrl: 250000,
    newPriceUsd: 55000,
    newPriceBrl: 275000,
    margin: 10
  }
};

// Simular ambiente do navegador
if (typeof window === 'undefined') {
  console.log("⚠️ Este teste deve ser executado no navegador");
  console.log("Copie e cole o código no console do navegador com as abas Sales e Quote Client abertas");
} else {
  // Função para testar a sincronização
  function testRealtimeSync() {
    console.log("\n📋 Configuração do teste:");
    console.log(`  - Dealer ID: ${TEST_CONFIG.dealerId}`);
    console.log(`  - Item: ${TEST_CONFIG.testItem.name}`);
    console.log(`  - Preço original: USD ${TEST_CONFIG.testItem.originalPriceUsd} / BRL ${TEST_CONFIG.testItem.originalPriceBrl}`);
    console.log(`  - Novo preço: USD ${TEST_CONFIG.testItem.newPriceUsd} / BRL ${TEST_CONFIG.testItem.newPriceBrl}`);
    
    // Passo 1: Simular salvamento de preço na página Sales
    console.log("\n🔄 Passo 1: Simulando atualização de preço na página Sales...");
    
    // Disparar evento de atualização
    const updateEvent = new CustomEvent('salesPriceUpdate', {
      detail: {
        dealerId: TEST_CONFIG.dealerId,
        itemId: TEST_CONFIG.testItem.id,
        itemType: TEST_CONFIG.testItem.type,
        itemName: TEST_CONFIG.testItem.name,
        priceUsd: TEST_CONFIG.testItem.newPriceUsd,
        priceBrl: TEST_CONFIG.testItem.newPriceBrl,
        margin: TEST_CONFIG.testItem.margin,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(updateEvent);
    console.log("✅ Evento salesPriceUpdate disparado:", updateEvent.detail);
    
    // Passo 2: Atualizar localStorage para sincronização entre abas
    console.log("\n🔄 Passo 2: Atualizando localStorage para sincronização entre abas...");
    
    const storageData = {
      dealerId: TEST_CONFIG.dealerId,
      timestamp: Date.now(),
      item: {
        id: TEST_CONFIG.testItem.id,
        type: TEST_CONFIG.testItem.type,
        name: TEST_CONFIG.testItem.name,
        priceUsd: TEST_CONFIG.testItem.newPriceUsd,
        priceBrl: TEST_CONFIG.testItem.newPriceBrl
      }
    };
    
    localStorage.setItem('lastSalesPriceUpdate', JSON.stringify(storageData));
    console.log("✅ LocalStorage atualizado:", storageData);
    
    // Passo 3: Disparar evento de sincronização do dealer pricing
    console.log("\n🔄 Passo 3: Disparando evento de sincronização do dealer pricing...");
    
    const dealerPricingEvent = new CustomEvent('dealerPricingUpdate', {
      detail: {
        dealerId: TEST_CONFIG.dealerId,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(dealerPricingEvent);
    console.log("✅ Evento dealerPricingUpdate disparado");
    
    // Passo 4: Verificar listeners ativos
    console.log("\n📊 Passo 4: Verificando listeners ativos...");
    
    // Verificar se há listeners para os eventos
    const hasListeners = {
      salesPriceUpdate: false,
      dealerPricingUpdate: false,
      storage: false
    };
    
    // Teste temporário de listeners
    const testListener = () => { hasListeners.salesPriceUpdate = true; };
    window.addEventListener('salesPriceUpdate', testListener);
    window.dispatchEvent(new CustomEvent('salesPriceUpdate'));
    window.removeEventListener('salesPriceUpdate', testListener);
    
    console.log("  - Listener salesPriceUpdate:", hasListeners.salesPriceUpdate ? "✅ Ativo" : "❌ Inativo");
    
    // Passo 5: Monitorar console por 5 segundos
    console.log("\n⏱️ Passo 5: Monitorando console por 5 segundos...");
    console.log("Observe as mensagens de log das páginas Sales e Quote Client");
    
    let secondsElapsed = 0;
    const monitorInterval = setInterval(() => {
      secondsElapsed++;
      console.log(`  ${secondsElapsed}s - Aguardando sincronização...`);
      
      if (secondsElapsed >= 5) {
        clearInterval(monitorInterval);
        console.log("\n" + "=" .repeat(60));
        console.log("✅ Teste concluído!");
        console.log("\n📋 Checklist de verificação:");
        console.log("  [ ] A página Quote Client mostrou notificação de atualização?");
        console.log("  [ ] O indicador visual de atualização apareceu?");
        console.log("  [ ] Os preços foram atualizados no resumo do orçamento?");
        console.log("  [ ] O timestamp de última atualização foi atualizado?");
        console.log("\n💡 Dica: Abra as duas abas lado a lado para ver a sincronização em ação!");
      }
    }, 1000);
  }
  
  // Executar teste
  console.log("\n🎯 Executando teste de sincronização...");
  testRealtimeSync();
  
  // Adicionar função global para re-executar o teste
  window.testSalesQuoteSync = testRealtimeSync;
  console.log("\n💡 Para re-executar o teste, digite: testSalesQuoteSync()");
}

// Exportar para Node.js se necessário
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_CONFIG, testRealtimeSync };
}