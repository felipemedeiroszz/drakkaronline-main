# Fix: Separação entre Preço Dealer e Preço MSRP

## Problema Identificado
O Preço Dealer (BRL) estava acompanhando o valor do Preço MSRP (BRL) indevidamente. Quando o dealer configurava um preço MSRP personalizado, o preço dealer (custo) também era sobrescrito com o mesmo valor.

## Causa Raiz
No arquivo `/app/api/get-dealer-config/route.ts`, quando preços MSRP eram configurados pelo dealer, o código estava sobrescrevendo os campos `usd` e `brl` (que deveriam manter os preços dealer originais) com os valores MSRP:

```typescript
// PROBLEMA: Sobrescrevia preços dealer com MSRP
usd: dealerPrice.sale_price_usd || item.usd, // ❌ Incorreto
brl: dealerPrice.sale_price_brl || item.brl, // ❌ Incorreto
```

## Solução Implementada

### 1. API - Preservar Preços Dealer Originais
**Arquivo:** `/app/api/get-dealer-config/route.ts`

Mantemos os preços dealer originais nos campos `usd` e `brl`, e usamos campos separados para MSRP:

```typescript
// CORRETO: Mantém preços dealer originais
usd: item.usd, // ✅ Preço dealer original
brl: item.brl, // ✅ Preço dealer original
// Campos MSRP separados
sale_price_usd: dealerPrice.sale_price_usd,
sale_price_brl: dealerPrice.sale_price_brl,
price_usd: dealerPrice.sale_price_usd || item.usd,
price_brl: dealerPrice.sale_price_brl || item.brl,
```

### 2. Quote Client - Usar Campos MSRP Corretos
**Arquivo:** `/app/dealer/quote-client/page.tsx`

Atualizamos a página para usar os campos MSRP quando disponíveis:

```typescript
// Função para exibir preços MSRP
const getPriceDisplayText = (item: any, isPt: boolean) => {
  if (item.dealer_configured) {
    // Usar preços MSRP configurados
    const msrpPrice = isPt ? 
      (item.sale_price_brl || item.price_brl || item.brl) : 
      (item.sale_price_usd || item.price_usd || item.usd)
    return `${name} - ${formatCurrency(msrpPrice)} (MSRP)`
  }
  // Usar preços base quando não há configuração
  return `${name} - ${formatCurrency(isPt ? item.brl : item.usd)}`
}

// Cálculo de totais usando MSRP
const baseUsd = boatModel?.sale_price_usd || boatModel?.price_usd || boatModel?.usd || 0
const baseBrl = boatModel?.sale_price_brl || boatModel?.price_brl || boatModel?.brl || 0
```

### 3. Sales Page - Já Está Correta
**Arquivo:** `/app/dealer/sales/page.tsx`

A página de vendas já estava correta, exibindo:
- **Preço Dealer:** Usando `item.usd` e `item.brl` (agora mantém valores originais)
- **Preço MSRP:** Usando `pricing.sale_price_usd` e `pricing.sale_price_brl`

## Estrutura de Dados

### Tabela `boat_models` (e similares)
```sql
- usd: DECIMAL -- Preço dealer/custo em USD (nunca alterado)
- brl: DECIMAL -- Preço dealer/custo em BRL (nunca alterado)
```

### Tabela `dealer_pricing`
```sql
- sale_price_usd: DECIMAL -- Preço MSRP em USD (configurado pelo dealer)
- sale_price_brl: DECIMAL -- Preço MSRP em BRL (configurado pelo dealer)
- margin_percentage: DECIMAL -- Margem de lucro
```

### Resposta da API
```json
{
  "id": 1,
  "name": "Boat Model X",
  "usd": 10000,        // Preço dealer (custo)
  "brl": 50000,        // Preço dealer (custo)
  "sale_price_usd": 12000,  // MSRP configurado
  "sale_price_brl": 60000,  // MSRP configurado
  "price_usd": 12000,       // Fallback para compatibilidade
  "price_brl": 60000,       // Fallback para compatibilidade
  "dealer_configured": true,
  "margin_percentage": 20
}
```

## Teste da Correção

Execute o script de teste para verificar a separação:

```bash
node test-dealer-msrp-separation.js
```

O teste verifica:
1. Preços dealer originais na tabela `boat_models`
2. Preços MSRP configurados na tabela `dealer_pricing`
3. Resposta da API com campos separados
4. Independência entre preços dealer e MSRP

## Resultado
✅ **Preço Dealer (BRL)** agora mantém o valor original de custo
✅ **Preço MSRP (BRL)** pode ser configurado independentemente
✅ Os dois valores são completamente independentes