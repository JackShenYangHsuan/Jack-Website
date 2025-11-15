-- Seed data for development and testing
-- This file contains sample data for local development

-- Note: In production, users will be created through OAuth flow
-- These are example records for testing purposes only

-- Sample user (DO NOT use in production)
-- INSERT INTO users (email, gmail_token_encrypted) VALUES
-- ('test@example.com', 'encrypted_token_placeholder_for_testing');

-- Sample rules (examples to demonstrate rule structure)
-- Uncomment and modify after creating a test user

-- INSERT INTO rules (user_id, label_name, rule_description, priority, is_active) VALUES
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'Work', 'Emails from my manager or colleagues at work', 8, true),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'Shopping', 'Promotional emails from online stores', 5, true),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'Newsletters', 'Technology newsletters and updates', 6, true),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'Urgent', 'Emails marked as urgent or high priority', 10, true),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'Finance', 'Receipts, invoices, and financial statements', 7, true);

-- Sample tagging logs (for testing dashboard/analytics features)
-- Uncomment after creating sample rules

-- INSERT INTO tagging_logs (user_id, email_id, applied_label, matched_rule_id, confidence_score) VALUES
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'gmail_msg_001', 'Work', (SELECT id FROM rules WHERE label_name = 'Work' LIMIT 1), 0.95),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'gmail_msg_002', 'Shopping', (SELECT id FROM rules WHERE label_name = 'Shopping' LIMIT 1), 0.87),
-- ((SELECT id FROM users WHERE email = 'test@example.com'), 'gmail_msg_003', 'Newsletters', (SELECT id FROM rules WHERE label_name = 'Newsletters' LIMIT 1), 0.92);

-- Verify table creation
SELECT 'Users table created' as status, COUNT(*) as count FROM users;
SELECT 'Rules table created' as status, COUNT(*) as count FROM rules;
SELECT 'Tagging logs table created' as status, COUNT(*) as count FROM tagging_logs;
