# Correção: Página Quote Sales usando Preços MSRP ao invés de Preços Dealer

## Problema Identificado
A página de cotações (quote-client) estava exibindo e usando os **Preços Dealer (custo)** ao invés dos **Preços MSRP (venda)** configurados pelo dealer na página de Sales.

## Causa do Problema
Na API `get-dealer-config/route.ts`, quando havia preços MSRP configurados pelo dealer, o código estava mantendo os preços dealer originais nos campos `usd` e `brl`, que são os campos usados pela página quote-client para calcular e exibir os valores.

## Solução Implementada

### Arquivo Corrigido: `/app/api/get-dealer-config/route.ts`

Na função `applyDealerPricing`, linha 209-226, foi alterado para:

**Antes:**
```typescript
// Manter preços dealer (custo) originais nos campos usd/brl
usd: item.usd, // Manter preço dealer original 
brl: item.brl, // Manter preço dealer original
```

**Depois:**
```typescript
// Usar preços MSRP nos campos usd/brl que são usados pela página quote-client
usd: dealerPrice.sale_price_usd || item.usd, // Usar preço MSRP
brl: dealerPrice.sale_price_brl || item.brl, // Usar preço MSRP
```

## Como Funciona Agora

1. **Página Sales**: O dealer configura os preços MSRP (preços de venda) para cada item
2. **API get-dealer-config**: Quando chamada, retorna os itens com:
   - Campos `usd` e `brl`: Contêm os preços MSRP configurados (usados para exibição e cálculo)
   - Campos `cost_usd` e `cost_brl`: Mantêm os preços dealer originais (para referência)
   - Campo `dealer_configured`: Indica se há preço MSRP configurado

3. **Página Quote-Client**: 
   - Usa os campos `usd` e `brl` para calcular totais (função `calculateTotals`)
   - Exibe os preços MSRP com label "(MSRP)" quando configurados
   - Os valores corretos são salvos no orçamento

## Impacto da Correção
- ✅ Cotações agora usam os preços MSRP corretos configurados pelo dealer
- ✅ Valores totais calculados corretamente com base nos preços de venda
- ✅ Mantém compatibilidade com o restante do sistema
- ✅ Preserva os preços de custo originais para referência interna

## Testes Recomendados
1. Configurar preços MSRP na página Sales
2. Criar uma nova cotação na página Quote-Client
3. Verificar que os valores exibidos são os preços MSRP (não os preços dealer)
4. Confirmar que o total calculado usa os preços MSRP

## Data da Correção
- **Data**: Janeiro 2025
- **Arquivo Modificado**: `/app/api/get-dealer-config/route.ts`
- **Linhas Alteradas**: 213-215