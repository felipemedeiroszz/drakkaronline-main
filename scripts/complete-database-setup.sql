-- Create engine_packages table
CREATE TABLE IF NOT EXISTS engine_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_pt VARCHAR(255) NOT NULL,
  usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hull_colors table
CREATE TABLE IF NOT EXISTS hull_colors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_pt VARCHAR(255) NOT NULL,
  usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional_options table
CREATE TABLE IF NOT EXISTS additional_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_pt VARCHAR(255) NOT NULL,
  usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boat_models table
CREATE TABLE IF NOT EXISTS boat_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_pt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dealers table
CREATE TABLE IF NOT EXISTS dealers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  dealer_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  boat_model VARCHAR(255) NOT NULL,
  engine_package VARCHAR(255) NOT NULL,
  hull_color VARCHAR(255) NOT NULL,
  additional_options TEXT[] DEFAULT '{}',
  total_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_brl DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE NOT NULL,
  dealer_name VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  boat_model VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  issues TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default engine packages
INSERT INTO engine_packages (name, name_pt, usd, brl) VALUES
('TWIN 300 HP VERADO + W/AP/JOY', 'MOTOR DUPLO 300 HP VERADO + C/AP/JOY', 52904.13, 52904.13),
('TWIN 300 HP VERADO', 'MOTOR DUPLO 300 HP VERADO', 50806.00, 50806.00),
('TWIN 300 HP DTS', 'MOTOR DUPLO 300 HP DTS', 46858.30, 46858.30),
('TWIN 250 HP DTS', 'MOTOR DUPLO 250 HP DTS', 46073.13, 46073.13),
('TWIN 200 HP DTS', 'MOTOR DUPLO 200 HP DTS', 44360.00, 44360.00),
('SINGLE 300 HP DTS', 'MOTOR SIMPLES 300 HP DTS', 24245.34, 24245.34)
ON CONFLICT DO NOTHING;

-- Insert default hull colors
INSERT INTO hull_colors (name, name_pt, usd, brl) VALUES
('White (Solid) – STANDARD', 'Branco (Sólido) – PADRÃO', 0.00, 0.00),
('Sky Blue (Solid)', 'Azul Céu (Sólido)', 1460.00, 1460.00),
('Navy Blue (Solid)', 'Azul Marinho (Sólido)', 1460.00, 1460.00),
('Acqua Green (Solid)', 'Verde Água (Sólido)', 1460.00, 1460.00)
ON CONFLICT DO NOTHING;

-- Insert default additional options
INSERT INTO additional_options (name, name_pt, usd, brl) VALUES
('Simrad Premium Pkg Single Display 12 + Hull Transducer 600w', 'Pacote Simrad Premium Display Único 12" + Transdutor de Casco 600w', 4960.00, 4960.00),
('Bow Table', 'Mesa de Proa', 458.00, 458.00),
('Diving Door', 'Porta de Mergulho', 880.00, 880.00)
ON CONFLICT DO NOTHING;

-- Insert default boat models
INSERT INTO boat_models (name, name_pt) VALUES
('Drakkar 240 CC', 'Drakkar 240 CC'),
('Drakkar 280 CC', 'Drakkar 280 CC')
ON CONFLICT DO NOTHING;

-- Insert default dealer
INSERT INTO dealers (name, email, password) VALUES
('Admin Dealer', 'admin@drakkar.com', '123')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE engine_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hull_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE boat_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these for better security)
CREATE POLICY "Enable read access for all users" ON engine_packages FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON engine_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON engine_packages FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON engine_packages FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON hull_colors FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON hull_colors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON hull_colors FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON hull_colors FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON additional_options FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON additional_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON additional_options FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON additional_options FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON boat_models FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON boat_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON boat_models FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON boat_models FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON dealers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON dealers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON dealers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON dealers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON orders FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON service_requests FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON service_requests FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON service_requests FOR DELETE USING (true);
