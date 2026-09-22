-- ==============================================================================
-- JA ASSURE AI MARKETING AGENT — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================
-- Multi-brand InsurTech platform:
--   - Jade
--   - DoctorShield
--   - Jaguar Transit
--
-- PostgreSQL / Supabase
--
-- Purpose:
--   - Content generation and HITL review
--   - Compliance workflow
--   - Competitor intelligence
--   - Lead prospecting and qualification
--   - Human feedback
--   - Closed-loop lessons learned
--   - Analytics
--   - Publishing records
--
-- Notes:
--   - Safe to execute on a fresh database.
--   - Uses IF NOT EXISTS where appropriate.
--   - Existing tables are NOT destructively modified.
--   - original_content_raw is included directly in content_queue.
--   - review_decisions has a single authoritative definition.
--   - No audio/video-specific DB table is required by the current architecture.
--   - Media metadata can remain in content_queue.metadata_json.
-- ==============================================================================


-- ==============================================================================
-- 1. CONTENT QUEUE
-- Core content generation, compliance and human-review staging
-- ==============================================================================

CREATE TABLE IF NOT EXISTS content_queue (
    id SERIAL PRIMARY KEY,

    brand VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,

    content_type VARCHAR(50) NOT NULL DEFAULT 'post',
    topic VARCHAR(255) NOT NULL,

    content_raw TEXT NOT NULL,
    original_content_raw TEXT,

    variation VARCHAR(50) NOT NULL DEFAULT 'A',
    language VARCHAR(10) NOT NULL DEFAULT 'en',

    compliance_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    compliance_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    reason_tag VARCHAR(100),
    notes TEXT,
    metadata_json TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_content_brand
        CHECK (
            brand IN (
                'jade',
                'doctorshield',
                'jaguartransit'
            )
        ),

    CONSTRAINT chk_content_status
        CHECK (
            status IN (
                'pending',
                'compliance_checked',
                'human_review',
                'approved',
                'rejected',
                'scheduled',
                'published'
            )
        ),

    CONSTRAINT chk_compliance_status
        CHECK (
            compliance_status IN (
                'pending',
                'passed',
                'flagged',
                'failed'
            )
        )
);

CREATE INDEX IF NOT EXISTS ix_content_queue_id
    ON content_queue(id);

CREATE INDEX IF NOT EXISTS ix_content_queue_brand
    ON content_queue(brand);

CREATE INDEX IF NOT EXISTS ix_content_queue_platform
    ON content_queue(platform);

CREATE INDEX IF NOT EXISTS ix_content_queue_status
    ON content_queue(status);

CREATE INDEX IF NOT EXISTS ix_content_queue_compliance_status
    ON content_queue(compliance_status);

CREATE INDEX IF NOT EXISTS ix_content_brand_platform
    ON content_queue(brand, platform);

CREATE INDEX IF NOT EXISTS ix_content_status_compliance
    ON content_queue(status, compliance_status);


-- ==============================================================================
-- 2. COMPETITOR INTELLIGENCE
-- Observed competitor activity and actionable insights
-- ==============================================================================

CREATE TABLE IF NOT EXISTS competitors (
    id SERIAL PRIMARY KEY,

    name VARCHAR(200) NOT NULL,
    url VARCHAR(500),
    domain VARCHAR(200),
    brand VARCHAR(50),

    category VARCHAR(100) NOT NULL,
    market VARCHAR(100) NOT NULL DEFAULT 'Singapore',
    title VARCHAR(255) NOT NULL DEFAULT 'Competitor Profile',

    summary TEXT NOT NULL DEFAULT '',
    detected_change TEXT,
    actionable_recommendation TEXT,

    pricing_summary TEXT,
    coverage_strengths TEXT,
    coverage_weaknesses TEXT,
    underwriter VARCHAR(200),
    target_customer_size VARCHAR(100),
    threat_level VARCHAR(40) NOT NULL DEFAULT 'medium',
    social_handles_json TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    relevance DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    source VARCHAR(100) NOT NULL DEFAULT 'public_web',

    last_monitored_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_competitors_id
    ON competitors(id);

CREATE INDEX IF NOT EXISTS ix_competitors_name
    ON competitors(name);

CREATE INDEX IF NOT EXISTS ix_competitors_category
    ON competitors(category);

CREATE INDEX IF NOT EXISTS ix_competitors_brand
    ON competitors(brand);

CREATE INDEX IF NOT EXISTS ix_competitors_domain
    ON competitors(domain);

CREATE INDEX IF NOT EXISTS ix_competitors_threat_level
    ON competitors(threat_level);

-- Competitor Snapshots
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

-- Competitor Changes
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

-- Competitor Battlecards
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


-- ==============================================================================
-- 3. LEAD PROSPECTING & QUALIFICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL DEFAULT 'Decision Maker',
    company VARCHAR(150) NOT NULL,
    normalized_company_name VARCHAR(150),
    domain VARCHAR(150),
    website VARCHAR(255),
    industry VARCHAR(100) NOT NULL,

    email VARCHAR(150),
    phone VARCHAR(50),
    location VARCHAR(100),
    country VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    company_size VARCHAR(50),
    description TEXT,
    product_fit VARCHAR(100),

    fit_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_breakdown_json TEXT,
    why_now TEXT,
    signals_json TEXT,
    contacts_json TEXT,

    qualification_reason TEXT,
    recommended_brand VARCHAR(50),
    outreach_draft TEXT,

    source VARCHAR(100) DEFAULT 'prospecting',
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    campaign_id VARCHAR(50),
    last_contacted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_lead_status
        CHECK (
            status IN (
                'new',
                'contacted',
                'qualified',
                'converted',
                'archived'
            )
        )
);

