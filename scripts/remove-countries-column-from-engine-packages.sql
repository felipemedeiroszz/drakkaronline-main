-- Remove countries column from engine_packages table
ALTER TABLE engine_packages DROP COLUMN IF EXISTS countries;
