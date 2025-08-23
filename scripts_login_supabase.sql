-- ============================================
-- SCRIPTS DAS TABELAS DE LOGIN PARA SUPABASE
-- ============================================
-- Compilado das tabelas principais para autenticação e usuários

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. TABELA DE USUÁRIOS ADMINISTRADORES
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE DEALERS (USUÁRIOS DEALERS)
-- ============================================

CREATE TABLE IF NOT EXISTS dealers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    country VARCHAR(50),
    contact_phone VARCHAR(50),
    contact_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TABELA DE CONFIGURAÇÕES DO ADMIN
-- ============================================

CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. INSERIR DADOS PADRÃO
-- ============================================

-- Inserir senha padrão do admin
INSERT INTO admin_settings (key, value)
VALUES ('admin_password', 'drakkar')
ON CONFLICT (key) DO NOTHING;

-- Inserir dealer padrão para testes
INSERT INTO dealers (name, email, password, country) VALUES
('Admin Dealer', 'admin@drakkar.com', '123', 'BR')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at 
    BEFORE UPDATE ON dealers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dealers_email ON dealers(email);
CREATE INDEX IF NOT EXISTS idx_dealers_created_at ON dealers(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas para dealers (podem ver seus próprios dados)
CREATE POLICY "Dealers can view their own data" ON dealers
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Dealers can update their own data" ON dealers
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para administradores (acesso completo via autenticação customizada)
CREATE POLICY "Enable read access for authenticated users" ON dealers 
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON dealers 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON dealers 
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON dealers 
    FOR DELETE USING (true);

-- Políticas para admin_settings
CREATE POLICY "Enable read access for all users" ON admin_settings 
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON admin_settings 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON admin_settings 
    FOR UPDATE USING (true);

-- ============================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE dealers IS 'Tabela de usuários dealers/concessionárias';
COMMENT ON COLUMN dealers.id IS 'ID único do dealer';
COMMENT ON COLUMN dealers.name IS 'Nome da concessionária/dealer';
COMMENT ON COLUMN dealers.email IS 'Email para login (único)';
COMMENT ON COLUMN dealers.password IS 'Senha do dealer (deve ser hasheada na aplicação)';
COMMENT ON COLUMN dealers.country IS 'País do dealer';

COMMENT ON TABLE admin_users IS 'Tabela de usuários administradores';
COMMENT ON COLUMN admin_users.email IS 'Email para login do admin';
COMMENT ON COLUMN admin_users.password_hash IS 'Hash da senha do administrador';

COMMENT ON TABLE admin_settings IS 'Configurações gerais do sistema admin';
COMMENT ON COLUMN admin_settings.key IS 'Chave da configuração (ex: admin_password)';
COMMENT ON COLUMN admin_settings.value IS 'Valor da configuração';

-- ============================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas de login criadas com sucesso!' as message;

-- Mostrar estrutura das tabelas principais
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('dealers', 'admin_users', 'admin_settings')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;