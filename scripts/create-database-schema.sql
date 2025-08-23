-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enums
CREATE TYPE order_status AS ENUM ('pending', 'production', 'shipping', 'delivered');
CREATE TYPE service_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE request_type AS ENUM ('warranty', 'repair', 'maintenance', 'parts', 'other');

-- Tabela de usuários administradores
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de dealers
CREATE TABLE dealers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pacotes de motor
CREATE TABLE engine_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    brl DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cores de casco
CREATE TABLE hull_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    brl DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de opções adicionais
CREATE TABLE additional_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    brl DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de modelos de barco
CREATE TABLE boat_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    brl DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    customer_city VARCHAR(255),
    customer_state VARCHAR(255),
    customer_zip VARCHAR(20),
    customer_country VARCHAR(255),
    boat_model VARCHAR(255) NOT NULL,
    engine_package VARCHAR(255) NOT NULL,
    hull_color VARCHAR(255) NOT NULL,
    additional_options TEXT[] DEFAULT '{}',
    payment_method VARCHAR(100) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    additional_notes TEXT,
    total_usd DECIMAL(10,2) NOT NULL,
    total_brl DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações de serviço
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(50) UNIQUE NOT NULL,
    dealer_id UUID REFERENCES dealers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    boat_model VARCHAR(255) NOT NULL,
    hull_id VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    engine_hours VARCHAR(50),
    request_type request_type NOT NULL,
    issues TEXT[] NOT NULL,
    status service_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON dealers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engine_packages_updated_at BEFORE UPDATE ON engine_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hull_colors_updated_at BEFORE UPDATE ON hull_colors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_additional_options_updated_at BEFORE UPDATE ON additional_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boat_models_updated_at BEFORE UPDATE ON boat_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_orders_dealer_id ON orders(dealer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_service_requests_dealer_id ON service_requests(dealer_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para dealers (só podem ver seus próprios dados)
CREATE POLICY "Dealers can view their own data" ON dealers
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Dealers can view their own orders" ON orders
    FOR SELECT USING (dealer_id IN (SELECT id FROM dealers WHERE auth.uid()::text = id::text));

CREATE POLICY "Dealers can insert their own orders" ON orders
    FOR INSERT WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE auth.uid()::text = id::text));

CREATE POLICY "Dealers can view their own service requests" ON service_requests
    FOR SELECT USING (dealer_id IN (SELECT id FROM dealers WHERE auth.uid()::text = id::text));

CREATE POLICY "Dealers can insert their own service requests" ON service_requests
    FOR INSERT WITH CHECK (dealer_id IN (SELECT id FROM dealers WHERE auth.uid()::text = id::text));

-- Políticas para administradores (podem ver tudo)
-- Nota: Implementaremos autenticação customizada para admins
