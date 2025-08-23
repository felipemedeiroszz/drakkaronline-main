-- Add display_order column to all tables
ALTER TABLE engine_packages ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE hull_colors ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE upholstery_packages ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE additional_options ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE boat_models ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE dealers ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set default display_order values based on current ID order
UPDATE engine_packages SET display_order = id WHERE display_order IS NULL;
UPDATE hull_colors SET display_order = id WHERE display_order IS NULL;
UPDATE upholstery_packages SET display_order = id WHERE display_order IS NULL;
UPDATE additional_options SET display_order = id WHERE display_order IS NULL;
UPDATE boat_models SET display_order = id WHERE display_order IS NULL;
UPDATE dealers SET display_order = CAST(id AS INTEGER) WHERE display_order IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_engine_packages_display_order ON engine_packages(display_order);
CREATE INDEX IF NOT EXISTS idx_hull_colors_display_order ON hull_colors(display_order);
CREATE INDEX IF NOT EXISTS idx_upholstery_packages_display_order ON upholstery_packages(display_order);
CREATE INDEX IF NOT EXISTS idx_additional_options_display_order ON additional_options(display_order);
CREATE INDEX IF NOT EXISTS idx_boat_models_display_order ON boat_models(display_order);
CREATE INDEX IF NOT EXISTS idx_dealers_display_order ON dealers(display_order);
