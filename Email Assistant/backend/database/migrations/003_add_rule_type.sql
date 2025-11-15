-- Migration: Add rule_type column to rules table
-- This enables direction-based email classification (sent vs received)
-- Created: 2025-11-13

-- Add rule_type column with default 'received' for backward compatibility
ALTER TABLE rules
ADD COLUMN IF NOT EXISTS rule_type VARCHAR(20) NOT NULL DEFAULT 'received'
CHECK (rule_type IN ('sent', 'received'));

-- Update existing rules to be 'received' type (preserves current behavior)
UPDATE rules
SET rule_type = 'received'
WHERE rule_type IS NULL OR rule_type = '';

-- Add index for efficient filtering by rule_type
CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(user_id, rule_type, is_active);

-- Update the unique constraint to include rule_type
-- This allows same label name for different rule types
ALTER TABLE rules
DROP CONSTRAINT IF EXISTS rules_user_id_label_name_rule_description_key;

ALTER TABLE rules
ADD CONSTRAINT rules_user_id_label_name_rule_description_type_key
UNIQUE(user_id, label_name, rule_description, rule_type);

-- Add comment for documentation
COMMENT ON COLUMN rules.rule_type IS 'Type of rule: sent (for emails user sends) or received (for emails user receives)';
