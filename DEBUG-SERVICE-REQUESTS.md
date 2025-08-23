# Debug - Problema com Service Requests no After Sales

## Problema Identificado
As novas solicitações criadas na aba "After Sales" não estão aparecendo no Histórico de Solicitações de Serviço.

## Possíveis Causas e Soluções Implementadas

### 1. **Problema de Case Sensitivity no Nome do Dealer**
- **Causa**: A comparação entre o nome do dealer no localStorage e no banco de dados era case-sensitive
- **Solução**: Implementado comparação case-insensitive com trim() em:
  - `/app/api/save-service-request/route.ts`
  - `/app/api/get-dealer-service-requests/route.ts`

### 2. **Falta do dealer_id na requisição**
- **Causa**: O front-end estava enviando apenas o dealerName, não o dealer_id
- **Solução**: 
  - Modificado `/app/dealer/after-sales/page.tsx` para enviar também o dealer_id
  - Modificado `/app/api/save-service-request/route.ts` para aceitar dealer_id como fallback

### 3. **Logs de Debug Adicionados**
Foram adicionados console.logs em pontos estratégicos:
- Ao carregar service requests (dealer name e ID)
- Ao submeter nova solicitação (dados enviados)
- Na API de save (dealer encontrado)
- Na API de get (dealer encontrado e quantidade de requests)

## Como Testar

### 1. Página de Teste
Acesse `/dealer/test-service-requests` após fazer login como dealer para:
- Ver o dealer name e ID atual
- Criar uma solicitação de teste
- Ver todas as solicitações do dealer

### 2. Verificar no Console do Navegador
Abra o console (F12) e procure por mensagens começando com "Debug -":
```
Debug - Loading service requests for: {dealerName: "Nome", dealerId: "uuid"}
Debug - Submitting request with: {dealerName: "Nome", dealerId: "uuid"}
Debug - API response: {success: true, data: [...]}
```

### 3. Verificar no Banco de Dados
Execute o script SQL `/scripts/debug-service-requests.sql` para:
- Ver estrutura da tabela
- Listar todos os dealers
- Ver todas as service requests com dealer info
- Identificar requests órfãs
- Contar requests por dealer

## Checklist de Verificação

1. [ ] O dealer está logado corretamente? (verificar localStorage)
2. [ ] O dealer existe no banco de dados?
3. [ ] O dealer_id está sendo salvo corretamente na service_request?
4. [ ] O nome do dealer no localStorage corresponde exatamente ao do banco?
5. [ ] A API está retornando as solicitações corretamente?

## Próximos Passos se o Problema Persistir

1. **Verificar o banco de dados diretamente**:
   ```sql
   SELECT * FROM dealers WHERE name ILIKE '%nome_do_dealer%';
   SELECT * FROM service_requests ORDER BY created_at DESC LIMIT 10;
   ```

2. **Limpar e refazer o login**:
   - Fazer logout
   - Limpar localStorage: `localStorage.clear()`
   - Fazer login novamente

3. **Verificar se há múltiplos dealers com nomes similares**:
   ```sql
   SELECT id, name, email FROM dealers WHERE name ILIKE '%parte_do_nome%';
   ```

4. **Verificar logs do servidor** para erros não capturados no front-end