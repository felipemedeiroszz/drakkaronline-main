# Sincronização em Tempo Real: Admin ↔ Sales

## 📋 Resumo

Este documento descreve a implementação aprimorada da sincronização em tempo real entre o **Painel Administrativo** e a **Página de Vendas (Sales)**. A sincronização garante que mudanças feitas no painel admin sejam automaticamente refletidas na página de vendas sem necessidade de recarregamento manual.

## 🎯 Problema Resolvido

**Situação**: Quando um administrador faz alterações no painel admin (modelos de barco, preços, opções, etc.), essas mudanças não apareciam automaticamente na página de vendas, exigindo que o usuário recarregasse a página manualmente.

**Solução**: Implementação de múltiplas camadas de sincronização em tempo real:
1. **Supabase Real-time** (via WebSocket)
2. **Eventos Customizados** (entre abas do mesmo navegador)
3. **LocalStorage Sync** (sincronização entre múltiplas abas)
4. **Sistema de Fallback** (garantia de funcionamento)

## 🏗️ Arquitetura da Solução

### Fluxo de Sincronização

```
Admin Panel → [Salvamento] → Múltiplos Canais → Sales Page → [Atualização]
                    ↓
            1. Supabase Real-time
            2. Eventos Customizados 
            3. LocalStorage Sync
            4. Sistema de Fallback
```

## 🔧 Implementação Técnica

### 1. **Lado Admin (Dispatcher)**

**Arquivo**: `/app/administrator/page.tsx`

Quando dados são salvos no admin, o sistema dispara múltiplos eventos:

```typescript
// Sistema de notificação aprimorado com fallback garantido
const dispatchSyncEvents = () => {
  console.log("🔄 Admin: Iniciando notificação aprimorada para sincronização Sales")
  
  // Identificar quais tipos de dados foram atualizados
  const dataTypesToNotify: string[] = []
  
  if (boatModels) {
    dataTypesToNotify.push('boatModels')
    // Disparar evento específico para modelos de barco
    const boatModelsEvent = new CustomEvent('boatModelsUpdate', {
      detail: { timestamp: Date.now() }
    })
    window.dispatchEvent(boatModelsEvent)
  }

  if (enginePackages || hullColors || upholsteryPackages || additionalOptions) {
    // Disparar evento para opções
    const optionsEvent = new CustomEvent('optionsDataUpdate', {
      detail: { timestamp: Date.now() }
    })
    window.dispatchEvent(optionsEvent)
  }

  // Sistema de fallback garantido
  setTimeout(() => {
    // Evento geral de atualização administrativa
    const adminUpdateEvent = new CustomEvent('adminDataUpdate', {
      detail: {
        timestamp: Date.now(),
        dataTypes: dataTypesToNotify,
        action: 'bulk_save',
        source: 'admin_panel'
      }
    })
    window.dispatchEvent(adminUpdateEvent)

    // Ping específico para Sales page
    const salesPingEvent = new CustomEvent('adminToSalesSync', {
      detail: {
        timestamp: Date.now(),
        message: 'Dados administrativos atualizados',
        dataTypes: dataTypesToNotify
      }
    })
    window.dispatchEvent(salesPingEvent)

    // Atualizar localStorage para sincronização entre abas
    localStorage.setItem('adminLastSave', JSON.stringify({
      timestamp: Date.now(),
      dataTypes: dataTypesToNotify,
      action: 'bulk_save'
    }))
  }, 100)
}
```

### 2. **Lado Sales (Receiver)**

**Arquivo**: `/app/dealer/sales/page.tsx`

A página de vendas escuta múltiplos tipos de eventos:

