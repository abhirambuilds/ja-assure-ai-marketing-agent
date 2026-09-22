import type { 
  ContentQueueItem, 
  Competitor, 
  Lead, 
  Feedback, 
  LessonLearned, 
  DashboardSummary, 
  HealthCheckResponse, 
  PublishingRecord
} from '../types';

export const mockHealth: HealthCheckResponse = {
  status: 'ok',
  app_name: 'JA Assure AI Marketing Engine',
  environment: 'production',
  database: 'connected',
  database_type: 'PostgreSQL',
  llm_provider: 'Groq',
  llm_model: 'llama-3.3-70b-versatile',
  llm_mode: 'live (Groq LLaMA 3.3)',
  supported_brands: ['jade', 'doctorshield', 'jaguartransit']
};

export const mockSummary: DashboardSummary = {
  total_content: 16,
  pending_compliance: 1,
  pending_human_review: 3,
  compliance_approved: 12,
  human_approved: 11,
  approved: 11,
  rejected: 2,
  edited: 3,
  published: 7,
  approval_rate: 84.6,
  rejection_rate: 15.4,
  average_compliance_score: 91.2,
  average_lead_score: 86.5,
  active_lessons_count: 6,
  total_lessons_learned: 8,
  total_leads: 18,
  total_feedback_count: 5,
  regeneration_count: 2,
  brand_breakdown: {
    jade: 7,
    doctorshield: 5,
    jaguartransit: 4
  },
  status_breakdown: {
    pending: 1,
    human_review: 3,
    approved: 6,
    scheduled: 2,
    published: 7,
    rejected: 2
  },
  platform_breakdown: {
    linkedin: 7,
    instagram: 4,
    reel: 3,
    blog: 2
  },
  language_breakdown: {
    en: 10,
    ms: 3,
    id: 2,
    zh: 1
  },
  compliance_score_distribution: {
    '90_100': 10,
    '80_89': 4,
    '<80': 2
  },
  lead_score_distribution: {
    'tier_1_high': 10,
    'tier_2_moderate': 6,
    'tier_3_emerging': 2
  },
  feedback_reason_frequency: {
    false_guarantee: 2,
    missing_disclaimer: 2,
    unsupported_claim: 1
  }
};

