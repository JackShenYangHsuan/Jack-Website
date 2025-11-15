-- Migration: Add thread-aware tracking to tagging_logs table
-- This enables the system to re-evaluate and update labels when thread context changes

-- Add thread tracking columns
ALTER TABLE tagging_logs
ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_auto_applied BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;

-- Add indexes for efficient thread lookups
CREATE INDEX IF NOT EXISTS idx_tagging_logs_thread_id ON tagging_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_user_thread ON tagging_logs(user_id, thread_id);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_active ON tagging_logs(user_id, email_id, removed_at);

-- Add comments
COMMENT ON COLUMN tagging_logs.thread_id IS 'Gmail thread ID for grouping related emails';
COMMENT ON COLUMN tagging_logs.is_auto_applied IS 'TRUE if label was auto-applied by rules, FALSE if manually applied by user';
COMMENT ON COLUMN tagging_logs.removed_at IS 'Timestamp when the label was removed during re-evaluation (NULL if still active)';

-- Backfill existing data
UPDATE tagging_logs
SET is_auto_applied = true
WHERE is_auto_applied IS NULL;
