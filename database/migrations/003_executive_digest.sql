-- ==============================================================================
-- MIGRATION 003: EXECUTIVE DIGEST INTEGRATION
-- Target: Supabase PostgreSQL
-- Safe, additive-only migration. Does NOT drop or truncate any existing data.
-- ==============================================================================

-- Create executive_digests table
CREATE TABLE IF NOT EXISTS executive_digests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    brand VARCHAR(50) NOT NULL DEFAULT 'all',
    market VARCHAR(100) NOT NULL DEFAULT 'Singapore',
    niche VARCHAR(80) NOT NULL DEFAULT 'all',
    period_start TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    period_end TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    executive_summary TEXT NOT NULL,
    what_ja_should_do TEXT NOT NULL,
    key_changes_json TEXT,
    lead_signals_json TEXT,
    digest_json TEXT,
    source_count INTEGER DEFAULT 0,
    model VARCHAR(100) DEFAULT 'Groq (Llama-3/Compound)',
    status VARCHAR(40) NOT NULL DEFAULT 'published',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS ix_executive_digests_brand ON executive_digests(brand);
CREATE INDEX IF NOT EXISTS ix_executive_digests_market ON executive_digests(market);
CREATE INDEX IF NOT EXISTS ix_executive_digests_niche ON executive_digests(niche);
CREATE INDEX IF NOT EXISTS ix_executive_digests_status ON executive_digests(status);
CREATE INDEX IF NOT EXISTS ix_executive_digests_generated_at ON executive_digests(generated_at);