export const mockQueue: ContentQueueItem[] = [
  {
    id: 101,
    brand: 'jade',
    platform: 'linkedin',
    content_type: 'thought_leadership',
    topic: 'Why Home Insurance Sub-Limits Fail Luxury Jewellery Collections',
    content_raw: `Standard homeowner policies typically cap individual jewellery item claims at S$2,500 to S$5,000—a severe blind spot for bespoke private collectors holding high-carat diamonds and rare jadeite pieces.\n\nJA Assure Jade provides agreed-value underwriting with certified gemological appraisals, ensuring complete preservation without depreciation clawbacks or territorial exclusions across Singapore and international travel.\n\nDisclaimer: Insurance products are subject to underwriting criteria and policy terms. JA Assure is a Lloyd's Coverholder licensed under the Monetary Authority of Singapore (MAS).`,
    variation: 'A',
    language: 'en',
    compliance_status: 'passed',
    status: 'human_review',
    compliance_score: 94,
    metadata_json: JSON.stringify({
      compliance_status: 'PASS',
      compliance_jurisdiction: 'SG / MAS',
      compliance_product: 'Jade Private Jewellery',
      compliance_disclaimer_status: 'Compliant Disclaimer Present',
      compliance_violations: [],
      claims_analyzed: [
        { claim_text: 'Agreed-value underwriting with certified gemological appraisals', risk_level: 'low', claim_type: 'feature' },
        { claim_text: 'Preservation without depreciation clawbacks', risk_level: 'low', claim_type: 'benefit' }
      ]
    }),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 102,
    brand: 'doctorshield',
    platform: 'linkedin',
    content_type: 'advisory',
    topic: 'Mitigating SMC Regulatory Inquiries in Aesthetic Surgery Practices',
    content_raw: `Aesthetic practitioners in Singapore face increasing complexity navigating Singapore Medical Council (SMC) disciplinary hearings and patient consent disputes.\n\nDoctorShield provides proactive medico-legal defense representation, covering investigation inquiry legal costs up to S$5M with panel counsel specialized in medical jurisprudence.\n\nImportant Note: Coverage is strictly indemnity-based for legal costs and liability awards. DoctorShield does not provide clinical or diagnostic advice. Regulated under MAS guidelines.`,
    variation: 'A',
    language: 'en',
    compliance_status: 'passed',
    status: 'human_review',
    compliance_score: 88,
    metadata_json: JSON.stringify({
      compliance_status: 'PASS',
      compliance_jurisdiction: 'SG / MOH & MAS',
      compliance_product: 'DoctorShield Medical Indemnity',
      compliance_disclaimer_status: 'Medical Disclaimer Verified',
      compliance_violations: [],
      claims_analyzed: [
        { claim_text: 'Legal costs up to S$5M with panel counsel', risk_level: 'low', claim_type: 'coverage_limit' }
      ]
    }),
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 103,
    brand: 'jaguartransit',
    platform: 'linkedin',
    content_type: 'case_study',
    topic: 'Armored Vault-to-Aircraft Custody Protocols for High-Value Cargo',
    content_raw: `When transporting high-value gems and bullion through Changi Airport and regional hubs, generic marine cargo coverage creates fatal gaps during tarmac transfer.\n\nJaguar Transit integrates real-time GPS tamper sensors with Lloyd's-backed chain-of-custody liability, protecting high-risk shipments from origin vault to consignee delivery.\n\nSubject to carrier security standards and policy terms. Lloyd's Coverholder insurance.',`,
    variation: 'B',
    language: 'en',
    compliance_status: 'passed',
    status: 'human_review',
    compliance_score: 92,
    metadata_json: JSON.stringify({
      compliance_status: 'PASS',
      compliance_jurisdiction: 'SG & Regional Transit',
      compliance_product: 'Jaguar Transit Cargo',
      compliance_disclaimer_status: 'Standard Intermediary Notice',
      compliance_violations: []
    }),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 104,
    brand: 'jade',
    platform: 'instagram',
    content_type: 'carousel',
    topic: '3 Hidden Vulnerabilities in Safe Deposit Box Storage',
    content_raw: `Did you know bank safe deposit boxes do not insure the contents inside? If fire, water damage, or robbery strikes, the bank holds zero liability for your family heirlooms.\n\nProtect your legacy with JA Assure Jade: Agreed-value private collection insurance with global transit protection.\n\nTerms and conditions apply. Lloyd's Coverholder JA Assure.`,
    variation: 'A',
    language: 'en',
    compliance_status: 'passed',
    status: 'approved',
    compliance_score: 96,
    metadata_json: JSON.stringify({
      compliance_status: 'PASS',
      compliance_jurisdiction: 'SG / MAS',
      compliance_violations: []
    }),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 105,
    brand: 'doctorshield',
    platform: 'blog',
    content_type: 'newsletter',
    topic: 'Telemedicine Malpractice Risk: Cross-Border Jurisdictional Pitfalls',
    content_raw: `As virtual consultations expand across Southeast Asia, practicing across borders exposes doctors to local medical board sanctions outside Singapore.\n\nDoctorShield offers multi-jurisdictional defense extension riders for telemedicine practitioners licensed in Singapore.\n\nDisclaimer: Policy subject to territorial limits. Consult policy schedule for terms.`,
    variation: 'B',
    language: 'en',
    compliance_status: 'passed',
    status: 'scheduled',
    compliance_score: 91,
    metadata_json: JSON.stringify({
      compliance_status: 'PASS',
      compliance_jurisdiction: 'SG / MAS',
      compliance_violations: []
    }),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockCompetitors: Competitor[] = [
  {
    id: 1,
    name: 'Chubb Masterpiece',
    url: 'https://chubb.com/masterpiece',
    category: 'luxury_jewellery',
    title: 'High Net Worth Personal Lines Insurance',
    summary: 'Offers blanket jewelry coverage with itemized schedules. However, enforces stringent domestic safe installation mandates and regional valuation appraisal caps.',
    detected_change: 'Recently tightened appraisal re-certification window from 3 years to 18 months.',
    actionable_recommendation: 'Position JA Assure Jade as more collector-friendly with 3-year appraisal lock and seamless worldwide exhibition riders.',
    relevance: 0.95,
    source: 'Verified Industry Intel',
    source_type: 'VERIFIED',
    collected_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 2,
    name: 'MPS (Medical Protection Society)',
    url: 'https://medicalprotection.org/singapore',
    category: 'medical_indemnity',
    title: 'Mutual Medical Indemnity Organization',
    summary: 'Discretionary mutual defense rather than contractually guaranteed insurance policy. Can deny representation at board discretion without legal appeal recourse.',
    detected_change: 'Raised annual subscription fees for private orthopedic and plastic surgeons by 14%.',
    actionable_recommendation: 'Emphasize DoctorShield as guaranteed underwritten insurance with Lloyd\'s backing rather than discretionary mutual assistance.',
    relevance: 0.92,
    source: 'Verified Industry Intel',
    source_type: 'VERIFIED',
    collected_at: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 3,
    name: 'BriteProtect Commercial Transit',
    url: 'https://briteprotect.example.com',
    category: 'cargo_transit',
    title: 'Regional Logistics Risk Underwriters',
    summary: 'Specializes in general electronic cargo freight, but strictly excludes unescorted gem parcels exceeding S$500,000.',
    detected_change: 'Added exclusion clause for multi-modal port transshipments.',
    actionable_recommendation: 'Directly target diamond dealers and logistics intermediaries with Jaguar Transit\'s high-limit custody riders.',
    relevance: 0.88,
    source: 'Competitor Scrape',
    source_type: 'AI_ANALYSIS',
    collected_at: new Date(Date.now() - 3600000 * 30).toISOString()
  }
];

export const mockLeads: Lead[] = [
  {
    id: 201,
    name: 'Marcus Tan',
    company: 'De Gem Private Jewellers Pte Ltd',
    industry: 'High-End Diamond & Jadeite Retailer',
    email: 'marcus@degem.example.com',
    location: 'Singapore (Orchard Road)',
    company_size: '25-50 staff',
    fit_score: 94,
    qualification_reason: 'Carries high-value inventory exceeding S$12M with frequent overseas VIP private viewing consignments.',
    recommended_brand: 'jade',
    outreach_draft: `Dear Marcus,\n\nI noticed De Gem\'s exceptional high-carat heritage collection showcased at the recent Singapore Jewellery Expo. When transporting multi-million dollar gemstone parcels to private client viewings, standard domestic policies frequently enforce restrictive warranty conditions.\n\nJA Assure Jade offers Lloyd\'s-backed agreed-value vault and transit underwriting tailored specifically for bespoke Singapore jewellers.\n\nWould you be open to a brief 10-minute confidential discussion on how our agreed-value certificates eliminate appraisal clawbacks?\n\nWarm regards,\nJA Assure Private Risk Advisory`,
    source: 'Underwriter Prospecting Engine',
    source_type: 'AI_GENERATED',
    status: 'qualified',
    created_at: new Date().toISOString()
  },
  {
    id: 202,
    name: 'Dr. Evelyn Lim',
    company: 'Novena Aesthetic & Plastic Surgery Clinic',
    industry: 'Specialist Surgical Practice',
    email: 'evelyn@novena-aesthetics.example.com',
    location: 'Singapore (Novena Medical Center)',
    company_size: '10-20 staff',
    fit_score: 91,
    qualification_reason: 'High-volume aesthetic procedures with growing international medical tourism clientele requiring robust cross-border medico-legal defense.',
    recommended_brand: 'doctorshield',
    outreach_draft: `Dear Dr. Lim,\n\nWith aesthetic surgery disputes and patient consent inquiries increasing across the region, having contractual—rather than discretionary—indemnity coverage is critical for specialist practices.\n\nDoctorShield provides Singapore-licensed practitioners with contractually guaranteed defense representation backed by Lloyd\'s of London, including up to S$5M in inquiry and defense costs.\n\nI would welcome the opportunity to share our comparative guide on discretionary mutuals vs. guaranteed insurance.\n\nBest regards,\nDoctorShield Medical Risk Team`,
    source: 'Underwriter Prospecting Engine',
    source_type: 'AI_GENERATED',
    status: 'qualified',
    created_at: new Date().toISOString()
  },
  {
    id: 203,
    name: 'Richard Goh',
    company: 'Malca-Amit Singapore Logistics',
    industry: 'High-Risk Secure Freight & Vault Services',
    email: 'richard@malca-amit.example.com',
    location: 'Singapore (Changi Free Trade Zone)',
    company_size: '100+ staff',
    fit_score: 88,
    qualification_reason: 'Handles high-value transit shipments between Singapore, Hong Kong, and Geneva requiring continuous telematics insurance validation.',
    recommended_brand: 'jaguartransit',
    outreach_draft: `Dear Richard,\n\nManaging secure tarmac and air transfers for high-value gems and bullion demands zero-gap liability coverage. Jaguar Transit offers insured tamper telematics with instantaneous Lloyd\'s claims validation.\n\nLet\'s connect to explore how we can integrate seamless cover for your regional transit lanes.\n\nRegards,\nJaguar Transit Underwriting`,
    source: 'Underwriter Prospecting Engine',
    source_type: 'AI_GENERATED',
    status: 'qualified',
    created_at: new Date().toISOString()
  }
];

export const mockLessons: LessonLearned[] = [
  {
    id: 1,
    category: 'superlatives_and_guarantees',
    lesson: 'Strictly avoid words like "100% guaranteed payout", "zero risk", or "best insurer in Singapore" to comply with MAS Notice 124.',
    examples: 'Prohibited: "We guarantee 100% claim payout in 24 hours". Required: "Agreed-value settlements subject to certified gemological verification".',
    frequency: 9,
    active: true,
    created_at: '2026-09-18T10:00:00Z',
    updated_at: '2026-09-21T14:30:00Z'
  },
  {
    id: 2,
    category: 'statutory_disclaimers',
    lesson: 'All external communications must state that JA Assure is a registered Lloyd\'s Coverholder and policy issuance is subject to underwriting criteria.',
    examples: 'Always append: "JA Assure is a Lloyd\'s Coverholder. Terms and conditions apply."',
    frequency: 7,
    active: true,
    created_at: '2026-09-18T10:30:00Z',
    updated_at: '2026-09-21T15:00:00Z'
  },
  {
    id: 3,
    category: 'medical_advice_prohibition',
    lesson: 'DoctorShield content must never provide clinical diagnostic advice or promise malpractice inquiry dismissal certainty.',
    examples: 'Prohibited: "Our defense guarantees SMC dismissal". Required: "Provides comprehensive legal representation for inquiry defense".',
    frequency: 5,
    active: true,
    created_at: '2026-09-19T09:00:00Z',
    updated_at: '2026-09-21T11:20:00Z'
  },
  {
    id: 4,
    category: 'luxury_brand_tone',
    lesson: 'Maintain a discreet, consultative tone for Jade Jewellery insurance avoiding aggressive retail sales urgency.',
    examples: 'Avoid "Buy now before discount ends". Prefer "Ensure heirloom preservation through bespoke private valuation".',
    frequency: 4,
    active: true,
    created_at: '2026-09-19T14:00:00Z',
    updated_at: '2026-09-21T16:45:00Z'
  },
  {
    id: 5,
    category: 'regional_localization',
    lesson: 'When localizing for Malaysia (BNM) or Indonesia (OJK), reference appropriate local regulatory frameworks and licensed intermediary partners.',
    examples: 'Reference BNM Guidelines for Malaysian medical indemnity communications.',
    frequency: 3,
    active: true,
    created_at: '2026-09-20T08:15:00Z',
    updated_at: '2026-09-21T12:00:00Z'
  },
  {
    id: 6,
    category: 'cargo_chain_of_custody',
    lesson: 'Highlight GPS tamper sensor integration and port-to-port liability transfer protocols when addressing logistics operators.',
    examples: 'Detail physical handoff checkpoints in Changi Free Trade Zone.',
    frequency: 3,
    active: true,
    created_at: '2026-09-20T11:40:00Z',
    updated_at: '2026-09-21T13:10:00Z'
  }
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 1,
    content_id: 88,
    reason_tag: 'false_guarantee',
    notes: 'Draft claimed "zero deductible on every lost gem". This violates our underwriting guidelines and MAS Notice 124.',
    original_content: 'With JA Assure Jade, you enjoy zero deductible and 100% guaranteed replacement on every lost gem.',
    corrected_content: 'With JA Assure Jade, claims are settled on an agreed-value basis verified by certified gemological appraisals.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 2,
    content_id: 89,
    reason_tag: 'missing_disclaimer',
    notes: 'Missing required Lloyd\'s Coverholder statutory advisory notice at bottom of LinkedIn draft.',
    original_content: 'DoctorShield covers up to S$5M in malpractice defense costs for private clinics.',
    corrected_content: 'DoctorShield covers up to S$5M in malpractice defense costs for private clinics. JA Assure is a Lloyd\'s Coverholder licensed under MAS regulations.',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString()
  }
];

export const mockPublishingRecords: PublishingRecord[] = [
  {
    id: 501,
    content_id: 104,
    platform: 'instagram',
    scheduled_at: new Date(Date.now() + 3600000 * 18).toISOString(),
    status: 'scheduled',
    created_at: new Date().toISOString()
  },
  {
    id: 502,
    content_id: 105,
    platform: 'email',
    scheduled_at: new Date(Date.now() + 3600000 * 36).toISOString(),
    status: 'scheduled',
    created_at: new Date().toISOString()
  }
];