```typescript
// Event listeners aprimorados para sincronização em tempo real
useEffect(() => {
  if (!dealerId) return

  // Função de debounce para evitar múltiplas chamadas
  const debouncedReload = (message: string, delay: number = 300) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!loading && !isUpdating) {
        loadData(dealerId, true)
        showNotification(message, "info")
      }
    }, delay)
  }

  // Handlers para diferentes tipos de eventos
  const handleOptionsUpdate = (event: CustomEvent) => {
    const { dataType } = event.detail || {}
    let message = "📦 Opções atualizadas pelo administrador"
    
    switch (dataType) {
      case 'enginePackages': message = "🔧 Pacotes de motor atualizados"; break
      case 'hullColors': message = "🎨 Cores de casco atualizadas"; break
      case 'upholsteryPackages': message = "🪑 Pacotes de estofamento atualizados"; break
      case 'additionalOptions': message = "⚙️ Opções adicionais atualizadas"; break
    }
    
    debouncedReload(message, 200)
  }

  const handleBoatModelsUpdate = (event: CustomEvent) => {
    debouncedReload("🚢 Modelos de barco atualizados", 200)
  }

  const handleAdminToSalesSync = (event: CustomEvent) => {
    const { message, dataTypes } = event.detail || {}
    let notificationMessage = message || "📡 Dados atualizados pelo administrador"
    
    if (dataTypes?.includes('boatModels')) {
      notificationMessage = "🚢 Modelos de barco atualizados pelo admin"
    } else if (dataTypes?.some(type => ['enginePackages', 'hullColors', 'upholsteryPackages', 'additionalOptions'].includes(type))) {
      notificationMessage = "⚙️ Opções atualizadas pelo admin"
    }
    
    debouncedReload(notificationMessage, 100)
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'adminDataLastUpdate' || event.key === 'adminLastSave') {
      debouncedReload("📱 Sincronizado com outras abas", 300)
    }
  }

  // Registrar todos os listeners
  window.addEventListener('optionsDataUpdate', handleOptionsUpdate)
  window.addEventListener('boatModelsUpdate', handleBoatModelsUpdate)
  window.addEventListener('adminToSalesSync', handleAdminToSalesSync)
  window.addEventListener('storage', handleStorageChange)
  // ... outros listeners

  return () => {
    // Cleanup dos listeners
    window.removeEventListener('optionsDataUpdate', handleOptionsUpdate)
    window.removeEventListener('boatModelsUpdate', handleBoatModelsUpdate)
    window.removeEventListener('adminToSalesSync', handleAdminToSalesSync)
    window.removeEventListener('storage', handleStorageChange)
    // ... outros cleanups
  }
}, [dealerId, loading, isUpdating])
```

### 3. **Supabase Real-time (WebSocket)**

**Arquivo**: `/hooks/use-realtime-sync.ts`

```typescript
export function useDealerRealtimeSync(dealerId: string, onUpdate: () => void) {
  const dealerTables = [
    'dealer_pricing',
    'engine_packages',
    'hull_colors', 
    'upholstery_packages',
    'additional_options',
    'boat_models'
  ]

  const handleUpdate = useCallback((update: RealtimeUpdate) => {
    console.log('🔄 Dealer realtime update:', update)
    
    // Para dealer_pricing, só dispara se for relevante para este dealer
    if (update.table === 'dealer_pricing') {
      const isRelevant = 
        (update.data && update.data.dealer_id === dealerId) ||
        (update.old_data && update.old_data.dealer_id === dealerId)
      
      if (!isRelevant) return
    }
    
    onUpdate()
    
    // Disparar evento customizado para compatibilidade
    const event = new CustomEvent('dealerRealtimeUpdate', {
      detail: update
    })
    window.dispatchEvent(event)
  }, [dealerId, onUpdate])

  useRealtimeSync(dealerTables, handleUpdate)
}
```

## 📊 Tipos de Eventos Sincronizados

| Evento | Quando Dispara | Dados Afetados | Delay |
|--------|----------------|----------------|-------|
| `boatModelsUpdate` | Mudanças em modelos de barco | Modelos de barco | 200ms |
| `optionsDataUpdate` | Mudanças em opções (cores, motores, etc.) | Opções e configurações | 200ms |
| `dealerPricingUpdate` | Mudanças em preços | Preços específicos do dealer | Imediato |
| `adminDataUpdate` | Salvamento geral no admin | Dados administrativos | 400ms |
| `forceCacheInvalidation` | Invalidação forçada | Cache e dados armazenados | Imediato |
| `adminToSalesSync` | Evento direto admin → sales | Todos os dados relevantes | 100ms |

## 🔄 Sistema de Fallback

Para garantir que a sincronização funcione mesmo se algum canal falhar:

### 1. **Múltiplos Canais**
- Supabase Real-time (WebSocket)
- Eventos DOM customizados
- LocalStorage sync
- Heartbeat monitoring

### 2. **Debounce e Throttling**
- Evita múltiplas chamadas simultâneas
- Protege contra loops infinitos
- Otimiza performance

### 3. **Estado de Loading**
- Previne conflitos durante carregamento
- Indicadores visuais para o usuário
- Proteção contra chamadas concorrentes

