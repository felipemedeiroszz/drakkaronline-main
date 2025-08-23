-- Alterar a coluna country para countries (JSONB array) na tabela additional_options
ALTER TABLE additional_options 
DROP COLUMN IF EXISTS country;

ALTER TABLE additional_options 
ADD COLUMN IF NOT EXISTS countries JSONB DEFAULT '["All"]';

-- Atualizar registros existentes para ter o array padrão
UPDATE additional_options 
SET countries = '["All"]' 
WHERE countries IS NULL;
