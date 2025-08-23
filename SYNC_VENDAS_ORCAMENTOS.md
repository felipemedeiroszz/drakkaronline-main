# Sistema de Sincronização: Vendas ↔ Orçamentos

## 📋 Visão Geral

Este documento descreve a implementação da sincronização automática entre a aba **Vendas** e a página **Orçar Cliente**. Sempre que um dealer modificar preços na aba Vendas, esses novos valores MSRP serão automaticamente refletidos na página de Orçamentos em tempo real, sem necessidade de recarregar a página.

## 🔄 Como Funciona

### 1. **Sistema de Eventos (Hook Personalizado)**

Criamos um hook personalizado `useDealerPricingSync` que gerencia a sincronização:

- **Localização**: `/hooks/use-dealer-pricing-sync.ts`
- **Função Principal**: Detectar mudanças nos preços e notificar outras páginas
- **Tecnologias**: React Hooks, LocalStorage, Custom Events

### 2. **Fluxo de Sincronização**

```mermaid
graph LR
    A[Dealer modifica preço na aba Vendas] --> B[handleSaveItem() é executado]
    B --> C[Preço salvo na API /dealer-pricing]
    C --> D[notifyPricingUpdate() é chamado]
    D --> E[Evento customizado é disparado]
    E --> F[localStorage é atualizado]
    F --> G[Página Orçamentos detecta mudança]
    G --> H[reloadDealerConfig() recarrega dados]
    H --> I[Interface é atualizada automaticamente]
```

### 3. **Componentes Modificados**

#### **Página de Vendas** (`/app/dealer/sales/page.tsx`)
- ✅ Importa o hook `useDealerPricingSync`
- ✅ Chama `notifyPricingUpdate()` após salvar preços
- ✅ Notifica outras abas sobre alterações

#### **Página de Orçamentos** (`/app/dealer/quote-client/page.tsx`)
- ✅ Usa o hook para detectar mudanças
- ✅ Atualiza automaticamente configurações
- ✅ Mostra indicador visual durante sincronização
- ✅ Atualiza filtros de produtos compatíveis

## 🚀 Funcionalidades Implementadas

### ✅ **Sincronização em Tempo Real**
- Detecção automática de mudanças nos preços MSRP
- Atualização instantânea sem recarregar página
- Sincronização entre múltiplas abas do navegador

### ✅ **Feedback Visual**
- Indicador de carregamento durante sincronização
- Notificações automáticas informando sobre atualizações
- Mensagens traduzidas (PT, EN, ES)

### ✅ **Sistema Robusto**
- Controle de estado centralizado (Singleton Pattern)
- Tratamento de erros
- Cache inteligente via localStorage

### ✅ **Multi-idioma**
- Mensagens de sincronização traduzidas
- Interface consistente em todos os idiomas

## 🔧 Arquitetura Técnica

### **DealerPricingSyncManager (Singleton)**
```typescript
class DealerPricingSyncManager {
  // Gerencia estado centralizado da sincronização
  // Controla listeners e notificações
  // Persiste estado no localStorage
}
```

### **Hook useDealerPricingSync**
```typescript
export function useDealerPricingSync() {
  // Expõe funcionalidades de sincronização
  // Gerencia carregamento de configurações
  // Controla estado de loading/erro
}
```

### **Eventos de Sincronização**

1. **Evento Customizado**: `dealerPricingUpdate`
2. **LocalStorage**: `dealerPricingLastUpdate` e `dealerPricingUpdatedBy`
3. **Storage Event**: Detecta mudanças entre abas

## 📱 Experiência do Usuário

### **Fluxo Normal:**
1. Dealer abre aba **Vendas** e aba **Orçamentos**
2. Modifica preço na aba **Vendas**
3. Salva as alterações
4. **Automaticamente** na aba **Orçamentos**:
   - Aparece indicador "🔄 Sincronizando preços..."
   - Dados são recarregados em background
   - Preços atualizados aparecem instantaneamente
   - Notificação confirma "Preços atualizados automaticamente"

### **Indicadores Visuais:**

#### Durante Sincronização:
```jsx
// Na página de Orçamentos
{isSyncing && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center space-x-2 text-blue-700">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
      <span>Sincronizando preços atualizados da aba Vendas...</span>
    </div>
  </div>
)}
```

#### Notificação de Sucesso:
- ✅ "Preços atualizados automaticamente" (PT)
- ✅ "Prices updated automatically" (EN)  
- ✅ "Precios actualizados automáticamente" (ES)

## 🔍 APIs Envolvidas

### **1. POST /api/dealer-pricing**
- Salva preços MSRP específicos do dealer
- Dispara evento de sincronização

### **2. GET /api/get-dealer-config?dealer_id=xxx**
- Retorna configurações com preços MSRP aplicados
- Usado para recarregar dados durante sincronização

## 🧪 Como Testar

### **Cenário de Teste:**
1. Abra duas abas no navegador
2. **Aba 1**: Navegue para `/dealer/sales`
3. **Aba 2**: Navegue para `/dealer/quote-client`
4. Na **Aba 1**: Modifique o preço de um item e salve
5. **Resultado Esperado**: Na **Aba 2** você deve ver:
   - Indicador de sincronização aparecer
   - Preços atualizados automaticamente
   - Notificação de confirmação

### **Logs de Debug:**
O sistema inclui logs detalhados no console:
```
🔄 Notificando atualização de preços para outras páginas
🔄 DealerPricingSync: Recebida notificação de atualização  
🔄 Atualizando configuração devido à sincronização de preços
✅ DealerPricingSync: Configurações sincronizadas 3 preços
```

## 📊 Benefícios da Implementação

### **Para o Dealer:**
- ✅ **Produtividade**: Não precisa mais recarregar páginas
- ✅ **Consistência**: Dados sempre atualizados em todas as abas
- ✅ **Confiabilidade**: Sistema robusto com tratamento de erros

### **Para a Aplicação:**
- ✅ **Performance**: Carregamento inteligente apenas quando necessário
- ✅ **UX Melhorada**: Feedback visual claro e imediato
- ✅ **Escalabilidade**: Sistema pode ser estendido para outras sincronizações

### **Para Manutenção:**
- ✅ **Código Modular**: Hook reutilizável
- ✅ **Fácil Debug**: Logs detalhados
- ✅ **Extensível**: Pode ser usado em outras páginas

## 🔄 Estados da Sincronização

| Estado | Descrição | UI |
|--------|-----------|-----|
| `idle` | Nenhuma sincronização ativa | Interface normal |
| `loading` | Carregando dados atualizados | Spinner + mensagem |
| `synced` | Dados sincronizados com sucesso | Notificação verde |
| `error` | Erro durante sincronização | Notificação vermelha |

## 🛠️ Manutenção e Monitoramento

### **Logs Importantes:**
- `✅ DealerPricingSync: Configurações sincronizadas`
- `❌ DealerPricingSync: Erro ao recarregar configurações`
- `🔄 DealerPricingSync: Mudança detectada no localStorage`

### **Pontos de Monitoramento:**
1. **Performance**: Tempo de sincronização (deve ser < 2s)
2. **Reliability**: Taxa de sucesso das sincronizações
3. **Usage**: Frequência de uso do sistema

---

## ✅ **CONCLUSÃO**

O sistema de sincronização foi implementado com sucesso, garantindo que **toda alteração feita na aba Vendas seja aplicada automaticamente nos valores da página Orçar Cliente**, conforme solicitado. 

A implementação é robusta, escalável e oferece uma excelente experiência do usuário com feedback visual claro e suporte multi-idioma completo.