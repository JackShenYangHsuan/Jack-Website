-- Migration: Add label color support to rules table
-- Gmail API supports backgroundColor and textColor for labels

-- Add color columns to rules table
ALTER TABLE rules
ADD COLUMN IF NOT EXISTS label_bg_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS label_text_color VARCHAR(50);

-- Add comment
COMMENT ON COLUMN rules.label_bg_color IS 'Gmail label background color (hex code or Gmail color palette value)';
COMMENT ON COLUMN rules.label_text_color IS 'Gmail label text color (hex code or Gmail color palette value)';
