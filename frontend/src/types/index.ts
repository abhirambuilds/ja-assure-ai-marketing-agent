export type Brand = 'jade' | 'doctorshield' | 'jaguartransit';

export type Platform = 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'blog';

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
  relevance: number;
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
  outreach_draft?: string;
  source?: string;
  status: string;
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

export interface DashboardSummary {
  total_content: number;
  pending_compliance: number;
  pending_human_review: number;
  approved: number;
  rejected: number;
  published: number;
  average_compliance_score: number;
  total_leads: number;
  total_lessons_learned: number;
  brand_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
}

export interface HealthCheckResponse {
  status: string;
  app_name: string;
  environment: string;
  database: string;
  llm_mode: string;
  supported_brands: string[];
}