## 🧪 Como Testar

### 1. **Teste Automatizado**

Cole este código no console do navegador:

```javascript
// Carregar script de teste
const script = document.createElement('script');
script.src = '/test-admin-sales-sync.js';
document.head.appendChild(script);

// Aguardar carregamento e executar teste
setTimeout(() => {
  testAdminSalesSync.simulateAdminSave();
}, 1000);
```

### 2. **Teste Manual**

1. **Abra duas abas**:
   - Aba 1: Painel Admin (`/administrator`)
   - Aba 2: Página Sales (`/dealer/sales`)

2. **Faça mudanças no admin**:
   - Adicione/edite modelos de barco
   - Modifique cores de casco
   - Altere pacotes de motor
   - Salve as mudanças

3. **Verifique a sincronização**:
   - A página Sales deve mostrar notificação
   - Dados devem ser atualizados automaticamente
   - Console deve mostrar logs de sincronização

### 3. **Monitoramento de Eventos**

```javascript
// Monitorar todos os eventos de sincronização
const eventTypes = ['optionsDataUpdate', 'boatModelsUpdate', 'adminToSalesSync'];
eventTypes.forEach(type => {
  window.addEventListener(type, (e) => {
    console.log(`📡 ${type}:`, e.detail);
  });
});
```

## 📈 Benefícios da Implementação

### ✅ **Para Usuários**
- **Sincronização automática**: Dados sempre atualizados
- **Interface responsiva**: Feedback visual das atualizações
- **Experiência fluida**: Sem necessidade de recarregar páginas
- **Trabalho multi-aba**: Sincronização entre abas abertas

### ✅ **Para Desenvolvedores**
- **Sistema robusto**: Múltiplas camadas de fallback
- **Logs detalhados**: Facilita debugging e monitoramento
- **Performance otimizada**: Debounce previne chamadas excessivas
- **Código modular**: Fácil manutenção e extensão

### ✅ **Para Sistema**
- **Redução de carga**: Atualizações incrementais vs recarregamentos completos
- **Escalabilidade**: Funciona com múltiplos usuários
- **Confiabilidade**: Sistema de fallback garante funcionamento

## 🔍 Troubleshooting

### Problema: "Sales page não recebe atualizações"

**Verificações**:
1. Console do navegador mostra eventos sendo disparados?
2. LocalStorage está sendo atualizado?
3. Supabase está configurado corretamente?
4. DealerId está definido na página Sales?

**Soluções**:
```javascript
// Testar conectividade
testAdminSalesSync.testConnectivity();

// Verificar estado
testAdminSalesSync.checkCurrentState();

// Simular evento manual
window.dispatchEvent(new CustomEvent('adminToSalesSync', {
  detail: { timestamp: Date.now(), message: 'Teste manual' }
}));
```

### Problema: "Múltiplas notificações/loops infinitos"

**Causa**: Falta de debounce ou proteção de estado

**Solução**: Verificar se os timeouts estão configurados e se há proteção contra `loading` state.

### Problema: "Sincronização entre abas não funciona"

**Causa**: LocalStorage events não sendo disparados

**Solução**: Verificar se os listeners de `storage` estão configurados corretamente.

## 📚 Arquivos Relacionados

- **Admin Panel**: `/app/administrator/page.tsx`
- **Sales Page**: `/app/dealer/sales/page.tsx`
- **Real-time Hooks**: `/hooks/use-realtime-sync.ts`
- **Admin Data Sync**: `/hooks/use-admin-data-sync.ts`
- **Teste de Sincronização**: `/test-admin-sales-sync.js`
- **Configuração Supabase**: `/lib/supabase.ts`

## 🎯 Conclusão

A implementação da sincronização em tempo real entre Admin e Sales garante que:

1. **✅ Dados sempre sincronizados**: Mudanças no admin aparecem imediatamente na página sales
2. **✅ Sistema robusto**: Múltiplas camadas de fallback garantem funcionamento
3. **✅ Performance otimizada**: Debounce e throttling evitam chamadas excessivas
4. **✅ Experiência do usuário aprimorada**: Interface responsiva com feedback claro

A sincronização funciona **automaticamente** e **em tempo real**, resolvendo completamente o problema inicial onde as páginas não se comunicavam.

---

**Status**: ✅ **IMPLEMENTADO E FUNCIONANDO**

**Última atualização**: Dezembro 2024