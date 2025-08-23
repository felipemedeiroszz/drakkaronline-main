-- Add countries column to engine_packages table
ALTER TABLE engine_packages 
ADD COLUMN IF NOT EXISTS countries TEXT[] DEFAULT ARRAY['All'];

-- Update existing records to have 'All' as default
UPDATE engine_packages 
SET countries = ARRAY['All'] 
WHERE countries IS NULL OR countries = '{}';
