-- Inserir usuário administrador padrão
INSERT INTO admin_users (email, password_hash) VALUES 
('admin@drakkar.com', 'drakkar'); -- Em produção, use hash bcrypt

-- Inserir dealer padrão
INSERT INTO dealers (name, email, password) VALUES 
('Admin Dealer', 'admin@dealer.com', '123');

-- Inserir pacotes de motor padrão
INSERT INTO engine_packages (name, name_pt, usd, brl) VALUES 
('TWIN 300 HP VERADO + W/AP/JOY', 'MOTOR DUPLO 300 HP VERADO + C/AP/JOY', 52904.13, 52904.13),
('TWIN 300 HP VERADO', 'MOTOR DUPLO 300 HP VERADO', 50806.00, 50806.00),
('TWIN 300 HP DTS', 'MOTOR DUPLO 300 HP DTS', 46858.30, 46858.30),
('TWIN 250 HP DTS', 'MOTOR DUPLO 250 HP DTS', 46073.13, 46073.13),
('TWIN 200 HP DTS', 'MOTOR DUPLO 200 HP DTS', 44360.00, 44360.00),
('SINGLE 300 HP DTS', 'MOTOR SIMPLES 300 HP DTS', 24245.34, 24245.34);

-- Inserir cores de casco padrão
INSERT INTO hull_colors (name, name_pt, usd, brl) VALUES 
('White (Solid) – STANDARD', 'Branco (Sólido) – PADRÃO', 0.00, 0.00),
('Sky Blue (Solid)', 'Azul Céu (Sólido)', 1460.00, 1460.00),
('Navy Blue (Solid)', 'Azul Marinho (Sólido)', 1460.00, 1460.00),
('Acqua Green (Solid)', 'Verde Água (Sólido)', 1460.00, 1460.00);

-- Inserir opções adicionais padrão
INSERT INTO additional_options (name, name_pt, usd, brl) VALUES 
('Simrad Premium Pkg Single Display 12 + Hull Transducer 600w', 'Pacote Simrad Premium Display Único 12" + Transdutor de Casco 600w', 4960.00, 4960.00),
('Bow Table', 'Mesa de Proa', 458.00, 458.00),
('Diving Door', 'Porta de Mergulho', 880.00, 880.00);

-- Inserir modelos de barco padrão
INSERT INTO boat_models (name, name_pt, usd, brl) VALUES 
('Drakkar 240 CC', 'Drakkar 240 CC', 0.00, 0.00),
('Drakkar 280 CC', 'Drakkar 280 CC', 0.00, 0.00);
