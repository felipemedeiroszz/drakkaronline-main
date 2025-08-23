-- MIGRATION 002: converte item_id de INTEGER para TEXT
-- -----------------------------------------------------
-- 1) Remover a constraint UNIQUE antiga (usa item_id INTEGER)
ALTER TABLE public.dealer_pricing
  DROP CONSTRAINT IF EXISTS dealer_pricing_unique;

-- 2) Criar nova tabela temporária com estrutura correta
CREATE TABLE dealer_pricing_new (
    id SERIAL PRIMARY KEY,
    dealer_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL, -- Mudança: de INTEGER para TEXT
    item_name TEXT NOT NULL,
    sale_price_usd DECIMAL(10,2) DEFAULT 0,
    sale_price_brl DECIMAL(10,2) DEFAULT 0,
    margin_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, item_type, item_id)
);

-- 3) Copiar dados existentes (convertendo item_id para texto)
INSERT INTO dealer_pricing_new (
    id, dealer_id, item_type, item_id, item_name, 
    sale_price_usd, sale_price_brl, margin_percentage, 
    created_at, updated_at
)
SELECT 
    id, dealer_id, item_type, item_id::TEXT, item_name,
    sale_price_usd, sale_price_brl, margin_percentage,
    created_at, updated_at
FROM dealer_pricing;

-- 4) Remover tabela antiga
DROP TABLE dealer_pricing;

-- 5) Renomear nova tabela
ALTER TABLE dealer_pricing_new RENAME TO dealer_pricing;

-- 6) Recriar índices
CREATE INDEX idx_dealer_pricing_dealer_id ON dealer_pricing(dealer_id);
CREATE INDEX idx_dealer_pricing_item_type ON dealer_pricing(item_type);
CREATE INDEX idx_dealer_pricing_item_id ON dealer_pricing(item_id);

-- 7) Comentário para documentar a mudança
COMMENT ON COLUMN dealer_pricing.item_id IS 'Identificador do item (pode ser UUID, número ou texto)';

-- Verificar se a migração foi bem-sucedida
SELECT 'Migração concluída: item_id agora é TEXT' as status;
