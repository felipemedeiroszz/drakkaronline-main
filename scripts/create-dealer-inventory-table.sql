-- Create dealer_inventory table
CREATE TABLE IF NOT EXISTS dealer_inventory (
  id SERIAL PRIMARY KEY,
  dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
  boat_model VARCHAR(255) NOT NULL,
  hull_color VARCHAR(255) NOT NULL,
  engine_package VARCHAR(255) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  notes TEXT,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_dealer_id ON dealer_inventory(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_status ON dealer_inventory(status);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_boat_model ON dealer_inventory(boat_model);

-- Enable RLS (Row Level Security)
ALTER TABLE dealer_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Dealers can view their own inventory" ON dealer_inventory
  FOR SELECT USING (true);

CREATE POLICY "Dealers can insert their own inventory" ON dealer_inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Dealers can update their own inventory" ON dealer_inventory
  FOR UPDATE USING (true);

CREATE POLICY "Dealers can delete their own inventory" ON dealer_inventory
  FOR DELETE USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dealer_inventory_updated_at 
  BEFORE UPDATE ON dealer_inventory 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE dealer_inventory IS 'Stores boat inventory for each dealer';
COMMENT ON COLUMN dealer_inventory.dealer_id IS 'Reference to the dealer who owns this inventory item';
COMMENT ON COLUMN dealer_inventory.boat_model IS 'Model of the boat';
COMMENT ON COLUMN dealer_inventory.hull_color IS 'Color of the boat hull';
COMMENT ON COLUMN dealer_inventory.engine_package IS 'Engine package for the boat';
COMMENT ON COLUMN dealer_inventory.cost_price IS 'Cost price of the boat';
COMMENT ON COLUMN dealer_inventory.sale_price IS 'Sale price of the boat';
COMMENT ON COLUMN dealer_inventory.status IS 'Status: available, reserved, sold';
COMMENT ON COLUMN dealer_inventory.notes IS 'Additional notes about the inventory item';
