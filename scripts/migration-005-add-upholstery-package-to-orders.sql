-- Add upholstery_package column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upholstery_package TEXT;

-- Add comment to document the column
COMMENT ON COLUMN orders.upholstery_package IS 'Selected upholstery package for the boat order';

-- Update any existing orders to have NULL upholstery_package (they will be handled gracefully in the UI)
-- No need to set default values as existing orders without this info will show "N/A"

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'upholstery_package';
