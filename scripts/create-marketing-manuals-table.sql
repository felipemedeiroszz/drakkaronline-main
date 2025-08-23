-- Create marketing_manuals table
CREATE TABLE IF NOT EXISTS marketing_manuals (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO marketing_manuals (name_en, name_pt, url, image_url, display_order) VALUES
('Owner Manual', 'Manual do Proprietário', 'https://example.com/owner-manual.pdf', '/images/manual.png', 1),
('Maintenance Guide', 'Guia de Manutenção', 'https://example.com/maintenance-guide.pdf', '/images/manual.png', 2),
('Warranty Information', 'Informações de Garantia', 'https://example.com/warranty.pdf', '/images/garantia.png', 3)
ON CONFLICT DO NOTHING;
