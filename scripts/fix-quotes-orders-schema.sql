-- Script para garantir compatibilidade entre tabelas quotes e orders
-- Execute apenas se necessário após verificar com o script anterior

-- Adicionar colunas que podem estar faltando na tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS upholstery_package TEXT DEFAULT '';

-- Adicionar colunas que podem estar faltando na tabela quotes
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS upholstery_package TEXT DEFAULT '';

-- Verificar se as colunas de additional_options são do tipo correto (JSONB)
DO $$
BEGIN
    -- Para quotes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' 
        AND column_name = 'additional_options' 
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE quotes ALTER COLUMN additional_options TYPE JSONB USING additional_options::JSONB;
    END IF;
    
    -- Para orders
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'additional_options' 
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE orders ALTER COLUMN additional_options TYPE JSONB USING additional_options::JSONB;
    END IF;
END $$;

-- Garantir que dealer_id seja UUID em ambas as tabelas
ALTER TABLE quotes ALTER COLUMN dealer_id TYPE UUID USING dealer_id::UUID;
ALTER TABLE orders ALTER COLUMN dealer_id TYPE UUID USING dealer_id::UUID;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_quotes_dealer_id ON quotes(dealer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_orders_dealer_id ON orders(dealer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Verificar se tudo está correto
SELECT 'quotes' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotes' 
AND column_name IN ('dealer_id', 'additional_options', 'upholstery_package')

UNION ALL

SELECT 'orders' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('dealer_id', 'additional_options', 'upholstery_package');
