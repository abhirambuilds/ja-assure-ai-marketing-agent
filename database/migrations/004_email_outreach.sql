-- ==============================================================================
-- MIGRATION 004: EMAIL / OUTREACH AUTOMATION INTEGRATION
-- Target: Supabase PostgreSQL
-- Safe, additive-only migration. Does NOT drop or truncate any existing data.
-- ==============================================================================

-- 1. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    market VARCHAR(100) NOT NULL DEFAULT 'Singapore',
    target_industry VARCHAR(100) NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 20,
    minimum_score INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_campaigns_brand ON campaigns(brand);
CREATE INDEX IF NOT EXISTS ix_campaigns_status ON campaigns(status);

-- 2. Create outreach_messages table
CREATE TABLE IF NOT EXISTS outreach_messages (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    channel VARCHAR(40) NOT NULL DEFAULT 'email',
    direction VARCHAR(20) NOT NULL DEFAULT 'outbound',
    provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    provider_message_id VARCHAR(200),
    sender VARCHAR(320),
    recipient VARCHAR(320),
    subject VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    sequence_step INTEGER NOT NULL DEFAULT 1,
    sequence_touches_json TEXT,
    approved_by VARCHAR(160),
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    intent VARCHAR(80),
    intent_confidence DOUBLE PRECISION,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_outreach_messages_lead_id ON outreach_messages(lead_id);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_campaign_id ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_direction ON outreach_messages(direction);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_status ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_recipient ON outreach_messages(recipient);

-- 3. Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    sequence_step INTEGER NOT NULL DEFAULT 2,
    scheduled_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    draft_message TEXT,
    status VARCHAR(40) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS ix_follow_ups_scheduled_at ON follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS ix_follow_ups_status ON follow_ups(status);

-- 4. Create suppression_list table
CREATE TABLE IF NOT EXISTS suppression_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    normalized_email VARCHAR(320) UNIQUE NOT NULL,
    reason VARCHAR(80) NOT NULL,
    source VARCHAR(160) NOT NULL DEFAULT 'inbound_reply',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_suppression_list_normalized_email ON suppression_list(normalized_email);
