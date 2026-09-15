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
  created_at: string;
  updated_at: string;
}

export interface Competitor {
  id: number;
  name: string;
  url?: string;
  category: string;
  title: string;
  summary: string;
  detected_change?: string;
  actionable_recommendation?: string;
  relevance: number;
  source: string;
  collected_at: string;
}

export interface Lead {
  id: number;
  name: string;
  company: string;
  industry: string;
  email?: string;
  location?: string;
  company_size?: string;
  fit_score: number;
  qualification_reason?: string;
  recommended_brand?: Brand;
  outreach_draft?: string;
  source?: string;
  status: string;
  created_at: string;
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
}

export interface VideoScript {
  brand: string;
  concept: string;
  target_duration_seconds: number;
  voiceover_tone: string;
  scenes: VideoScene[];
  cta: string;
  disclaimer: string;
  media_status: string;
}

export interface GeneratedVariation {
  variation_label: string;
  content_text: string;
  headline?: string;
  hashtags: string[];
  cta?: string;
  media_prompt?: string;
}

export interface ComplianceViolation {
  rule_id: string;
  severity: string;
  message: string;
  flagged_phrase?: string;
  suggested_fix?: string;
}

export interface ComplianceResult {
  passed: boolean;
  score: number;
  violations: ComplianceViolation[];
  suggestions: string[];
  overall_feedback: string;
  disclaimers_required: string[];
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
  rejection_rate: number;
  average_compliance_score: number;
  total_leads: number;
  average_lead_score: number;
  total_lessons_learned: number;
  regeneration_count: number;
  brand_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
  language_breakdown: Record<string, number>;
  feedback_reason_frequency: Record<string, number>;
}

export interface HealthCheckResponse {
  status: string;
  app_name: string;
  environment: string;
  database: string;
  llm_mode: string;
  supported_brands: string[];
}
