# Correção - Solicitações de Serviço não Aparecem no Histórico

## Problema
As solicitações de serviço criadas são salvas no banco de dados mas não aparecem no histórico do dealer.

## Causas Identificadas

1. **Inconsistência no ID do Dealer**
   - O ID do dealer estava sendo convertido para string com `.toString()` no login
   - A comparação no banco de dados pode falhar se os tipos não coincidirem

2. **API de busca usando apenas o nome**
   - A API `/api/get-dealer-service-requests` estava usando apenas o nome do dealer
   - Problemas com case sensitivity e espaços em branco

3. **Falta do email do dealer no localStorage**
   - O email não estava sendo salvo durante o login

## Soluções Implementadas

### 1. API de Busca Melhorada
- Modificado `/app/api/get-dealer-service-requests/route.ts`:
  - Aceita tanto `dealerName` quanto `dealerId` como parâmetros
  - Prioriza busca por ID quando disponível
  - Mantém fallback para busca por nome (case-insensitive)

### 2. Frontend Atualizado
- Modificado `/app/dealer/after-sales/page.tsx`:
  - Envia tanto `dealerName` quanto `dealerId` na requisição
  - Usa URLSearchParams para construir a query string corretamente

### 3. Login Melhorado
- Modificado `/app/dealer/page.tsx`:
  - Adicionado log de debug do dealer info
  - Salva também o email do dealer no localStorage

### 4. Debug Melhorado
- Modificado `/app/api/dealer-auth/route.ts`:
  - Adicionados logs para verificar o tipo do ID
  - Logs do objeto dealer completo antes de enviar

### 5. Página de Debug Completa
- Criado `/app/dealer/debug-service-requests/page.tsx`:
  - Mostra informações do dealer (localStorage vs banco)
  - Permite criar solicitações de teste
  - Mostra todos os dealers do banco
  - Logs detalhados de todas as operações

## Como Testar

1. **Fazer logout e login novamente**
   ```javascript
   localStorage.clear()
   // Fazer login novamente
   ```

2. **Acessar a página de debug**
   - Navegue para `/dealer/debug-service-requests`
   - Verifique se o dealer está corretamente identificado
   - Crie uma solicitação de teste

3. **Verificar no console do navegador**
   - Procure por mensagens começando com "Debug -"
   - Verifique se o ID e nome do dealer estão corretos

4. **Verificar no banco de dados**
   ```sql
   -- Verificar dealer
   SELECT id, name, email FROM dealers WHERE name ILIKE '%nome_dealer%';
   
   -- Verificar solicitações
   SELECT sr.*, d.name as dealer_name 
   FROM service_requests sr
   JOIN dealers d ON sr.dealer_id = d.id
   WHERE d.name ILIKE '%nome_dealer%'
   ORDER BY sr.created_at DESC;
   ```

## Possíveis Problemas Restantes

1. **Tipo do ID no Banco**
   - Se o ID no banco for UUID e estiver sendo comparado como string
   - Solução: A API agora tenta comparação com e sem conversão

2. **Cache do Navegador**
   - Limpar cache e cookies pode ajudar
   - Fazer hard refresh (Ctrl+Shift+R)

3. **Múltiplos Dealers com Nome Similar**
   - Verificar se não há duplicatas no banco
   - A página de debug mostra todos os dealers

## Próximos Passos se o Problema Persistir

1. Verificar os logs do servidor (Render/Supabase)
2. Executar o script SQL de debug
3. Verificar se o dealer_id está sendo salvo corretamente nas novas solicitações
4. Confirmar que não há problemas de permissão no banco de dados