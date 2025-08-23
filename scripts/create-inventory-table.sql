-- Create dealer_inventory table
CREATE TABLE IF NOT EXISTS dealer_inventory (
    id SERIAL PRIMARY KEY,
    dealer_id TEXT NOT NULL,
    dealer_name TEXT NOT NULL,
    boat_name TEXT NOT NULL,
    color TEXT NOT NULL,
    engine TEXT NOT NULL,
    additional_options TEXT[] DEFAULT '{}',
    cost_price_usd DECIMAL(10,2) DEFAULT 0,
    cost_price_brl DECIMAL(10,2) DEFAULT 0,
    sale_price_usd DECIMAL(10,2) DEFAULT 0,
    sale_price_brl DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_dealer_id ON dealer_inventory(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_status ON dealer_inventory(status);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_created_at ON dealer_inventory(created_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE dealer_inventory ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data
CREATE POLICY "Service role can access all dealer_inventory" ON dealer_inventory
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read all inventory
CREATE POLICY "Authenticated users can read dealer_inventory" ON dealer_inventory
    FOR SELECT USING (auth.role() = 'authenticated');
