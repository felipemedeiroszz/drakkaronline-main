-- Add country column to additional_options table
ALTER TABLE additional_options 
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'All';

-- Update existing records to have 'All' as default
UPDATE additional_options 
SET country = 'All' 
WHERE country IS NULL;
