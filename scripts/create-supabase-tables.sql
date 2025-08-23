-- Habilitar a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela para pacotes de motor
CREATE TABLE IF NOT EXISTS engine_packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255),
    usd NUMERIC(10, 2),
    brl NUMERIC(10, 2),
    compatible_models JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para cores de casco
CREATE TABLE IF NOT EXISTS hull_colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255),
    usd NUMERIC(10, 2),
    brl NUMERIC(10, 2),
    compatible_models JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para opcionais adicionais
CREATE TABLE IF NOT EXISTS additional_options (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255),
    usd NUMERIC(10, 2),
    brl NUMERIC(10, 2),
    compatible_models JSONB DEFAULT '[]'::jsonb,
    category VARCHAR(100) DEFAULT 'deck_equipment_comfort', -- Updated default category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para modelos de barco
CREATE TABLE IF NOT EXISTS boat_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255),
    usd NUMERIC(10, 2),
    brl NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para dealers (concessionárias)
CREATE TABLE IF NOT EXISTS dealers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    country VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para pedidos
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    dealer_id INTEGER REFERENCES dealers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_city VARCHAR(100),
    customer_state VARCHAR(100),
    customer_zip VARCHAR(20),
    customer_country VARCHAR(100),
    boat_model VARCHAR(255),
    engine_package VARCHAR(255),
    hull_color VARCHAR(255),
    additional_options JSONB,
    payment_method VARCHAR(50),
    deposit_amount NUMERIC(10, 2),
    additional_notes TEXT,
    total_usd NUMERIC(10, 2),
    total_brl NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para solicitações de serviço (pós-venda)
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    dealer_id INTEGER REFERENCES dealers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    boat_model VARCHAR(255),
    hull_id VARCHAR(100),
    purchase_date DATE,
    engine_hours VARCHAR(50),
    request_type VARCHAR(100),
    issues JSONB,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para configurações do admin
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir senha padrão do admin se não existir
INSERT INTO admin_settings (key, value)
VALUES ('admin_password', 'drakkar')
ON CONFLICT (key) DO NOTHING;
