-- Script para verificar e corrigir o tipo de dealer_id na tabela quotes
-- Executar este script no Supabase SQL Editor

-- 1. Verificar o tipo atual de dealer_id
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'dealer_id';

-- 2. Verificar se há dados na tabela quotes
SELECT COUNT(*) as total_quotes FROM quotes;

-- 3. Verificar se há algum orçamento com dealer_id inválido
SELECT 
    q.id,
    q.quote_id,
    q.dealer_id,
    q.customer_name,
    q.created_at,
    d.name as dealer_name
FROM quotes q
LEFT JOIN dealers d ON q.dealer_id::text = d.id::text
ORDER BY q.created_at DESC
LIMIT 10;

-- 4. Script para corrigir o tipo de dealer_id (SE NECESSÁRIO)
-- ATENÇÃO: Execute este bloco APENAS se o tipo de dealer_id NÃO for UUID
DO $$
DECLARE
    current_type text;
    has_data boolean;
BEGIN
    -- Obter o tipo atual da coluna dealer_id
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'dealer_id';
    
    -- Verificar se há dados na tabela
    SELECT COUNT(*) > 0 INTO has_data FROM quotes;
    
    -- Se a coluna existe e não é UUID, fazer a conversão
    IF current_type IS NOT NULL AND current_type != 'uuid' THEN
        RAISE NOTICE 'Tipo atual de dealer_id: %', current_type;
        RAISE NOTICE 'Tabela tem dados: %', has_data;
        
        -- Se não há dados, podemos simplesmente alterar o tipo
        IF NOT has_data THEN
            RAISE NOTICE 'Alterando tipo de dealer_id para UUID (tabela vazia)...';
            
            -- Remover constraints existentes
            ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_dealer_id_fkey;
            
            -- Alterar o tipo da coluna
            ALTER TABLE quotes ALTER COLUMN dealer_id TYPE UUID USING NULL;
            
            -- Recriar a constraint de foreign key
            ALTER TABLE quotes 
            ADD CONSTRAINT quotes_dealer_id_fkey 
            FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE;
            
        ELSE
            RAISE NOTICE 'AVISO: A tabela quotes contém dados. Conversão manual necessária.';
            RAISE NOTICE 'Execute os seguintes comandos manualmente após fazer backup:';
            RAISE NOTICE '';
            RAISE NOTICE '-- 1. Criar nova coluna temporária';
            RAISE NOTICE 'ALTER TABLE quotes ADD COLUMN dealer_id_new UUID;';
            RAISE NOTICE '';
            RAISE NOTICE '-- 2. Copiar dados convertendo para UUID (ajuste conforme necessário)';
            RAISE NOTICE '-- UPDATE quotes SET dealer_id_new = dealer_id::UUID WHERE dealer_id IS NOT NULL;';
            RAISE NOTICE '';
            RAISE NOTICE '-- 3. Remover coluna antiga e renomear nova';
            RAISE NOTICE 'ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_dealer_id_fkey;';
            RAISE NOTICE 'ALTER TABLE quotes DROP COLUMN dealer_id;';
            RAISE NOTICE 'ALTER TABLE quotes RENAME COLUMN dealer_id_new TO dealer_id;';
            RAISE NOTICE '';
            RAISE NOTICE '-- 4. Recriar constraints';
            RAISE NOTICE 'ALTER TABLE quotes ADD CONSTRAINT quotes_dealer_id_fkey FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE;';
        END IF;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_quotes_dealer_id ON quotes(dealer_id);
        
        RAISE NOTICE 'Processo concluído!';
    ELSE
        RAISE NOTICE 'dealer_id já é do tipo UUID. Nenhuma ação necessária.';
    END IF;
END $$;

-- 5. Verificar o resultado final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'dealer_id';

-- 6. Verificar integridade referencial
SELECT 
    COUNT(*) as orphaned_quotes
FROM quotes q
WHERE NOT EXISTS (
    SELECT 1 FROM dealers d WHERE d.id = q.dealer_id
);