CREATE INDEX IF NOT EXISTS ix_leads_id
    ON leads(id);

CREATE INDEX IF NOT EXISTS ix_leads_company
    ON leads(company);

CREATE INDEX IF NOT EXISTS ix_leads_normalized_company
    ON leads(normalized_company_name);

CREATE INDEX IF NOT EXISTS ix_leads_domain
    ON leads(domain);

CREATE INDEX IF NOT EXISTS ix_leads_industry
    ON leads(industry);

CREATE INDEX IF NOT EXISTS ix_leads_status
    ON leads(status);

-- Safe additive migrations for existing instances
ALTER TABLE leads ADD COLUMN IF NOT EXISTS normalized_company_name VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS domain VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_fit VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_breakdown_json TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS why_now TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS signals_json TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacts_json TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;


-- ==============================================================================
-- 4. HUMAN FEEDBACK
-- Stores reviewer feedback and corrected content
-- ==============================================================================

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,

    content_id INTEGER NOT NULL
        REFERENCES content_queue(id)
        ON DELETE CASCADE,

    reason_tag VARCHAR(100) NOT NULL,

    notes TEXT NOT NULL,

    original_content TEXT NOT NULL,
    corrected_content TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_feedback_id
    ON feedback(id);

CREATE INDEX IF NOT EXISTS ix_feedback_content_id
    ON feedback(content_id);

CREATE INDEX IF NOT EXISTS ix_feedback_reason_tag
    ON feedback(reason_tag);


-- ==============================================================================
-- 5. CLOSED-LOOP LESSONS LEARNED
-- Persistent feedback-derived AI memory
-- ==============================================================================

