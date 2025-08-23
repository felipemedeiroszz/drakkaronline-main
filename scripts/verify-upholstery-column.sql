-- Verificar se a coluna upholstery_package existe na tabela orders
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'upholstery_package';

-- Se a coluna não existir, execute este comando:
-- ALTER TABLE orders ADD COLUMN upholstery_package TEXT;

-- Verificar alguns registros para ver se têm dados
SELECT order_id, boat_model, upholstery_package 
FROM orders 
LIMIT 5;
