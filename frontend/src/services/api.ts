import type {
  ContentQueueItem,
  Competitor,
  CompetitorSnapshot,
  CompetitorChange,
  CompetitorBattlecard,
  CompetitorScanResult,
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
  VoiceGenerationResponse,
  ExecutiveDigest,
  ExecutiveDigestGenerateRequest,
  OutreachMessage,
  Campaign,
  ReplyClassification,
  SuppressionEntry,
  ProviderStatus
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

const mockInitialDigest: ExecutiveDigest = {
  id: 1,
  title: 'JA Assure Executive Competitor & Market Digest (Singapore) — March 2026',
  brand: 'all',
  market: 'Singapore',
  niche: 'all',
  period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
  period_end: new Date().toISOString(),
  executive_summary: "Over the past 30 days in Singapore, competitive monitoring highlights significant structural movement across niche specialty insurance lines. Incumbent carriers continue to grapple with elevated claim inflation and legacy distribution costs, triggering premium rate firming, more stringent vault/security warranties, and longer underwriting turnaround times.\n\nJA Assure's direct InsurTech architecture and Lloyd's coverholder capacity create an immediate commercial opening to displace incumbents by offering transparent digital quotation, flexible warranty requirements, and guaranteed rate certainty.",
  what_ja_should_do: "### 1. 🎯 Tactical Pricing & Margin Strategy\n- **Jade**: Capitalize on Chubb's high minimum premium (SGD 4,500+) by offering qualified retail jewellers our SGD 2,800 entry tier with zero deductible on certified in-safe stock.\n- **DoctorShield**: Target aesthetic practitioners facing MPS's 14% subscription hike with guaranteed 20% lower baseline premiums and contract certainty.\n- **Jaguar Transit**: Promote our flat-rate declaration structure to diamond/watch merchants tired of Brink's SGD 350 minimum per-pickup fee.\n\n### 2. 🛡️ Product & Policy Coverage Counter-Actions\n- **Waiver of Grade IV Safe Mandates**: Where Chubb enforces expensive safe upgrades, offer Jade coverage with existing Grade III safes supported by approved CCTV telematics.\n- **Contract Certainty vs Discretionary Mutual**: Launch educational messaging emphasizing that DoctorShield is a regulated, legally enforceable insurance contract under Lloyd's coverholders, unlike MPS mutual protection.\n\n### 3. ⚔️ Sales Team Battlecard & Lead Outreach Strategy\n- Equip sales reps with direct objection-handling scripts: 'When your MPS renewal arrives with an inflation increase, let us benchmark your coverage under DoctorShield before you pay.'\n- Cross-reference Module 1 jewellery leads approaching Q2 renewal cycles with Chubb comparison figures.\n\n### 4. 📢 Marketing & Campaign Positioning\n- Launch LinkedIn thought leadership highlighting: *'Why InsurTech is beating legacy paper proposals in Singapore Jewellers Block'*. Feature Alan Tham (Chief Insurance Officer) commentary.",
  source_count: 8,
  model: 'Groq (Llama-3/Compound)',
  status: 'published',
  generated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_shifts_analyzed: 2,
  changes_analyzed: [
    {
      competitor: 'Chubb Fine Art & Specie',
      change_type: 'coverage_update',
      severity: 'critical',
      title: 'Safe Warranty Mandate Upgraded to Grade V',
      description: 'Incumbent underwriter mandated Grade V safes for commercial jewelers with stock exceeding SGD 500,000.',
      detected_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      competitor: 'Medical Protection Society (MPS)',
      change_type: 'pricing_change',
      severity: 'major',
      title: 'Annual Subscription Rate Revision (+14%)',
      description: 'Discretionary mutual membership fees increased across cosmetic surgery and aesthetic medicine specializations.',
      detected_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    }
  ],
  lead_signals_analyzed: [
    {
      company: 'Orchard Gem Vault Pte Ltd',
      industry: 'jewellery',
      fit_score: 92,
      recommended_brand: 'jade',
      why_now: 'Opening second flagship boutique in Marina Bay; seeking flexible safe endorsements.',
    }
  ],
  pricing_strategy_points: [
    "Jade: Undercut Chubb's high minimum premium (SGD 4,500+) with SGD 2,800 entry tier and zero deductible.",
    "DoctorShield: Target aesthetic practitioners facing MPS's 14% subscription hike with guaranteed 20% lower baseline premiums.",
    "Jaguar Transit: Promote flat-rate declaration structure against Brink's high minimum per-pickup fee."
  ],
  underwriting_tweaks: [
    "Waiver of Grade IV Safe Mandates: Offer Jade coverage with existing Grade III safes with approved CCTV telematics.",
    "Contract Certainty vs Discretionary Mutual: Emphasize DoctorShield regulated, legally enforceable policy under Lloyd's coverholders."
  ],
  battlecard_updates: [
    "Equip sales reps with objection-handling: 'When your MPS renewal arrives, benchmark under DoctorShield before you pay.'",
    "Cross-reference Module 1 jewellery leads approaching Q2 renewal cycles with Chubb comparison figures."
  ],
  marketing_campaign_ideas: [
    "Launch LinkedIn thought leadership: 'Why InsurTech is beating legacy paper proposals in Singapore Jewellers Block'.",
    "Targeted DoctorShield campaigns emphasizing contract certainty and statutory protection in Singapore."
  ]
};

let inMemoryDigests: ExecutiveDigest[] = [mockInitialDigest];

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

  // Competitors & Radar
  getCompetitors: async (params?: { brand?: string; category?: string; niche?: string; threat_level?: string; is_active?: boolean }): Promise<Competitor[]> => {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.niche && params.niche !== 'all') query.append('niche', params.niche);
    if (params?.threat_level && params.threat_level !== 'all') query.append('threat_level', params.threat_level);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));

    const url = query.toString() ? `${API_BASE_URL}/competitors?${query.toString()}` : `${API_BASE_URL}/competitors`;
    return safeFetch<Competitor[]>(url, undefined, inMemoryCompetitors);
  },

  getCompetitor: async (id: number): Promise<Competitor> => {
    const fallback = inMemoryCompetitors.find(c => c.id === id) || inMemoryCompetitors[0];
    return safeFetch<Competitor>(`${API_BASE_URL}/competitors/${id}`, undefined, fallback);
  },

  createCompetitor: async (data: Partial<Competitor>): Promise<Competitor> => {
    const mockCreated: Competitor = {
      id: Date.now(),
      name: data.name || 'New Competitor',
      url: data.url,
      domain: data.domain,
      brand: data.brand || 'jade',
      category: data.category || 'jewellery',
      market: data.market || 'Singapore',
      title: data.title || `${data.name} Profile`,
      summary: data.summary || '',
      threat_level: data.threat_level || 'medium',
      relevance: 0.85,
      source: 'manual_entry',
      source_type: 'VERIFIED_SOURCE',
      is_active: true,
      collected_at: new Date().toISOString(),
    };
    inMemoryCompetitors.unshift(mockCreated);
    return safeFetch<Competitor>(
      `${API_BASE_URL}/competitors`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      mockCreated
    );
  },

  scanCompetitor: async (id: number): Promise<CompetitorScanResult> => {
    const fallback: CompetitorScanResult = {
      competitor_id: id,
      status: 'success',
      content_hash: 'sha256_mock_hash',
      changes_detected: 1,
      changes: [
        {
          id: Date.now(),
          competitor_id: id,
          change_type: 'pricing_change',
          severity: 'major',
          title: 'Revised baseline minimum underwriting premium threshold',
          description: 'Observed shift in advertised policy deductibles and minimum premium guidelines.',
          old_value: 'SGD 3,500 min',
          new_value: 'SGD 4,500 min',
          detected_at: new Date().toISOString(),
        }
      ],
      battlecard_updated: true,
    };
    return safeFetch<CompetitorScanResult>(
      `${API_BASE_URL}/competitors/${id}/scan`,
      { method: 'POST' },
      fallback
    );
  },

  scanAllCompetitors: async (niche?: string): Promise<{ status: string; scanned_count: number; results: CompetitorScanResult[] }> => {
    const query = niche ? `?niche=${encodeURIComponent(niche)}` : '';
    const fallback = {
      status: 'success',
      scanned_count: inMemoryCompetitors.length,
      results: inMemoryCompetitors.map(c => ({
        competitor_id: c.id,
        status: 'success',
        content_hash: 'sha256_mock_hash',
        changes_detected: 0,
        changes: [],
        battlecard_updated: true,
      })),
    };
    return safeFetch<any>(
      `${API_BASE_URL}/competitors/scan-all${query}`,
      { method: 'POST' },
      fallback
    );
  },

  getCompetitorSnapshots: async (id: number): Promise<CompetitorSnapshot[]> => {
    const fallback: CompetitorSnapshot[] = [
      {
        id: 1,
        competitor_id: id,
        snapshot_date: new Date().toISOString(),
        page_url: 'https://competitor.com',
        page_title: 'Competitor Commercial Underwriting Terms',
        content_hash: 'sha256_mock_hash',
        pricing_data: {
          base_rate: '0.45% - 0.75%',
          minimum_premium: 'SGD 4,500',
          deductible_terms: 'SGD 2,500 per claim',
          pricing_summary: 'Premium pricing tier for commercial insureds.',
        },
        coverage_terms: {
          inclusions: ['Commercial stock', 'Transit perils', 'Exhibition risk'],
          exclusions: ['Unattended vehicle loss', 'Non-UL safes'],
          target_customer: 'Mid-to-large enterprises',
        },
        public_announcements: [
          {
            title: 'Updated 2026 Commercial Underwriting Appetites',
            date: '2026',
            summary: 'Tightened security warranties for regional fine jewellery vaults.',
          }
        ],
        raw_text_excerpt: 'Commercial insurance solutions and underwriting capacity...',
        captured_at: new Date().toISOString(),
      }
    ];
    return safeFetch<CompetitorSnapshot[]>(`${API_BASE_URL}/competitors/${id}/snapshots`, undefined, fallback);
  },

  getCompetitorChanges: async (id?: number): Promise<CompetitorChange[]> => {
    const url = id ? `${API_BASE_URL}/competitors/${id}/changes` : `${API_BASE_URL}/competitors/changes`;
    const fallback: CompetitorChange[] = [
      {
        id: 1,
        competitor_id: id || 1,
        change_type: 'pricing_change',
        severity: 'major',
        title: 'Adjusted minimum premium threshold from SGD 3,500 to SGD 4,500',
        description: 'Underwriter tightened minimum commitment requirements for retail jewellers.',
        old_value: 'SGD 3,500',
        new_value: 'SGD 4,500',
        detected_at: new Date().toISOString(),
      },
      {
        id: 2,
        competitor_id: id || 2,
        change_type: 'coverage_update',
        severity: 'major',
        title: 'Introduced dual-path GSM alarm security warranty restriction',
        description: 'New policy endorsements mandate UL-certified central alarm connection.',
        old_value: 'Single path alarm permitted',
        new_value: 'Dual-path GSM monitoring mandatory',
        detected_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ];
    return safeFetch<CompetitorChange[]>(url, undefined, fallback);
  },

  getCompetitorBattlecard: async (id: number): Promise<CompetitorBattlecard> => {
    const fallback: CompetitorBattlecard = {
      id: 1,
      competitor_id: id,
      ja_product: 'Jade',
      why_ja_wins: [
        '100% digital onboarding & turnaround in <24h vs competitor multi-week paperwork',
        "Lloyd's of London coverholder terms with S&P A+ rated security",
        '0% deductible option available for certified UL safe installations',
        'Transparent unbundled pricing with real-time portfolio management dashboard'
      ],
      where_competitor_wins: [
        'Legacy brand history and balance sheet capacity for mega-cap single-risk vaults'
      ],
      objection_handling: {
        'We have been with competitor for over 10 years': 'Competitor holds brand heritage, but their premium rates and rigid warranties have tightened significantly in 2025/2026. JA Assure offers Lloyd-backed contract certainty with 15-25% lower baseline rates.',
        'Is JA Assure backed by an A-rated underwriter?': "Yes, our policies are placed through Lloyd's of London syndicates holding S&P A+ / AM Best A ratings.",
      },
      pricing_comparison: 'JA Assure delivers 15-25% lower baseline premiums with substantially faster digital policy issuance.',
      sales_pitch_hook: 'When did your current underwriter last review your unattended display warranties or offer safe-security premium discounts?',
      updated_at: new Date().toISOString(),
    };
    return safeFetch<CompetitorBattlecard>(`${API_BASE_URL}/competitors/${id}/battlecard`, undefined, fallback);
  },

  regenerateCompetitorBattlecard: async (id: number): Promise<CompetitorBattlecard> => {
    const fallback = await api.getCompetitorBattlecard(id);
    return safeFetch<CompetitorBattlecard>(
      `${API_BASE_URL}/competitors/${id}/battlecard`,
      { method: 'POST' },
      fallback
    );
  },

  getCompetitiveHook: async (brand?: string, industry?: string): Promise<any> => {
    const query = new URLSearchParams();
    if (brand) query.append('brand', brand);
    if (industry) query.append('industry', industry);
    return safeFetch<any>(`${API_BASE_URL}/competitors/hook?${query.toString()}`, undefined, null);
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
  getLeads: async (params?: { brand?: string; country?: string; industry?: string; status?: string }): Promise<Lead[]> => {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params?.country && params.country !== 'all') query.append('country', params.country);
    if (params?.industry) query.append('industry', params.industry);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    let filtered = [...inMemoryLeads];
    if (params?.brand && params.brand !== 'all') {
      filtered = filtered.filter(l => l.recommended_brand === params.brand);
    }
    if (params?.country && params.country !== 'all') {
      filtered = filtered.filter(l => l.location?.includes(params.country!));
    }
    const url = query.toString() ? `${API_BASE_URL}/leads?${query.toString()}` : `${API_BASE_URL}/leads`;
    return safeFetch<Lead[]>(url, undefined, filtered);
  },

  discoverLeads: async (payload: { brand?: string; country?: string; industry?: string; keywords?: string }): Promise<Lead[]> => {
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
        body: JSON.stringify({ source_url: websiteUrl }),
      },
      lead
    );
  },

  scoreLead: async (leadId: number): Promise<{ lead_id: number; score: number; score_breakdown: Record<string, any>; why_now?: string }> => {
    const fallback = {
      lead_id: leadId,
      score: 82,
      score_breakdown: { industry_fit: 25, company_relevance: 18, geographic_fit: 20, product_fit: 19, trigger_strength: 12 },
      why_now: "Observed new retail showroom expansion in Singapore."
    };
    return safeFetch<{ lead_id: number; score: number; score_breakdown: Record<string, any>; why_now?: string }>(
      `${API_BASE_URL}/leads/${leadId}/score`,
      { method: 'POST' },
      fallback
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
  },

  // Executive Digest
  getDigests: async (params?: { brand?: string; market?: string; limit?: number }): Promise<ExecutiveDigest[]> => {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params?.market && params.market !== 'all') query.append('market', params.market);
    if (params?.limit) query.append('limit', String(params.limit));

    let filtered = [...inMemoryDigests];
    if (params?.brand && params.brand !== 'all') {
      filtered = filtered.filter(d => d.brand === params.brand || d.brand === 'all');
    }
    if (params?.market && params.market !== 'all') {
      filtered = filtered.filter(d => d.market === params.market);
    }
    const url = query.toString() ? `${API_BASE_URL}/digests?${query.toString()}` : `${API_BASE_URL}/digests`;
    return safeFetch<ExecutiveDigest[]>(url, undefined, filtered);
  },

  getLatestDigest: async (params?: { brand?: string; market?: string }): Promise<ExecutiveDigest> => {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.append('brand', params.brand);
    if (params?.market && params.market !== 'all') query.append('market', params.market);

    const fallback = inMemoryDigests[0];
    const url = query.toString() ? `${API_BASE_URL}/digests/latest?${query.toString()}` : `${API_BASE_URL}/digests/latest`;
    return safeFetch<ExecutiveDigest>(url, undefined, fallback);
  },

  getDigest: async (id: number): Promise<ExecutiveDigest> => {
    const fallback = inMemoryDigests.find(d => d.id === id) || inMemoryDigests[0];
    return safeFetch<ExecutiveDigest>(`${API_BASE_URL}/digests/${id}`, undefined, fallback);
  },

  generateDigest: async (payload: ExecutiveDigestGenerateRequest): Promise<ExecutiveDigest> => {
    const targetBrand = payload.brand || 'all';
    const targetMarket = payload.market || 'Singapore';

    const mockGenerated: ExecutiveDigest = {
      id: Date.now(),
      title: `JA Assure Executive Competitor Digest (${targetMarket}) — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      brand: targetBrand,
      market: targetMarket,
      niche: payload.niche || 'all',
      period_start: new Date(Date.now() - (payload.period_days || 30) * 86400000).toISOString(),
      period_end: new Date().toISOString(),
      executive_summary: `Over the past ${payload.period_days || 30} days in ${targetMarket}, competitor monitoring highlights significant structural shifts across niche specialty insurance lines. Incumbent carriers continue to grapple with elevated claim inflation and legacy distribution costs, triggering premium rate firming, more stringent vault/security warranties, and longer underwriting turnaround times.\n\nJA Assure's direct InsurTech architecture and Lloyd's coverholder capacity create an immediate commercial opening to displace incumbents by offering transparent digital quotation, flexible warranty requirements, and guaranteed rate certainty.`,
      what_ja_should_do: `### 1. 🎯 Tactical Pricing & Margin Strategy\n- **Jade**: Capitalize on Chubb's high minimum premium (SGD 4,500+) by offering qualified retail jewellers our SGD 2,800 entry tier with zero deductible on certified in-safe stock.\n- **DoctorShield**: Target aesthetic practitioners facing MPS's 14% subscription hike with guaranteed 20% lower baseline premiums and contract certainty.\n- **Jaguar Transit**: Promote our flat-rate declaration structure to diamond/watch merchants tired of Brink's SGD 350 minimum per-pickup fee.\n\n### 2. 🛡️ Product & Policy Coverage Counter-Actions\n- **Waiver of Grade IV Safe Mandates**: Where Chubb enforces expensive safe upgrades, offer Jade coverage with existing Grade III safes supported by approved CCTV telematics.\n- **Contract Certainty vs Discretionary Mutual**: Launch educational messaging emphasizing that DoctorShield is a regulated, legally enforceable insurance contract under Lloyd's coverholders, unlike MPS mutual protection.\n\n### 3. ⚔️ Sales Team Battlecard & Lead Outreach Strategy\n- Equip sales reps with direct objection-handling scripts: 'When your MPS renewal arrives with an inflation increase, let us benchmark your coverage under DoctorShield before you pay.'\n- Cross-reference Module 1 jewellery leads approaching Q2 renewal cycles with Chubb comparison figures.\n\n### 4. 📢 Marketing & Campaign Positioning\n- Launch LinkedIn thought leadership highlighting: *'Why InsurTech is beating legacy paper proposals in Singapore Jewellers Block'*. Feature Alan Tham (Chief Insurance Officer) commentary.`,
      source_count: 6,
      model: 'Groq (Llama-3/Compound)',
      status: 'published',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_shifts_analyzed: 2,
      changes_analyzed: [
        {
          competitor: 'Chubb Fine Art & Specie',
          change_type: 'coverage_update',
          severity: 'critical',
          title: 'Safe Warranty Mandate Upgraded to Grade V',
          description: 'Incumbent underwriter mandated Grade V safes for commercial jewelers with stock exceeding SGD 500,000.',
          detected_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        }
      ],
      lead_signals_analyzed: [
        {
          company: 'Orchard Gem Vault Pte Ltd',
          industry: 'jewellery',
          fit_score: 92,
          recommended_brand: 'jade',
          why_now: 'Opening second flagship boutique in Marina Bay; seeking flexible safe endorsements.',
        }
      ],
      pricing_strategy_points: [
        "Jade: Undercut Chubb's high minimum premium (SGD 4,500+) with SGD 2,800 entry tier and zero deductible.",
        "DoctorShield: Target aesthetic practitioners facing MPS's 14% subscription hike with guaranteed 20% lower baseline premiums.",
        "Jaguar Transit: Promote flat-rate declaration structure against Brink's high minimum per-pickup fee."
      ],
      underwriting_tweaks: [
        "Waiver of Grade IV Safe Mandates: Offer Jade coverage with existing Grade III safes with approved CCTV telematics.",
        "Contract Certainty vs Discretionary Mutual: Emphasize DoctorShield regulated, legally enforceable policy under Lloyd's coverholders."
      ],
      battlecard_updates: [
        "Equip sales reps with objection-handling: 'When your MPS renewal arrives, benchmark under DoctorShield before you pay.'",
        "Cross-reference Module 1 jewellery leads approaching Q2 renewal cycles with Chubb comparison figures."
      ],
      marketing_campaign_ideas: [
        "Launch LinkedIn thought leadership: 'Why InsurTech is beating legacy paper proposals in Singapore Jewellers Block'.",
        "Targeted DoctorShield campaigns emphasizing contract certainty and statutory protection in Singapore."
      ]
    };

    inMemoryDigests.unshift(mockGenerated);

    return safeFetch<ExecutiveDigest>(
      `${API_BASE_URL}/digests/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      mockGenerated
    );
  },

  // ----------------- Phase 4: Email / Outreach Automation API -----------------
  generateOutreachCadence: async (leadId: number): Promise<OutreachMessage> => {
    const fallback: OutreachMessage = {
      id: Date.now(),
      lead_id: leadId,
      channel: 'email',
      direction: 'outbound',
      provider: 'mock',
      subject: `JA Assure: Underwriting Context for Lead #${leadId}`,
      body: `Hello,\n\nJA Assure provides Lloyd's of London coverholder terms with digital quote-to-bind speed.\n\nBest regards,\nJA Assure`,
      status: 'pending_approval',
      sequence_step: 1,
      sequence_touches: [
        {
          step: 1,
          day: 'Day 0',
          label: 'Initial Intro & Niche Hook',
          subject: `JA Assure: Underwriting Context for Lead #${leadId}`,
          body: `Hello,\n\nJA Assure provides Lloyd's of London coverholder terms with digital quote-to-bind speed.\n\nBest regards,\nJA Assure`,
        },
        {
          step: 2,
          day: 'Day 4',
          label: 'Competitive Advantage & Warranty Comparison',
          subject: `Follow-up: Lloyd's underwriting terms`,
          body: `Hello,\n\nFollowing up on our earlier note.\n\nBest regards,\nJA Assure`,
        },
        {
          step: 3,
          day: 'Day 9',
          label: 'Executive Consultation & Wrap-up',
          subject: `Final note regarding coverage options`,
          body: `Hello,\n\nShould your policy renewal considerations change later this year, our Lloyd's coverholder team remains at your disposal.\n\nBest regards,\nJA Assure`,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return safeFetch<OutreachMessage>(
      `${API_BASE_URL}/outreach/${leadId}/generate`,
      { method: 'POST' },
      fallback
    );
  },

  approveOutreach: async (messageId: number, actor: string = 'human_reviewer', notes?: string): Promise<OutreachMessage> => {
    const fallback: OutreachMessage = {
      id: messageId,
      lead_id: 1,
      channel: 'email',
      direction: 'outbound',
      provider: 'mock',
      subject: 'Approved Outreach',
      body: 'Content',
      status: 'approved',
      sequence_step: 1,
      sequence_touches: [],
      approved_by: actor,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return safeFetch<OutreachMessage>(
      `${API_BASE_URL}/outreach/${messageId}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, notes }),
      },
      fallback
    );
  },

  sendOutreach: async (messageId: number, dryRun: boolean = false): Promise<{ sent: boolean; provider_message_id?: string; reason?: string }> => {
    const fallback = {
      sent: !dryRun,
      provider_message_id: dryRun ? undefined : `mock-msg-${messageId}`,
      reason: dryRun ? 'dry-run' : undefined,
    };
    return safeFetch<{ sent: boolean; provider_message_id?: string; reason?: string }>(
      `${API_BASE_URL}/outreach/${messageId}/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun }),
      },
      fallback
    );
  },

  getLeadMessages: async (leadId: number): Promise<OutreachMessage[]> => {
    return safeFetch<OutreachMessage[]>(
      `${API_BASE_URL}/outreach/${leadId}/messages`,
      {},
      []
    );
  },

  simulateInboundReply: async (leadId: number, message: string, sender?: string): Promise<ReplyClassification> => {
    const fallback: ReplyClassification = {
      intent: 'positive',
      confidence: 0.85,
      suggested_action: 'Human follow-up recommended.',
      lead_status: 'replied',
      message_id: Date.now(),
    };
    return safeFetch<ReplyClassification>(
      `${API_BASE_URL}/outreach/replies/simulate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, message, sender }),
      },
      fallback
    );
  },

  listSuppression: async (): Promise<SuppressionEntry[]> => {
    return safeFetch<SuppressionEntry[]>(
      `${API_BASE_URL}/outreach/suppression`,
      {},
      []
    );
  },

  addSuppression: async (email: string, reason: string = 'opted_out', source: string = 'manual'): Promise<SuppressionEntry> => {
    const fallback: SuppressionEntry = {
      id: Date.now(),
      email,
      normalized_email: email.trim().toLowerCase(),
      reason,
      source,
      created_at: new Date().toISOString(),
    };
    return safeFetch<SuppressionEntry>(
      `${API_BASE_URL}/outreach/suppression`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason, source }),
      },
      fallback
    );
  },

  removeSuppression: async (email: string): Promise<{ email: string; removed: boolean }> => {
    return safeFetch<{ email: string; removed: boolean }>(
      `${API_BASE_URL}/outreach/suppression/${encodeURIComponent(email)}`,
      { method: 'DELETE' },
      { email, removed: true }
    );
  },

  getProviderStatus: async (): Promise<ProviderStatus> => {
    const fallback: ProviderStatus = {
      provider: 'mock',
      mode: 'mock',
      healthy: true,
      detail: 'Mock provider active. External email dispatch disabled.',
      real_email_enabled: false,
      real_provider_send: false,
      smtp_configured: false,
      gmail_oauth_boundary: true,
    };
    return safeFetch<ProviderStatus>(
      `${API_BASE_URL}/outreach/provider-status`,
      {},
      fallback
    );
  },

  listCampaigns: async (): Promise<Campaign[]> => {
    return safeFetch<Campaign[]>(
      `${API_BASE_URL}/campaigns`,
      {},
      []
    );
  },

  createCampaign: async (payload: Partial<Campaign>): Promise<Campaign> => {
    const fallback: Campaign = {
      id: Date.now(),
      name: payload.name || 'New Campaign',
      brand: payload.brand || 'jade',
      target_industry: payload.target_industry || 'jewellery',
      market: payload.market || 'Singapore',
      target_count: payload.target_count || 20,
      minimum_score: payload.minimum_score || 60,
      status: 'active',
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return safeFetch<Campaign>(
      `${API_BASE_URL}/campaigns`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      fallback
    );
  },

  pauseCampaign: async (id: number): Promise<Campaign> => {
    return safeFetch<Campaign>(
      `${API_BASE_URL}/campaigns/${id}/pause`,
      { method: 'POST' },
      {
        id,
        name: 'Campaign',
        brand: 'jade',
        target_industry: 'jewellery',
        market: 'Singapore',
        target_count: 20,
        minimum_score: 60,
        status: 'paused',
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  },

  resumeCampaign: async (id: number): Promise<Campaign> => {
    return safeFetch<Campaign>(
      `${API_BASE_URL}/campaigns/${id}/resume`,
      { method: 'POST' },
      {
        id,
        name: 'Campaign',
        brand: 'jade',
        target_industry: 'jewellery',
        market: 'Singapore',
        target_count: 20,
        minimum_score: 60,
        status: 'active',
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  },

  getCampaignMetrics: async (id: number): Promise<any> => {
    return safeFetch<any>(
      `${API_BASE_URL}/campaigns/${id}/metrics`,
      {},
      {
        campaign_id: id,
        name: 'Campaign',
        brand: 'jade',
        status: 'active',
        target_count: 20,
        leads_discovered: 0,
        messages_drafted: 0,
        messages_approved: 0,
        messages_sent: 0,
        replies_received: 0,
      }
    );
  }
};
