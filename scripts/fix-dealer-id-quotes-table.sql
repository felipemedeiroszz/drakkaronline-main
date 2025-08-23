-- Script para corrigir o tipo de dealer_id na tabela quotes
-- Este script converte dealer_id de INTEGER para UUID se necessário

-- Primeiro, verificar o tipo atual da coluna dealer_id
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
        
        -- Primeiro, remover a constraint de foreign key se existir
        ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_dealer_id_fkey;
        
        -- Se a coluna é INTEGER e contém IDs numéricos, precisamos fazer uma migração mais complexa
        IF current_type = 'integer' THEN
            -- Criar uma coluna temporária
            ALTER TABLE quotes ADD COLUMN dealer_id_temp UUID;
            
            -- Copiar os dados convertendo de INTEGER para UUID através da tabela dealers
            UPDATE quotes q
            SET dealer_id_temp = d.id
            FROM dealers d
            WHERE q.dealer_id::text = d.id::text;
            
            -- Remover a coluna antiga e renomear a nova
            ALTER TABLE quotes DROP COLUMN dealer_id;
            ALTER TABLE quotes RENAME COLUMN dealer_id_temp TO dealer_id;
        ELSE
            -- Se já é texto, apenas converter para UUID
            ALTER TABLE quotes ALTER COLUMN dealer_id TYPE UUID USING dealer_id::UUID;
        END IF;
        
        -- Recriar a constraint de foreign key
        ALTER TABLE quotes 
        ADD CONSTRAINT quotes_dealer_id_fkey 
        FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE;
        
        -- Criar índice para melhor performance
        CREATE INDEX IF NOT EXISTS idx_quotes_dealer_id ON quotes(dealer_id);
        
        RAISE NOTICE 'Conversão concluída com sucesso!';
    ELSIF current_type = 'uuid' THEN
        RAISE NOTICE 'dealer_id já é do tipo UUID. Nenhuma ação necessária.';
    ELSE
        RAISE NOTICE 'Coluna dealer_id não encontrada na tabela quotes.';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'dealer_id';