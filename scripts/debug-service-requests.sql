-- Script para debugar problemas com service_requests

-- 1. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_requests'
ORDER BY ordinal_position;

-- 2. Listar todos os dealers
SELECT id, name, email FROM dealers ORDER BY name;

-- 3. Listar todas as service requests com dealer info
SELECT 
    sr.request_id,
    sr.dealer_id,
    d.name as dealer_name,
    sr.customer_name,
    sr.boat_model,
    sr.request_type,
    sr.status,
    sr.created_at
FROM service_requests sr
LEFT JOIN dealers d ON sr.dealer_id = d.id
ORDER BY sr.created_at DESC;

-- 4. Verificar se há service requests sem dealer_id válido
SELECT 
    sr.request_id,
    sr.dealer_id,
    sr.customer_name,
    sr.created_at
FROM service_requests sr
WHERE NOT EXISTS (
    SELECT 1 FROM dealers d WHERE d.id = sr.dealer_id
);

-- 5. Contar service requests por dealer
SELECT 
    d.name as dealer_name,
    COUNT(sr.id) as total_requests
FROM dealers d
LEFT JOIN service_requests sr ON d.id = sr.dealer_id
GROUP BY d.id, d.name
ORDER BY total_requests DESC;