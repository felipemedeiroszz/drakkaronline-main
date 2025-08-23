-- Add countries column to additional_options table
ALTER TABLE additional_options 
ADD COLUMN IF NOT EXISTS countries TEXT[] DEFAULT ARRAY['All'];

-- Update existing records to have 'All' as default
UPDATE additional_options 
SET countries = ARRAY['All'] 
WHERE countries IS NULL OR countries = '{}';

-- Add comment to the column
COMMENT ON COLUMN additional_options.countries IS 'Array of countries where this additional option is available';
