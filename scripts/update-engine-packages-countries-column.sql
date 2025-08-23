-- Alterar a coluna country para countries (JSONB array) na tabela engine_packages
ALTER TABLE engine_packages 
DROP COLUMN IF EXISTS country;

ALTER TABLE engine_packages 
ADD COLUMN IF NOT EXISTS countries JSONB DEFAULT '["All"]';

-- Atualizar registros existentes para ter o array padrão
UPDATE engine_packages 
SET countries = '["All"]' 
WHERE countries IS NULL;
