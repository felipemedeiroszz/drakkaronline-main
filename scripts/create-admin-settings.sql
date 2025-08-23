-- Cria a tabela para armazenar configurações do administrador, como a senha.
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insere a senha padrão 'drakkar' se ainda não existir.
-- Isso garante que o login continue funcionando antes da primeira alteração.
INSERT INTO admin_settings (key, value)
VALUES ('admin_password', 'drakkar')
ON CONFLICT (key) DO NOTHING;
