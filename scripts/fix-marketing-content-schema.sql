-- First, let's properly migrate the marketing_content table
-- Step 1: Add the new multilingual columns if they don't exist
ALTER TABLE marketing_content 
ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
ADD COLUMN IF NOT EXISTS title_pt VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
ADD COLUMN IF NOT EXISTS subtitle_pt TEXT;

-- Step 2: Migrate existing data from old columns to new ones
UPDATE marketing_content 
SET 
  title_en = COALESCE(title_en, title, ''),
  title_pt = COALESCE(title_pt, title, ''),
  subtitle_en = COALESCE(subtitle_en, subtitle, ''),
  subtitle_pt = COALESCE(subtitle_pt, subtitle, '')
WHERE title_en IS NULL OR title_pt IS NULL;

-- Step 3: Drop the old columns that are causing conflicts
ALTER TABLE marketing_content 
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS subtitle;

-- Step 4: Add NOT NULL constraints to the new columns
ALTER TABLE marketing_content 
ALTER COLUMN title_en SET NOT NULL,
ALTER COLUMN title_pt SET NOT NULL;

-- Step 5: Set default values for existing NULL records
UPDATE marketing_content 
SET 
  title_en = COALESCE(title_en, ''),
  title_pt = COALESCE(title_pt, ''),
  subtitle_en = COALESCE(subtitle_en, ''),
  subtitle_pt = COALESCE(subtitle_pt, ''),
  boat_model = COALESCE(boat_model, 'All Models')
WHERE title_en = '' OR title_pt = '';