CREATE TABLE IF NOT EXISTS lessons_learned (
    id SERIAL PRIMARY KEY,

    category VARCHAR(100) NOT NULL,

    lesson TEXT NOT NULL,

    examples TEXT,

    frequency INTEGER NOT NULL DEFAULT 1,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_lessons_learned_id
    ON lessons_learned(id);

CREATE INDEX IF NOT EXISTS ix_lessons_learned_category
    ON lessons_learned(category);

CREATE INDEX IF NOT EXISTS ix_lessons_learned_active
    ON lessons_learned(active);


-- ==============================================================================
-- 6. ANALYTICS
-- System telemetry and marketing metrics
-- ==============================================================================

CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,

    metric_name VARCHAR(100) NOT NULL,

    brand VARCHAR(50),
    platform VARCHAR(50),

    metric_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    metadata_json TEXT,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_analytics_id
    ON analytics(id);

CREATE INDEX IF NOT EXISTS ix_analytics_metric_name
    ON analytics(metric_name);

CREATE INDEX IF NOT EXISTS ix_analytics_brand
    ON analytics(brand);

CREATE INDEX IF NOT EXISTS ix_analytics_platform
    ON analytics(platform);


-- ==============================================================================
-- 7. PUBLISHING RECORDS
-- Human-controlled / simulated publishing dispatch staging
-- ==============================================================================

CREATE TABLE IF NOT EXISTS publishing_records (
    id SERIAL PRIMARY KEY,

    content_id INTEGER NOT NULL
        REFERENCES content_queue(id)
        ON DELETE CASCADE,

    platform VARCHAR(50) NOT NULL,

    external_post_id VARCHAR(100),

    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',

    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    engagement_metrics TEXT,
    error_info TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_publishing_status
        CHECK (
            status IN (
                'scheduled',
                'publishing',
                'published',
                'failed',
                'cancelled'
            )
        )
);

CREATE INDEX IF NOT EXISTS ix_publishing_records_id
    ON publishing_records(id);

CREATE INDEX IF NOT EXISTS ix_publishing_records_content_id
    ON publishing_records(content_id);

CREATE INDEX IF NOT EXISTS ix_publishing_records_platform
    ON publishing_records(platform);

CREATE INDEX IF NOT EXISTS ix_publishing_records_status
    ON publishing_records(status);


-- ==============================================================================
-- 8. REVIEW DECISIONS
-- Human-in-the-Loop governance audit trail
--
-- Deliberately polymorphic:
--   asset_type + asset_id
--
-- No FK is used because the governance layer can later cover:
--   - content_queue
--   - lead/outreach drafts
--   - competitor recommendations
--   - other AI-generated assets
-- ==============================================================================

CREATE TABLE IF NOT EXISTS review_decisions (
    id SERIAL PRIMARY KEY,

    asset_type VARCHAR(50) NOT NULL DEFAULT 'content_queue',

    asset_id INTEGER NOT NULL,

    reviewer VARCHAR(100) NOT NULL DEFAULT 'compliance_officer',

    decision VARCHAR(50) NOT NULL,

    reason_tag VARCHAR(100),

    notes TEXT,

    original_content TEXT,

    edited_content TEXT,

    compliance_score DOUBLE PRECISION,

    previous_status VARCHAR(50) NOT NULL,

    new_status VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_review_decision
        CHECK (
            decision IN (
                'approve',
                'reject',
                'edit',
                'rewrite',
                'regenerate'
            )
        )
);

CREATE INDEX IF NOT EXISTS ix_review_decisions_id
    ON review_decisions(id);

CREATE INDEX IF NOT EXISTS ix_review_decisions_asset_type
    ON review_decisions(asset_type);

CREATE INDEX IF NOT EXISTS ix_review_decisions_asset_id
    ON review_decisions(asset_id);

CREATE INDEX IF NOT EXISTS ix_review_decisions_decision
    ON review_decisions(decision);

CREATE INDEX IF NOT EXISTS ix_review_decisions_created_at
    ON review_decisions(created_at);

CREATE INDEX IF NOT EXISTS ix_review_decisions_asset
    ON review_decisions(asset_type, asset_id);


-- ==============================================================================
-- 9. UPDATED_AT TRIGGERS
-- Automatically maintain updated_at timestamps
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_content_queue_updated_at
ON content_queue;

CREATE TRIGGER trg_content_queue_updated_at
    BEFORE UPDATE ON content_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS trg_lessons_learned_updated_at
ON lessons_learned;

CREATE TRIGGER trg_lessons_learned_updated_at
    BEFORE UPDATE ON lessons_learned
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- 10. EXECUTIVE DIGESTS
-- Synthesizes observed competitor shifts, pricing anomalies, warranty gaps,
-- and lead signals into an actionable 4-pillar strategic action plan for JA Assure.
-- ==============================================================================

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

CREATE INDEX IF NOT EXISTS ix_executive_digests_id ON executive_digests(id);
CREATE INDEX IF NOT EXISTS ix_executive_digests_brand ON executive_digests(brand);
CREATE INDEX IF NOT EXISTS ix_executive_digests_market ON executive_digests(market);
CREATE INDEX IF NOT EXISTS ix_executive_digests_niche ON executive_digests(niche);
CREATE INDEX IF NOT EXISTS ix_executive_digests_status ON executive_digests(status);
CREATE INDEX IF NOT EXISTS ix_executive_digests_generated_at ON executive_digests(generated_at);

DROP TRIGGER IF EXISTS trg_executive_digests_updated_at ON executive_digests;
CREATE TRIGGER trg_executive_digests_updated_at
    BEFORE UPDATE ON executive_digests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==============================================================================
-- PHASE 4: EMAIL / OUTREACH AUTOMATION TABLES
-- ==============================================================================

-- 1. Campaigns Table
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

CREATE INDEX IF NOT EXISTS ix_campaigns_id ON campaigns(id);
CREATE INDEX IF NOT EXISTS ix_campaigns_brand ON campaigns(brand);
CREATE INDEX IF NOT EXISTS ix_campaigns_status ON campaigns(status);

DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON campaigns;
CREATE TRIGGER trg_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Outreach Messages Table
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

CREATE INDEX IF NOT EXISTS ix_outreach_messages_id ON outreach_messages(id);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_lead_id ON outreach_messages(lead_id);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_campaign_id ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_direction ON outreach_messages(direction);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_status ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS ix_outreach_messages_recipient ON outreach_messages(recipient);

DROP TRIGGER IF EXISTS trg_outreach_messages_updated_at ON outreach_messages;
CREATE TRIGGER trg_outreach_messages_updated_at
    BEFORE UPDATE ON outreach_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Follow-ups Table
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

CREATE INDEX IF NOT EXISTS ix_follow_ups_id ON follow_ups(id);
CREATE INDEX IF NOT EXISTS ix_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS ix_follow_ups_scheduled_at ON follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS ix_follow_ups_status ON follow_ups(status);

-- 4. Suppression List Table
CREATE TABLE IF NOT EXISTS suppression_list (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    normalized_email VARCHAR(320) UNIQUE NOT NULL,
    reason VARCHAR(80) NOT NULL,
    source VARCHAR(160) NOT NULL DEFAULT 'inbound_reply',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_suppression_list_id ON suppression_list(id);
CREATE INDEX IF NOT EXISTS ix_suppression_list_normalized_email ON suppression_list(normalized_email);

-- ==============================================================================
-- END OF JA ASSURE AI MARKETING AGENT SCHEMA
-- ==============================================================================