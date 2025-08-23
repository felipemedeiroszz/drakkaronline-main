-- Create factory production table
CREATE TABLE IF NOT EXISTS factory_production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    boat_model VARCHAR(255) NOT NULL,
    engine_package VARCHAR(255) NOT NULL,
    hull_color VARCHAR(255) NOT NULL,
    upholstery_package VARCHAR(255),
    additional_options TEXT[] DEFAULT '{}',
    total_value_usd DECIMAL(10,2) DEFAULT 0,
    total_value_brl DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(100) DEFAULT 'planning',
    expected_completion_date DATE,
    notes TEXT,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_factory_production_display_order ON factory_production(display_order);
CREATE INDEX IF NOT EXISTS idx_factory_production_status ON factory_production(status);
CREATE INDEX IF NOT EXISTS idx_factory_production_expected_date ON factory_production(expected_completion_date);

-- Add trigger for updated_at
CREATE TRIGGER update_factory_production_updated_at 
    BEFORE UPDATE ON factory_production 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO factory_production (
    boat_model, 
    engine_package, 
    hull_color, 
    upholstery_package,
    additional_options,
    total_value_usd,
    total_value_brl,
    status,
    expected_completion_date,
    notes,
    display_order
) VALUES 
(
    'Drakkar 26',
    'Mercury 300HP',
    'White',
    'Premium Leather',
    ARRAY['GPS Navigation', 'Sound System', 'Fishing Package'],
    85000.00,
    425000.00,
    'hull_construction',
    '2024-03-15',
    'Priority build for dealer showcase',
    1
),
(
    'Drakkar 23',
    'Yamaha 250HP',
    'Blue',
    'Standard Vinyl',
    ARRAY['Bimini Top', 'Cooler'],
    65000.00,
    325000.00,
    'engine_installation',
    '2024-02-28',
    'Standard production schedule',
    2
),
(
    'Drakkar 29',
    'Mercury 350HP',
    'Black',
    'Premium Leather',
    ARRAY['GPS Navigation', 'Sound System', 'Fishing Package', 'Extended Warranty'],
    95000.00,
    475000.00,
    'planning',
    '2024-04-10',
    'Custom build with special requirements',
    3
);
