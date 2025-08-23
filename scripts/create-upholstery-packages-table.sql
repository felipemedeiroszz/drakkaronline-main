-- Criar tabela de pacotes de estofamento
CREATE TABLE IF NOT EXISTS upholstery_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    brl DECIMAL(10,2) NOT NULL DEFAULT 0,
    compatible_models TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_upholstery_packages_updated_at 
    BEFORE UPDATE ON upholstery_packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Índice para melhor performance
CREATE INDEX idx_upholstery_packages_name ON upholstery_packages(name);

-- Inserir alguns dados de exemplo
INSERT INTO upholstery_packages (name, name_pt, usd, brl, compatible_models) VALUES
('Standard Vinyl', 'Vinil Padrão', 500.00, 2500.00, '{}'),
('Premium Leather', 'Couro Premium', 1200.00, 6000.00, '{}'),
('Marine Grade Fabric', 'Tecido Náutico', 800.00, 4000.00, '{}'),
('Luxury Suede', 'Camurça Luxo', 1500.00, 7500.00, '{}');
