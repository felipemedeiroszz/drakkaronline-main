# Solução para o Problema do Histórico de Orçamentos

## Problema Identificado

Os orçamentos estão sendo salvos no banco de dados, mas não aparecem no histórico de orçamentos. Após análise do código, identifiquei que o problema está relacionado a uma incompatibilidade de tipos de dados entre as tabelas `dealers` e `quotes`.

## Causa Raiz

1. **Tabela `dealers`**: O campo `id` é do tipo `UUID`
2. **Tabela `quotes`**: O campo `dealer_id` pode estar como `INTEGER` (dependendo de qual script SQL foi executado)
3. **Código da aplicação**: Está enviando e esperando `dealer_id` como `UUID` (string)

Esta incompatibilidade faz com que:
- Os orçamentos sejam salvos com erro silencioso ou
- A busca por `dealer_id` não retorne resultados porque o tipo não corresponde

## Solução

### Passo 1: Verificar o Estado Atual do Banco

Execute este comando SQL no seu banco de dados Supabase:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'dealer_id';
```

### Passo 2: Aplicar a Correção

Se o `data_type` retornado for `integer` ou qualquer coisa diferente de `uuid`, execute o script de correção:

```bash
# No terminal do projeto
psql $DATABASE_URL < scripts/fix-dealer-id-quotes-table.sql
```

Ou execute diretamente no Supabase SQL Editor:

```sql
-- Script para corrigir o tipo de dealer_id na tabela quotes
DO $$
DECLARE
    current_type text;
BEGIN
    -- Obter o tipo atual da coluna dealer_id
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'dealer_id';
    
    -- Se a coluna existe e não é UUID, fazer a conversão
    IF current_type IS NOT NULL AND current_type != 'uuid' THEN
        RAISE NOTICE 'Convertendo dealer_id de % para UUID...', current_type;
        
        -- Remover a constraint de foreign key se existir
        ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_dealer_id_fkey;
        
        -- Alterar o tipo da coluna
        ALTER TABLE quotes ALTER COLUMN dealer_id TYPE UUID USING dealer_id::UUID;
        
        -- Recriar a constraint de foreign key
        ALTER TABLE quotes 
        ADD CONSTRAINT quotes_dealer_id_fkey 
        FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_quotes_dealer_id ON quotes(dealer_id);
        
        RAISE NOTICE 'Conversão concluída com sucesso!';
    END IF;
END $$;
```

### Passo 3: Verificar a Correção

1. Faça login como dealer
2. Gere um novo orçamento
3. Verifique se aparece no histórico de orçamentos

### Passo 4: Verificar os Logs

Abra o console do navegador (F12) e verifique:

1. Ao gerar orçamento:
   - Deve aparecer: `🔍 Gerando orçamento - dealerId: [UUID]`
   - Deve aparecer: `✅ Orçamento salvo com sucesso`

2. Ao carregar histórico:
   - Deve aparecer: `🔍 LoadQuotes - dealerId: [UUID]`
   - Deve aparecer: `✅ Orçamentos carregados: [número]`

## Verificações Adicionais

### 1. Verificar se o dealer_id está sendo salvo corretamente:

```sql
SELECT 
    quote_id,
    dealer_id,
    customer_name,
    created_at
FROM quotes
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Verificar se existe algum orçamento órfão (sem dealer_id válido):

```sql
SELECT 
    q.quote_id,
    q.dealer_id,
    q.customer_name,
    d.name as dealer_name
FROM quotes q
LEFT JOIN dealers d ON q.dealer_id = d.id
WHERE d.id IS NULL;
```

## Prevenção Futura

1. **Sempre use o script mais recente**: `scripts/fix-quotes-orders-schema.sql`
2. **Mantenha consistência de tipos**: Todos os IDs de relacionamento devem ser UUID
3. **Valide no backend**: O código já está validando que o `dealer_id` é uma string válida

## Código Já Corrigido

O código da aplicação já está preparado para trabalhar com UUID:

- ✅ `app/api/save-quote/route.ts` - Valida e salva como UUID
- ✅ `app/api/get-dealer-quotes/route.ts` - Busca por UUID
- ✅ `app/dealer/quote-client/page.tsx` - Envia UUID do localStorage
- ✅ `app/dealer/quotes/page.tsx` - Busca com UUID do localStorage

## Suporte

Se o problema persistir após aplicar estas correções:

1. Verifique os logs do Supabase
2. Confirme que o `localStorage` contém um `currentDealerId` válido
3. Verifique se não há erros de CORS ou autenticação
4. Teste com um dealer diferente para isolar o problema