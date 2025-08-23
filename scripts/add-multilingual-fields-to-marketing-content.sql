-- Add multilingual fields to marketing_content table
ALTER TABLE marketing_content 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS title_pt TEXT,
ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
ADD COLUMN IF NOT EXISTS subtitle_pt TEXT;

-- Migrate existing data to English fields
UPDATE marketing_content 
SET title_en = COALESCE(title, ''),
    title_pt = '',
    subtitle_en = COALESCE(subtitle, ''),
    subtitle_pt = ''
WHERE title_en IS NULL;

-- The old title and subtitle columns can be kept for backward compatibility
-- or dropped after migration is complete
-- ALTER TABLE marketing_content DROP COLUMN IF EXISTS title;
-- ALTER TABLE marketing_content DROP COLUMN IF EXISTS subtitle;
