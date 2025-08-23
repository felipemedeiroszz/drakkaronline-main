# Guia de Sincronização em Tempo Real - Sales para Quote Client

## Visão Geral

O sistema de sincronização em tempo real permite que alterações de preços feitas na aba **Sales** sejam automaticamente refletidas na aba **Quote Client** sem necessidade de recarregar a página.

## Como Funciona

### 1. Arquitetura do Sistema

```
Sales Page → notifyPricingUpdate() → DealerPricingSyncManager → Quote Client Page
                                            ↓
                                    localStorage + eventos
```

### 2. Componentes Principais

#### Hook: `useDealerPricingSync`
- **Localização**: `/hooks/use-dealer-pricing-sync.ts`
- **Função**: Gerencia a sincronização entre páginas
- **Recursos**:
  - Singleton pattern para compartilhar estado
  - Debounce de 300ms para evitar múltiplas atualizações
  - Sincronização via localStorage e eventos customizados

#### DealerPricingSyncManager
- Gerencia listeners e notificações
- Mantém estado global de sincronização
- Dispara eventos para sincronização entre abas

### 3. Fluxo de Sincronização

1. **Na página Sales** (`/app/dealer/sales/page.tsx`):
   ```typescript
   // Quando um preço é salvo:
   notifyPricingUpdate(dealerId)
   ```

2. **No Hook**:
   - Atualiza localStorage com timestamp
   - Dispara evento customizado `dealerPricingUpdate`
   - Notifica todos os listeners registrados

3. **Na página Quote Client** (`/app/dealer/quote-client/page.tsx`):
   - Escuta mudanças via hook
   - Recarrega configurações automaticamente
   - Atualiza preços sem recarregar a página

## Como Testar

### Método 1: Teste Manual com Duas Abas

1. Abra o portal do dealer e faça login
2. Abra a página **Sales** em uma aba
3. Abra a página **Quote Client** em outra aba
4. Na aba Sales, edite e salve um preço
5. Observe a aba Quote Client - ela deve mostrar:
   - Indicador de sincronização (spinner azul)
   - Mensagem "Sincronizando preços atualizados..."
   - Preços atualizados automaticamente

### Método 2: Teste com Arquivo HTML

1. Abra o arquivo `/workspace/test-sync.html` em duas abas do navegador
2. Em uma aba, clique em "Simular Atualização de Preços"
3. Observe o log na outra aba - deve mostrar a detecção da mudança

### Método 3: Console do Navegador

Abra o console (F12) e observe os logs:

**Na aba Sales ao salvar:**
```
🔄 Sales - Notificando atualização de preços para outras páginas
  - Dealer ID: [uuid]
  - Item atualizado: {...}
🔔 DealerPricingSyncManager.notifyPricingUpdate chamado
  - Executando notificação após debounce (300ms)
  - LocalStorage atualizado
  - Evento customizado disparado com sucesso
```

**Na aba Quote Client:**
```
🔄 DealerPricingSync: StorageEvent recebido
  - Key: dealerPricingLastUpdate
🔄 DealerPricingSync: Mudança detectada no localStorage (de outra aba)
📊 Quote Client - useEffect syncedConfig triggered
🔄 Atualizando configuração devido à sincronização de preços
```

## Troubleshooting

### Problema: Sincronização não está funcionando

1. **Verifique o localStorage**:
   ```javascript
   // No console do navegador:
   localStorage.getItem('currentDealerId')
   localStorage.getItem('dealerPricingLastUpdate')
   localStorage.getItem('dealerPricingUpdatedBy')
   ```

2. **Verifique se as abas estão no mesmo domínio**:
   - localStorage e eventos só funcionam entre abas do mesmo domínio

3. **Verifique os logs do console**:
   - Procure por erros ou warnings
   - Confirme que os eventos estão sendo disparados

4. **Limpe o cache**:
   ```javascript
   localStorage.clear()
   // Faça login novamente
   ```

### Problema: Sincronização muito lenta

- O sistema tem um debounce de 300ms por design
- Múltiplas atualizações rápidas são agrupadas
- Isso é intencional para evitar sobrecarga

### Problema: Preços não atualizam

1. Verifique se o dealer tem preços configurados:
   - Vá para Sales e configure pelo menos um preço
   - Salve e aguarde a sincronização

2. Verifique a API:
   - Abra Network no DevTools
   - Procure por chamadas para `/api/get-dealer-config`
   - Verifique se retorna success: true

## Melhorias Implementadas

1. **Logs de Debug Detalhados**:
   - Adicionados em todos os pontos críticos
   - Facilitam troubleshooting

2. **Indicador Visual**:
   - Spinner e mensagem na página Quote Client
   - Mostra quando sincronização está ocorrendo

3. **Debounce Inteligente**:
   - Evita múltiplas chamadas desnecessárias
   - Agrupa atualizações próximas

4. **Sincronização Robusta**:
   - Funciona entre abas via localStorage
   - Funciona na mesma aba via eventos
   - Fallback para recarregar configurações

## Código de Exemplo

### Para adicionar sincronização em nova página:

```typescript
import { useDealerPricingSync } from "@/hooks/use-dealer-pricing-sync"

function MyComponent() {
  const { 
    dealerConfig: syncedConfig, 
    reloadDealerConfig, 
    isLoading: isSyncing,
    lastUpdate 
  } = useDealerPricingSync()

  // Reagir a mudanças
  useEffect(() => {
    if (syncedConfig) {
      // Atualizar estado local com novos preços
      updateLocalPrices(syncedConfig)
    }
  }, [syncedConfig, lastUpdate])

  // Para notificar mudanças
  const handlePriceChange = () => {
    // ... salvar preço ...
    notifyPricingUpdate(dealerId)
  }
}
```

## Conclusão

O sistema de sincronização em tempo real está totalmente implementado e funcionando. Use os logs de debug e as ferramentas de teste fornecidas para verificar o funcionamento e diagnosticar problemas.