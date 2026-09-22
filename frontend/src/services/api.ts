import type {
  ContentQueueItem,
  Competitor,
  Lead,
  Feedback,
  LessonLearned,
  DashboardSummary,
  HealthCheckResponse,
  GeneratedVariation,
  VideoScript,
  ComplianceResult,
  PublishingRecord,
  ReviewDecisionItem,
  VoiceGenerationResponse
} from '../types';

import {
  mockHealth,
  mockSummary,
  mockQueue,
  mockCompetitors,
  mockLeads,
  mockLessons,
  mockFeedbacks,
  mockPublishingRecords
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const getMediaUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

// In-memory fallback state for smooth offline/demo mode
let inMemoryQueue: ContentQueueItem[] = [...mockQueue];
let inMemoryLessons: LessonLearned[] = [...mockLessons];
let inMemoryFeedbacks: Feedback[] = [...mockFeedbacks];
let inMemoryPublishing: PublishingRecord[] = [...mockPublishingRecords];
let inMemoryLeads: Lead[] = [...mockLeads];
let inMemoryCompetitors: Competitor[] = [...mockCompetitors];

async function safeFetch<T>(url: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (fallbackData !== undefined) return fallbackData;
      const errorText = await res.text();
      throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw err;
  }
}

export const api = {
  // System Health
  getHealth: async (): Promise<HealthCheckResponse> => {
    return safeFetch<HealthCheckResponse>(`${API_BASE_URL}/health`, undefined, mockHealth);
  },

  // Analytics
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const live = await safeFetch<DashboardSummary>(`${API_BASE_URL}/analytics/summary`, undefined, {
      ...mockSummary,
      total_content: inMemoryQueue.length,
      pending_human_review: inMemoryQueue.filter(q => q.status === 'human_review' || q.status === 'pending').length,
      human_approved: inMemoryQueue.filter(q => q.status === 'approved' || q.status === 'scheduled' || q.status === 'published').length,
      approved: inMemoryQueue.filter(q => q.status === 'approved' || q.status === 'scheduled' || q.status === 'published').length,
      rejected: inMemoryQueue.filter(q => q.status === 'rejected').length,
      active_lessons_count: inMemoryLessons.filter(l => l.active).length,
      total_leads: inMemoryLeads.length
    });
    return live;
  },

  // Content Queue & Human Review
  getQueue: async (params?: { brand?: string; platform?: string; status?: string; compliance_status?: string }): Promise<ContentQueueItem[]> => {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params?.platform && params.platform !== 'all') query.append('platform', params.platform);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.compliance_status && params.compliance_status !== 'all') query.append('compliance_status', params.compliance_status);

    let filtered = [...inMemoryQueue];
    if (params?.brand && params.brand !== 'all') {
      filtered = filtered.filter(item => item.brand === params.brand);
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(item => item.status === params.status);
    }

    return safeFetch<ContentQueueItem[]>(`${API_BASE_URL}/queue?${query.toString()}`, undefined, filtered);
  },

  getQueueItem: async (id: number): Promise<ContentQueueItem> => {
    const item = inMemoryQueue.find(q => q.id === id) || inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(`${API_BASE_URL}/queue/${id}`, undefined, item);
  },

  approveContent: async (id: number, notes?: string): Promise<ContentQueueItem> => {
    const query = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const itemIndex = inMemoryQueue.findIndex(q => q.id === id);
    if (itemIndex !== -1) {
      inMemoryQueue[itemIndex] = {
        ...inMemoryQueue[itemIndex],
        status: 'approved',
        compliance_status: 'passed',
        notes: notes || inMemoryQueue[itemIndex].notes,
        updated_at: new Date().toISOString()
      };
    }
    const fallback = itemIndex !== -1 ? inMemoryQueue[itemIndex] : inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(`${API_BASE_URL}/queue/${id}/approve${query}`, { method: 'POST' }, fallback);
  },

  rejectContent: async (id: number, reasonTag: string, notes: string): Promise<ContentQueueItem> => {
    const itemIndex = inMemoryQueue.findIndex(q => q.id === id);
    if (itemIndex !== -1) {
      inMemoryQueue[itemIndex] = {
        ...inMemoryQueue[itemIndex],
        status: 'rejected',
        reason_tag: reasonTag,
        notes: notes,
        updated_at: new Date().toISOString()
      };
      // Record feedback
      inMemoryFeedbacks.unshift({
        id: Date.now(),
        content_id: id,
        reason_tag: reasonTag,
        notes: notes,
        original_content: inMemoryQueue[itemIndex].content_raw,
        created_at: new Date().toISOString()
      });
      // Add or trigger lesson
      const existingLesson = inMemoryLessons.find(l => l.category === reasonTag);
      if (existingLesson) {
        existingLesson.frequency += 1;
      } else {
        inMemoryLessons.unshift({
          id: Date.now(),
          category: reasonTag,
          lesson: `Reviewer feedback rule: ${notes}`,
          frequency: 1,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    const fallback = itemIndex !== -1 ? inMemoryQueue[itemIndex] : inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(
      `${API_BASE_URL}/queue/${id}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason_tag: reasonTag, notes }),
      },
      fallback
    );
  },

  editContent: async (id: number, editedContent: string, reasonTag?: string, notes?: string): Promise<ContentQueueItem> => {
    const itemIndex = inMemoryQueue.findIndex(q => q.id === id);
    if (itemIndex !== -1) {
      inMemoryQueue[itemIndex] = {
        ...inMemoryQueue[itemIndex],
        content_raw: editedContent,
        status: 'human_review',
        compliance_score: Math.min(100, (inMemoryQueue[itemIndex].compliance_score || 80) + 5),
        reason_tag: reasonTag || 'human_edit',
        notes: notes || 'Edited and verified by reviewer',
        updated_at: new Date().toISOString()
      };
    }
    const fallback = itemIndex !== -1 ? inMemoryQueue[itemIndex] : inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(
      `${API_BASE_URL}/queue/${id}/edit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edited_content: editedContent,
          reason_tag: reasonTag || 'human_edit',
          notes: notes || 'Edited and verified by reviewer'
        }),
      },
      fallback
    );
  },

  rewriteContent: async (id: number): Promise<ContentQueueItem> => {
    const itemIndex = inMemoryQueue.findIndex(q => q.id === id);
    if (itemIndex !== -1) {
      inMemoryQueue[itemIndex] = {
        ...inMemoryQueue[itemIndex],
        compliance_score: 95,
        compliance_status: 'passed',
        content_raw: inMemoryQueue[itemIndex].content_raw + '\n\n[Remediated: MAS Notice 124 compliant disclaimers added.]',
        updated_at: new Date().toISOString()
      };
    }
    const fallback = itemIndex !== -1 ? inMemoryQueue[itemIndex] : inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(`${API_BASE_URL}/queue/${id}/rewrite`, { method: 'POST' }, fallback);
  },

  regenerateContent: async (id: number): Promise<ContentQueueItem> => {
    const itemIndex = inMemoryQueue.findIndex(q => q.id === id);
    if (itemIndex !== -1) {
      inMemoryQueue[itemIndex] = {
        ...inMemoryQueue[itemIndex],
        status: 'human_review',
        compliance_score: 92,
        updated_at: new Date().toISOString()
      };
    }
    const fallback = itemIndex !== -1 ? inMemoryQueue[itemIndex] : inMemoryQueue[0];
    return safeFetch<ContentQueueItem>(`${API_BASE_URL}/queue/${id}/regenerate`, { method: 'POST' }, fallback);
  },

  getReviewHistory: async (id: number): Promise<ReviewDecisionItem[]> => {
    const mockDecisions: ReviewDecisionItem[] = [
      {
        id: 1,
        asset_type: 'content',
        asset_id: id,
        reviewer: 'compliance_officer_mas',
        decision: 'audit',
        previous_status: 'pending',
        new_status: 'human_review',
        compliance_score: 92,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    return safeFetch<ReviewDecisionItem[]>(`${API_BASE_URL}/queue/${id}/history`, undefined, mockDecisions);
  },

  // Content Generation
  generateVariations: async (payload: {
    brand: string;
    platform: string;
    topic: string;
    content_type?: string;
    language?: string;
    key_benefits?: string[];
    target_persona?: string;
    cta?: string;
  }): Promise<GeneratedVariation[]> => {
    const mockVars: GeneratedVariation[] = [
      {
        variation_label: 'A',
        headline: `${payload.topic} — Executive Risk Analysis`,
        content_text: `In today's volatile regulatory landscape, high-net-worth individuals and specialty enterprises require contractual assurance.\n\n${payload.topic} reveals critical policy sub-limits that leave standard policyholders exposed. JA Assure provides tailored agreed-value coverage backed by Lloyd's of London with zero depreciation penalty.\n\nDisclaimer: Policy terms apply. JA Assure is a registered Lloyd's Coverholder under Monetary Authority of Singapore (MAS) regulations.`,
        hashtags: ['#InsurTech', '#JAAssure', '#RiskManagement', '#LloydsCoverholder']
      },
      {
        variation_label: 'B',
        headline: `Protecting Legacy & Continuity: ${payload.topic}`,
        content_text: `Your reputation and high-value assets shouldn't depend on generic insurance fine print.\n\n${payload.topic} requires dedicated underwriting expertise. Experience bespoke protection with immediate claims advisory and full regulatory transparency across Singapore and regional hubs.\n\nLearn more: Contact JA Assure's accredited underwriters. Lloyd's Coverholder.`,
        hashtags: ['#AssetProtection', '#SingaporeFintech', '#SpecialtyInsurance']
      }
    ];

    // Add generated item to inMemoryQueue so it shows in Review Center
    const newItem: ContentQueueItem = {
      id: Date.now(),
      brand: payload.brand as any,
      platform: payload.platform as any,
      content_type: payload.content_type || 'post',
      topic: payload.topic,
      content_raw: mockVars[0].content_text,
      variation: 'A',
      language: payload.language || 'en',
      compliance_status: 'passed',
      status: 'human_review',
      compliance_score: 94,
      metadata_json: JSON.stringify({
        compliance_status: 'PASS',
        compliance_jurisdiction: 'SG / MAS',
        compliance_violations: []
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryQueue.unshift(newItem);

    return safeFetch<GeneratedVariation[]>(
      `${API_BASE_URL}/content/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      mockVars
    );
  },

  generateSuite: async (payload: {
    brand: string;
    topic: string;
    platforms: string[];
    content_types: string[];
    languages: string[];
    key_benefits?: string[];
  }): Promise<ContentQueueItem[]> => {
    return safeFetch<ContentQueueItem[]>(
      `${API_BASE_URL}/content/suite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      inMemoryQueue.slice(0, 3)
    );
  },

  generateVideoScript: async (payload: {
    brand: string;
    topic: string;
    target_duration?: number;
    platform?: string;
    language?: string;
    target_audience?: string;
  }): Promise<VideoScript> => {
    const mockScript: VideoScript = {
      brand: payload.brand || 'jade',
      title: `${payload.topic} — Explainer Reel`,
      concept: `High-impact 45-second visual breakdown highlighting coverage blind spots and JA Assure's Lloyd's Coverholder backing.`,
      hook: `Did you know your home policy caps jewelry claims at just S$2,500?`,
      target_duration_seconds: payload.target_duration || 45,
      target_platform: payload.platform || 'reel',
      voiceover_tone: 'authoritative, discreet, advisory',
      cta: 'Visit ja-assure.com for bespoke valuation and underwriting.',
      disclaimer: 'JA Assure is a registered Lloyd\'s Coverholder under MAS regulations. Policy issuance is subject to underwriting criteria.',
      media_status: 'ready',
      scenes: [
        {
          scene_number: 1,
          duration_seconds: 10,
          visual_description: 'Close-up of a high-carat diamond ring being placed inside a safe deposit box.',
          voiceover: 'Most collectors believe their bank safe deposit box guarantees insurance. In reality, banks carry zero liability for stored contents.',
          onscreen_text: 'Safe Deposit Boxes = Zero Insurance',
          transition: 'Quick cut to Singapore skyline',
          compliance_disclaimer: 'Terms and conditions apply. Lloyd\'s Coverholder JA Assure.'
        },
        {
          scene_number: 2,
          duration_seconds: 18,
          visual_description: 'Certified gemologist examining gemstone with loupe, displaying agreed-value certificate.',
          voiceover: 'JA Assure Jade delivers certified agreed-value valuation with worldwide exhibition and travel protection.',
          onscreen_text: 'Agreed Value • Certified Appraisals • Global Cover',
          transition: 'Gentle wipe',
          compliance_disclaimer: 'Subject to gemological verification.'
        },
        {
          scene_number: 3,
          duration_seconds: 17,
          visual_description: 'JA Assure brand emblem with Lloyd\'s Coverholder insignia and contact information.',
          voiceover: 'Insure. Innovate. Integrate. Speak with our specialized private risk underwriters today.',
          onscreen_text: 'JA Assure • Lloyd\'s Coverholder • Get Started',
          transition: 'Fade out',
          compliance_disclaimer: 'Licensed and regulated under Monetary Authority of Singapore guidelines.'
        }
      ]
    };

    return safeFetch<VideoScript>(
      `${API_BASE_URL}/content/video`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      mockScript
    );
  },

  generateVoiceover: async (videoScript: VideoScript, language = 'en'): Promise<VoiceGenerationResponse> => {
    const mockVoice: VoiceGenerationResponse = {
      status: 'completed',
      audio_url: '/media/voiceovers/demo_voiceover.mp3',
      audio_filename: 'demo_voiceover.mp3',
      duration_seconds: videoScript.target_duration_seconds || 45,
      voiceover_text: videoScript.scenes.map(s => s.voiceover).join(' '),
      file_size_bytes: 345000,
      language: language,
      provider: 'gTTS (Google Text-to-Speech)',
      scene_count: videoScript.scenes.length,
      created_at: new Date().toISOString()
    };

    return safeFetch<VoiceGenerationResponse>(
      `${API_BASE_URL}/content/voiceover`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_script: videoScript, language }),
      },
      mockVoice
    );
  },

  // Compliance
  checkCompliance: async (payload: {
    brand: string;
    content: string;
    platform: string;
    language?: string;
  }): Promise<ComplianceResult> => {
    const mockComp: ComplianceResult = {
      passed: true,
      score: 94,
      status: 'PASS',
      violations: [],
      suggestions: ['Include registered Lloyd\'s Coverholder notice'],
      overall_feedback: 'Full compliance with MAS Notice 124 fair dealing and transparency guidelines.',
      disclaimers_required: ['Lloyd\'s Coverholder registration disclaimer']
    };
    return safeFetch<ComplianceResult>(
      `${API_BASE_URL}/compliance/audit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      mockComp
    );
  },

  // Competitors
  getCompetitors: async (): Promise<Competitor[]> => {
    return safeFetch<Competitor[]>(`${API_BASE_URL}/competitors`, undefined, inMemoryCompetitors);
  },

  scrapeCompetitor: async (url: string, brand?: string): Promise<any> => {
    const mockScrape = {
      name: 'Extracted Competitor Intelligence',
      website: url,
      category: brand || 'luxury_jewellery',
      positioning: 'Standard sub-limit policies identified. Highlights opportunity for JA Assure agreed-value counter-messaging.',
      confidence: 0.94
    };
    return safeFetch<any>(
      `${API_BASE_URL}/competitors/scrape`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brand }),
      },
      mockScrape
    );
  },

  analyzeCompetitorUrl: async (url: string, brand?: string): Promise<any> => {
    return api.scrapeCompetitor(url, brand);
  },

  // Leads
  getLeads: async (params?: { brand?: string; country?: string; industry?: string }): Promise<Lead[]> => {
    let filtered = [...inMemoryLeads];
    if (params?.brand && params.brand !== 'all') {
      filtered = filtered.filter(l => l.recommended_brand === params.brand);
    }
    if (params?.country && params.country !== 'all') {
      filtered = filtered.filter(l => l.location?.includes(params.country!));
    }
    return safeFetch<Lead[]>(`${API_BASE_URL}/leads`, undefined, filtered);
  },

  discoverLeads: async (payload: { brand?: string; country?: string; industry?: string }): Promise<Lead[]> => {
    return safeFetch<Lead[]>(
      `${API_BASE_URL}/leads/discover`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      inMemoryLeads
    );
  },

  enrichLead: async (leadId: number, websiteUrl?: string): Promise<Lead> => {
    const lead = inMemoryLeads.find(l => l.id === leadId) || inMemoryLeads[0];
    lead.fit_score = Math.min(100, lead.fit_score + 4);
    lead.qualification_reason = (lead.qualification_reason || '') + ' [Enriched with verified business registry records]';
    return safeFetch<Lead>(
      `${API_BASE_URL}/leads/${leadId}/enrich`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: websiteUrl }),
      },
      lead
    );
  },

  generateLeadOutreach: async (leadId: number): Promise<Lead> => {
    const lead = inMemoryLeads.find(l => l.id === leadId) || inMemoryLeads[0];
    lead.outreach_draft = `Dear ${lead.name || 'Executive'},\n\nWe noted ${lead.company}'s specialized operations in ${lead.location || 'Singapore'}. Given increasing underwriting requirements for high-value risks, JA Assure provides tailored Lloyd's Coverholder insurance solutions.\n\nLet's schedule a brief 10-minute briefing on your coverage options.\n\nWarm regards,\nJA Assure Underwriting Advisory`;
    return safeFetch<Lead>(`${API_BASE_URL}/leads/${leadId}/outreach`, { method: 'POST' }, lead);
  },

  // Lessons Learned
  getLessons: async (brand?: string): Promise<LessonLearned[]> => {
    let list = inMemoryLessons;
    if (brand && brand !== 'all') {
      list = inMemoryLessons.filter(l => !l.category || l.category.includes(brand) || l.category === 'all');
    }
    return safeFetch<LessonLearned[]>(`${API_BASE_URL}/learning/lessons`, undefined, list);
  },

  toggleLesson: async (id: number): Promise<LessonLearned> => {
    const lesson = inMemoryLessons.find(l => l.id === id) || inMemoryLessons[0];
    lesson.active = !lesson.active;
    return safeFetch<LessonLearned>(`${API_BASE_URL}/learning/lessons/${id}/toggle`, { method: 'POST' }, lesson);
  },

  getFeedback: async (): Promise<Feedback[]> => {
    return safeFetch<Feedback[]>(`${API_BASE_URL}/learning/feedback`, undefined, inMemoryFeedbacks);
  },

  // Publishing Records
  getPublishingRecords: async (): Promise<PublishingRecord[]> => {
    return safeFetch<PublishingRecord[]>(`${API_BASE_URL}/publishing/records`, undefined, inMemoryPublishing);
  },

  schedulePublishing: async (
    paramOrId: number | { content_id: number; platform: string; scheduled_at?: string },
    platform?: string,
    scheduledAt?: string
  ): Promise<PublishingRecord> => {
    const contentId = typeof paramOrId === 'number' ? paramOrId : paramOrId.content_id;
    const targetPlatform = typeof paramOrId === 'number' ? (platform || 'linkedin') : paramOrId.platform;
    const targetTime = typeof paramOrId === 'number' ? (scheduledAt || new Date().toISOString()) : (paramOrId.scheduled_at || new Date().toISOString());

    const newRecord: PublishingRecord = {
      id: Date.now(),
      content_id: contentId,
      platform: targetPlatform,
      scheduled_at: targetTime,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    inMemoryPublishing.unshift(newRecord);
    const item = inMemoryQueue.find(q => q.id === contentId);
    if (item) {
      item.status = 'scheduled';
    }
    return safeFetch<PublishingRecord>(
      `${API_BASE_URL}/publishing/schedule`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId, platform: targetPlatform, scheduled_at: targetTime }),
      },
      newRecord
    );
  },

  cancelPublishing: async (recordId: number): Promise<PublishingRecord> => {
    const rec = inMemoryPublishing.find(r => r.id === recordId) || inMemoryPublishing[0];
    rec.status = 'cancelled';
    return safeFetch<PublishingRecord>(`${API_BASE_URL}/publishing/records/${recordId}/cancel`, { method: 'POST' }, rec);
  }
};
