-- Create marketing_warranties table
CREATE TABLE IF NOT EXISTS marketing_warranties (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO marketing_warranties (name_en, name_pt, url, image_url, display_order) VALUES
('Hull Warranty', 'Garantia do Casco', 'https://example.com/hull-warranty.pdf', '/images/garantia.png', 1),
('Engine Warranty', 'Garantia do Motor', 'https://example.com/engine-warranty.pdf', '/images/garantia.png', 2),
('Electronics Warranty', 'Garantia dos Eletrônicos', 'https://example.com/electronics-warranty.pdf', '/images/garantia.png', 3);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_marketing_warranties_display_order ON marketing_warranties(display_order);
