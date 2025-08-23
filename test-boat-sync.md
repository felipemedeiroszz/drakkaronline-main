# Teste de Sincronização de Boat Models em Tempo Real

## Como Testar

### 1. Preparação
- Abra 4 abas do navegador:
  - Aba 1: Página Admin (`/administrator`)
  - Aba 2: Página Sales (`/dealer/sales`)
  - Aba 3: Página New Boat (`/dealer/new-boat`)
  - Aba 4: Página Quote Client (`/dealer/quote-client`)

### 2. Teste de Adição de Novo Modelo

1. Na página Admin, vá para a aba "Boat Models"
2. Adicione um novo modelo de barco (ex: "Test Model 2024")
3. Clique em "Save All"
4. Verifique nas outras 3 abas:
   - Deve aparecer uma notificação "Modelos de barco atualizados automaticamente"
   - O novo modelo deve aparecer nas listas/dropdowns

### 3. Teste de Remoção de Modelo

1. Na página Admin, remova um modelo de barco existente
2. Clique em "Save All"
3. Verifique nas outras 3 abas:
   - Deve aparecer uma notificação de atualização
   - O modelo removido não deve mais aparecer nas listas
   - Se o modelo estava selecionado em algum formulário, deve limpar a seleção

### 4. Teste de Edição de Modelo

1. Na página Admin, edite o nome ou preço de um modelo
2. Clique em "Save All"
3. Verifique nas outras abas se as mudanças são refletidas

## Verificação no Console

Abra o Console do navegador (F12) em cada aba e verifique os logs:

- `🚢 BoatModelsSyncManager: Novo listener adicionado`
- `🚢 BoatModelsSync: Evento adminDataUpdate recebido`
- `✅ BoatModelsSync: X modelos de barco sincronizados`

## Problemas Conhecidos

1. A notificação da página Admin para as outras páginas depende do hook `useAdminDataSync` sendo chamado na página Admin
2. A sincronização entre abas usa eventos customizados e localStorage
3. Há um debounce de 300ms para evitar múltiplas atualizações rápidas