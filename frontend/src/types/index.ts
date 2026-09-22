export type Brand = 'jade' | 'doctorshield' | 'jaguartransit';

export type Platform = 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'x' | 'blog' | 'reel';

export type ContentStatus = 
  | 'pending'
  | 'compliance_checked'
  | 'human_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'published';

export type ComplianceStatus = 'pending' | 'passed' | 'flagged' | 'failed';

export interface ContentQueueItem {
  id: number;
  brand: Brand;
  platform: Platform;
  content_type: string;
  topic: string;
  content_raw: string;
  variation: string;
  language: string;
  compliance_status: ComplianceStatus;
  status: ContentStatus;
  compliance_score: number;
  reason_tag?: string;
  notes?: string;
  metadata_json?: string;
  original_content_raw?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewDecisionItem {
  id: number;
  asset_type: string;
  asset_id: number;
  reviewer: string;
  decision: 'approve' | 'reject' | 'edit' | 'rewrite' | 'regenerate' | string;
  reason_tag?: string;
  notes?: string;
  original_content?: string;
  edited_content?: string;
  compliance_score?: number;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface Competitor {
  id: number;
  name: string;
  url?: string;
  domain?: string;
  brand?: string;
  category: string;
  market?: string;
  title: string;
  summary: string;
  detected_change?: string;
  actionable_recommendation?: string;
  pricing_summary?: string;
  coverage_strengths?: string;
  coverage_weaknesses?: string;
  underwriter?: string;
  target_customer_size?: string;
  threat_level?: 'high' | 'medium' | 'low';
  is_active?: boolean;
  relevance: number;
  source: string;
  source_type?: string;
  last_monitored_at?: string;
  collected_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompetitorSnapshot {
  id: number;
  competitor_id: number;
  snapshot_date: string;
  page_url: string;
  page_title?: string;
  content_hash?: string;
  pricing_data: {
    base_rate?: string;
    minimum_premium?: string;
    deductible_terms?: string;
    pricing_summary?: string;
  };
  coverage_terms: {
    inclusions?: string[];
    exclusions?: string[];
    target_customer?: string;
  };
  public_announcements: Array<{
    title: string;
    date: string;
    summary: string;
  }>;
  raw_text_excerpt?: string;
  captured_at: string;
}

export interface CompetitorChange {
  id: number;
  competitor_id: number;
  change_type: string;
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  old_value?: string;
  new_value?: string;
  source_url?: string;
  detected_at: string;
}

export interface CompetitorBattlecard {
  id: number;
  competitor_id: number;
  ja_product: string;
  why_ja_wins: string[];
  where_competitor_wins: string[];
  objection_handling: Record<string, string>;
  pricing_comparison?: string;
  sales_pitch_hook?: string;
  updated_at: string;
}

export interface CompetitorScanResult {
  competitor_id: number;
  status: string;
  content_hash: string;
  changes_detected: number;
  changes: CompetitorChange[];
  battlecard_updated: boolean;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  normalized_company_name?: string;
  domain?: string;
  website?: string;
  industry: string;
  email?: string;
  phone?: string;
  location?: string;
  country?: string;
  city?: string;
  address?: string;
  company_size?: string;
  description?: string;
  product_fit?: string;
  fit_score: number;
  score_breakdown_json?: string;
  why_now?: string;
  signals_json?: string;
  contacts_json?: string;
  qualification_reason?: string;
  recommended_brand?: Brand;
  outreach_draft?: string;
  source?: string;
  source_type?: string;
  status: string;
  is_demo?: boolean;
  campaign_id?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Feedback {
  id: number;
  content_id: number;
  reason_tag: string;
  notes: string;
  original_content: string;
  corrected_content?: string;
  created_at: string;
}

export interface LessonLearned {
  id: number;
  category: string;
  lesson: string;
  examples?: string;
  frequency: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VideoScene {
  scene_number: number;
  duration_seconds: number;
  visual_description: string;
  voiceover: string;
  onscreen_text: string;
  transition?: string;
  compliance_disclaimer?: string;
}

export interface VideoScript {
  brand: string;
  title?: string;
  concept: string;
  hook?: string;
  target_duration_seconds: number;
  voiceover_tone: string;
  target_platform?: string;
  target_audience?: string;
  language?: string;
  scenes: VideoScene[];
  cta: string;
  disclaimer: string;
  media_status: string;
  audio_url?: string;
  audio_filename?: string;
  audio_duration_seconds?: number;
  voice_provider?: string;
  voice_language?: string;
  voice_status?: string;
}

export interface VoiceGenerationResponse {
  status: string;
  audio_url: string;
  audio_filename: string;
  language: string;
  provider: string;
  duration_seconds?: number;
  voiceover_text: string;
  scene_count: number;
  file_size_bytes: number;
  created_at: string;
}

export interface GeneratedVariation {
  variation_label: string;
  content_text: string;
  headline?: string;
  hashtags: string[];
  cta?: string;
  media_prompt?: string;
}

export interface ClaimItem {
  claim_text: string;
  claim_type: string;
  risk_level: string;
  explanation?: string;
}

export interface ComplianceViolation {
  rule_id: string;
  category?: string;
  severity: string; // CRITICAL, HIGH, MEDIUM, LOW, warning, critical, info
  message: string;
  reason?: string;
  flagged_phrase?: string;
  matched_text?: string;
  suggested_fix?: string;
  recommendation?: string;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  status?: string; // PASS, WARNING, BLOCKED, REQUIRES_HUMAN_REVIEW
  violations: ComplianceViolation[];
  warnings?: ComplianceViolation[];
  suggestions: string[];
  overall_feedback: string;
  disclaimers_required: string[];
  disclaimer_status?: string;
  claims_analyzed?: ClaimItem[];
  jurisdiction?: string;
  brand?: string;
  product?: string;
  platform?: string;
  language?: string;
  human_review_required?: boolean;
}

export interface PublishingRecord {
  id: number;
  content_id: number;
  platform: string;
  external_post_id?: string;
  status: string;
  scheduled_at?: string;
  published_at?: string;
  engagement_metrics?: string;
  error_info?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_content: number;
  pending_compliance: number;
  pending_human_review: number;
  compliance_approved: number;
  human_approved: number;
  approved: number;
  rejected: number;
  edited: number;
  published: number;
  approval_rate?: number;
  rejection_rate: number;
  average_compliance_score: number;
  total_leads: number;
  average_lead_score: number;
  total_lessons_learned: number;
  active_lessons_count?: number;
  total_feedback_count?: number;
  regeneration_count: number;
  brand_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
  language_breakdown: Record<string, number>;
  feedback_reason_frequency: Record<string, number>;
  compliance_score_distribution?: Record<string, number>;
  lead_score_distribution?: Record<string, number>;
  status_breakdown?: Record<string, number>;
}

export interface HealthCheckResponse {
  status: string;
  app_name: string;
  environment: string;
  database: string;
  database_type?: string;
  llm_provider?: string;
  llm_model?: string;
  llm_mode: string;
  supported_brands: string[];
}
