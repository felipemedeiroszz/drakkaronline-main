/**
 * Sistema de sincronização entre painéis Dealer e Administrator
 * Este arquivo contém funções para sincronizar dados entre os painéis
 */

// Função para sincronizar dados entre painéis
function syncData(key, data) {
  // Salva os dados no localStorage com um timestamp para controle de versão
  const timestamp = new Date().getTime();
  const syncObject = {
    data: data,
    timestamp: timestamp,
    source: getCurrentPanel() // identifica a origem da atualização
  };
  
  localStorage.setItem(key, JSON.stringify(data)); // Mantém compatibilidade com código existente
  localStorage.setItem(`${key}_sync`, JSON.stringify(syncObject)); // Adiciona metadados de sincronização
  
  // Dispara um evento personalizado para notificar outros painéis sobre a atualização
  const syncEvent = new CustomEvent('data-synced', { 
    detail: { key: key, timestamp: timestamp, source: getCurrentPanel() } 
  });
  window.dispatchEvent(syncEvent);
  
  console.log(`Dados sincronizados: ${key} às ${new Date(timestamp).toLocaleTimeString()}`);
}

// Função para obter dados sincronizados
function getSyncedData(key, defaultValue = []) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

// Função para identificar o painel atual
function getCurrentPanel() {
  // Verifica se estamos no painel de administrador ou dealer
  const isAdmin = window.location.href.includes('administrator.html');
  const isDealer = window.location.href.includes('/dealer/');
  return isAdmin ? 'administrator' : (isDealer ? 'dealer' : 'unknown');
}

// Função para salvar todas as configurações e sincronizar
function saveAllAndSync() {
  // Mapeia as tabelas para as chaves de armazenamento
  const maps = [
    ['engineTable', 'enginePackages'],
    ['hullTable', 'hullColors'],
    ['optTable', 'additionalOptions'],
    ['modelTable', 'boatModels'],
    ['dealerTable', 'dealers']
  ];
  
  // Para cada tabela, converte para array e salva
  maps.forEach(([tblId, key]) => {
    const data = tableToArray(tblId);
    syncData(key, data);
  });
  
  // Sincroniza também pedidos e solicitações de serviço
  const orders = getSyncedData('orders');
  syncData('orders', orders);
  
  const serviceRequests = getSyncedData('serviceRequests');
  syncData('serviceRequests', serviceRequests);
}

// Função auxiliar para converter tabela em array (compatível com o código existente)
function tableToArray(tblId) {
  const tbody = document.querySelector(`#${tblId} tbody`);
  if (!tbody) return [];
  
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const tds = tr.querySelectorAll('td input');
    if (tblId === 'dealerTable') {
      return { name: tds[0].value, email: tds[1].value, password: tds[2].value };
    }
    if (tblId === 'engineTable' || tblId === 'hullTable' || tblId === 'optTable' || tblId === 'modelTable') {
      return {
        name: tds[0].value,
        name_pt: tds[1].value,
        usd: parseFloat(tds[2].value || 0),
        brl: parseFloat(tds[3].value || 0)
      };
    }
    return {};
  });
}

// Adiciona um listener para detectar mudanças de dados em outras abas/janelas
window.addEventListener('storage', function(e) {
  // Verifica se a chave alterada é uma das que nos interessa
  if (e.key && (e.key.endsWith('_sync') || [
    'enginePackages', 'hullColors', 'additionalOptions', 'boatModels', 'dealers', 'orders', 'serviceRequests'
  ].includes(e.key))) {
    console.log(`Dados atualizados externamente: ${e.key}`);
    
    // Se estivermos em uma página que exibe esses dados, recarrega-os
    if (typeof loadTables === 'function') {
      loadTables();
    }
  }
});

// Função para adicionar um novo pedido e sincronizar
function addOrderAndSync(order) {
  const orders = getSyncedData('orders');
  orders.push(order);
  syncData('orders', orders);
}

// Função para adicionar uma nova solicitação de serviço e sincronizar
function addServiceRequestAndSync(request) {
  const serviceRequests = getSyncedData('serviceRequests');
  serviceRequests.push(request);
  syncData('serviceRequests', serviceRequests);
}

// Função para atualizar o status de um pedido e sincronizar
function updateOrderStatusAndSync(orderId, newStatus) {
  const orders = getSyncedData('orders');
  const orderIndex = orders.findIndex(o => o.orderId === orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    syncData('orders', orders);
    return true;
  }
  return false;
}

// Função para atualizar o status de uma solicitação de serviço e sincronizar
function updateServiceRequestStatusAndSync(requestId, newStatus) {
  const serviceRequests = getSyncedData('serviceRequests');
  const requestIndex = serviceRequests.findIndex(r => r.id === requestId);
  
  if (requestIndex !== -1) {
    serviceRequests[requestIndex].status = newStatus;
    syncData('serviceRequests', serviceRequests);
    return true;
  }
  return false;
}

// Função para excluir uma solicitação de serviço e sincronizar
function deleteServiceRequestAndSync(requestId) {
  const serviceRequests = getSyncedData('serviceRequests');
  const newRequests = serviceRequests.filter(r => r.id !== requestId);
  
  if (newRequests.length !== serviceRequests.length) {
    syncData('serviceRequests', newRequests);
    return true;
  }
  return false;
}
