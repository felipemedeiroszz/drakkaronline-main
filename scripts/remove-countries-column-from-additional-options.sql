-- Remove countries column from additional_options table
ALTER TABLE additional_options DROP COLUMN IF EXISTS countries;
