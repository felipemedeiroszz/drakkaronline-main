-- Adicionar coluna category à tabela additional_options
ALTER TABLE additional_options
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'deck_equipment_comfort';

-- Comentário explicativo
COMMENT ON COLUMN additional_options.category IS 'Categoria da opção adicional: deck_equipment_comfort, electronics_navigation_sound, transport_logistics';

-- Atualizar valores existentes para a nova categoria combinada, se necessário
-- Por exemplo, se você tinha itens com 'electronics' ou 'navigation_sound_system' como categoria,
-- pode querer atualizá-los para 'electronics_navigation_sound'.
-- CUIDADO: Execute esta parte apenas se tiver certeza de que deseja migrar dados existentes.
-- UPDATE additional_options
-- SET category = 'electronics_navigation_sound'
-- WHERE category IN ('electronics', 'navigation_sound_system');

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'additional_options'
AND column_name = 'category';
