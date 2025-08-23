-- Add boat_model column to marketing_content table
ALTER TABLE marketing_content 
ADD COLUMN IF NOT EXISTS boat_model VARCHAR(255);

-- Create index for better performance when filtering by boat model
CREATE INDEX IF NOT EXISTS idx_marketing_content_boat_model ON marketing_content(boat_model);

-- Update existing records to have a default boat model (optional)
UPDATE marketing_content SET boat_model = 'All Models' WHERE boat_model IS NULL;
