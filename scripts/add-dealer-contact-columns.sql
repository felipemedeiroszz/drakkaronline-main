-- Add missing contact columns to dealers table
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(255),
ADD COLUMN IF NOT EXISTS state VARCHAR(255),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Update the updated_at trigger to include new columns
-- (The trigger already exists and will automatically handle these new columns)
