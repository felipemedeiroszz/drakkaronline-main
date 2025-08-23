ALTER TABLE hull_colors
ADD COLUMN IF NOT EXISTS compatible_models JSONB DEFAULT '[]'::jsonb;
