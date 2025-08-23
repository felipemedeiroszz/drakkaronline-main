-- Add upholstery_package column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS upholstery_package TEXT;

-- Add comment
COMMENT ON COLUMN quotes.upholstery_package IS 'Selected upholstery package for the boat';
