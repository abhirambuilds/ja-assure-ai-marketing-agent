-- ==============================================================================
-- MIGRATION 002: COMPETITOR RADAR INTEGRATION
-- Target: Supabase PostgreSQL
-- Safe, additive-only migration. Does NOT drop or truncate any existing data.
-- ==============================================================================

-- 1. Add additive columns to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS domain VARCHAR(200);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS brand VARCHAR(50);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS market VARCHAR(100) DEFAULT 'Singapore';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS pricing_summary TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS coverage_strengths TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS coverage_weaknesses TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS underwriter VARCHAR(200);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS target_customer_size VARCHAR(100);
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS threat_level VARCHAR(40) DEFAULT 'medium';
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS social_handles_json TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMPTZ;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Extend VARCHAR limit on url if necessary
ALTER TABLE competitors ALTER COLUMN url TYPE VARCHAR(500);
ALTER TABLE competitors ALTER COLUMN name TYPE VARCHAR(200);

-- Indexes on newly added columns
CREATE INDEX IF NOT EXISTS ix_competitors_domain ON competitors(domain);
CREATE INDEX IF NOT EXISTS ix_competitors_brand ON competitors(brand);
CREATE INDEX IF NOT EXISTS ix_competitors_threat_level ON competitors(threat_level);
CREATE INDEX IF NOT EXISTS ix_competitors_is_active ON competitors(is_active);

-- 2. Create competitor_snapshots table
CREATE TABLE IF NOT EXISTS competitor_snapshots (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    snapshot_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page_url VARCHAR(500) NOT NULL,
    page_title VARCHAR(300),
    content_hash VARCHAR(64),
    pricing_data_json TEXT,
    coverage_terms_json TEXT,
    public_announcements_json TEXT,
    raw_text_excerpt TEXT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_competitor_snapshots_competitor_id ON competitor_snapshots(competitor_id);
CREATE INDEX IF NOT EXISTS ix_competitor_snapshots_snapshot_date ON competitor_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS ix_competitor_snapshots_content_hash ON competitor_snapshots(content_hash);

-- 3. Create competitor_changes table
CREATE TABLE IF NOT EXISTS competitor_changes (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    change_type VARCHAR(80) NOT NULL,
    severity VARCHAR(40) NOT NULL DEFAULT 'major',
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    source_url VARCHAR(500),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_competitor_changes_competitor_id ON competitor_changes(competitor_id);
CREATE INDEX IF NOT EXISTS ix_competitor_changes_change_type ON competitor_changes(change_type);
CREATE INDEX IF NOT EXISTS ix_competitor_changes_severity ON competitor_changes(severity);
CREATE INDEX IF NOT EXISTS ix_competitor_changes_detected_at ON competitor_changes(detected_at);

-- 4. Create competitor_battlecards table
CREATE TABLE IF NOT EXISTS competitor_battlecards (
    id SERIAL PRIMARY KEY,
    competitor_id INTEGER NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    ja_product VARCHAR(80) NOT NULL,
    why_ja_wins_json TEXT,
    where_competitor_wins_json TEXT,
    objection_handling_json TEXT,
    pricing_comparison TEXT,
    sales_pitch_hook TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_competitor_battlecards_competitor_id ON competitor_battlecards(competitor_id);
CREATE INDEX IF NOT EXISTS ix_competitor_battlecards_ja_product ON competitor_battlecards(ja_product);
