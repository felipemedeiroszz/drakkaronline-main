-- Adicionar coluna compatible_models à tabela additional_options
ALTER TABLE additional_options 
ADD COLUMN IF NOT EXISTS compatible_models JSONB DEFAULT '[]'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN additional_options.compatible_models IS 'Lista de modelos de barco compatíveis com esta opção adicional';

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'additional_options' 
AND column_name = 'compatible_models';
