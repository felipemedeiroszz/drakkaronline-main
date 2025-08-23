-- Add country column to engine_packages table
ALTER TABLE engine_packages 
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'All';

-- Update existing records to have 'All' as default
UPDATE engine_packages 
SET country = 'All' 
WHERE country IS NULL;
