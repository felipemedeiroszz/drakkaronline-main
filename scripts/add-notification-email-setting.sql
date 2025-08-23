-- Inserir configuração de email de notificação na tabela admin_settings
INSERT INTO admin_settings (key, value, created_at, updated_at)
VALUES ('notification_email', '', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Verificar se foi inserido
SELECT * FROM admin_settings WHERE key = 'notification_email';
