-- Verificar estrutura da tabela quotes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Verificar se existem orçamentos na tabela
SELECT COUNT(*) as total_quotes FROM quotes;

-- Verificar se existem pedidos na tabela
SELECT COUNT(*) as total_orders FROM orders;

-- Verificar alguns registros de exemplo
SELECT quote_id, dealer_id, customer_name, status, created_at
FROM quotes
ORDER BY created_at DESC
LIMIT 5;
