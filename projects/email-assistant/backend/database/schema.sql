-- Gmail Auto-Tagger Database Schema
-- PostgreSQL 12+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Stores Gmail account information and encrypted OAuth tokens
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    gmail_token_encrypted TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rules table: Stores tagging rules defined by users
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label_name VARCHAR(255) NOT NULL,
    rule_description TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, label_name, rule_description)
);

-- Tagging logs table: Records all email tagging actions
CREATE TABLE IF NOT EXISTS tagging_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_id VARCHAR(255) NOT NULL,
    applied_label VARCHAR(255) NOT NULL,
    matched_rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_rules_user_id ON rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_active ON rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_user_id ON tagging_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_email_id ON tagging_logs(email_id);
CREATE INDEX IF NOT EXISTS idx_tagging_logs_timestamp ON tagging_logs(timestamp DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user Gmail account information and encrypted OAuth refresh tokens';
COMMENT ON TABLE rules IS 'User-defined tagging rules with natural language descriptions';
COMMENT ON TABLE tagging_logs IS 'Audit log of all email tagging actions performed by the system';

COMMENT ON COLUMN users.gmail_token_encrypted IS 'Encrypted Gmail OAuth refresh token';
COMMENT ON COLUMN rules.priority IS 'Rule priority (1-10), higher number = higher priority';
COMMENT ON COLUMN rules.is_active IS 'Whether the rule is currently active';
COMMENT ON COLUMN tagging_logs.confidence_score IS 'AI confidence score for the match (0.00-1.00)';
