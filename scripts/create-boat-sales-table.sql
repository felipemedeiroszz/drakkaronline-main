-- Create table for boat sale prices
CREATE TABLE IF NOT EXISTS boat_sales (
  id SERIAL PRIMARY KEY,
  dealer_name VARCHAR(255) NOT NULL,
  boat_model VARCHAR(255) NOT NULL,
  sale_price_usd DECIMAL(10,2) DEFAULT 0,
  sale_price_eur DECIMAL(10,2) DEFAULT 0,
  sale_price_brl DECIMAL(10,2) DEFAULT 0,
  sale_price_gbp DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dealer_name, boat_model)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_boat_sales_dealer ON boat_sales(dealer_name);
CREATE INDEX IF NOT EXISTS idx_boat_sales_model ON boat_sales(boat_model);

-- Add RLS (Row Level Security) policies
ALTER TABLE boat_sales ENABLE ROW LEVEL SECURITY;

-- Policy to allow dealers to only see their own sales data
CREATE POLICY "Dealers can only see their own sales data" ON boat_sales
  FOR ALL USING (dealer_name = current_setting('app.current_dealer', true));

-- Policy to allow dealers to insert their own sales data
CREATE POLICY "Dealers can insert own sales data" ON boat_sales
  FOR INSERT WITH CHECK (dealer_name = current_setting('app.current_dealer', true));

-- Policy to allow dealers to update their own sales data
CREATE POLICY "Dealers can update own sales data" ON boat_sales
  FOR UPDATE USING (dealer_name = current_setting('app.current_dealer', true));

-- Policy to allow dealers to delete their own sales data
CREATE POLICY "Dealers can delete own sales data" ON boat_sales
  FOR DELETE USING (dealer_name = current_setting('app.current_dealer', true));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_boat_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_boat_sales_updated_at
    BEFORE UPDATE ON boat_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_boat_sales_updated_at();
