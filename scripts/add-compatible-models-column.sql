-- Add compatible_models column to engine_packages table
ALTER TABLE engine_packages 
ADD COLUMN IF NOT EXISTS compatible_models TEXT[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN engine_packages.compatible_models IS 'Array of boat model names that are compatible with this engine package';
