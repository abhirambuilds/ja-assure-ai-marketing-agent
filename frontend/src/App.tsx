import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Users, 
  AlertCircle, 
  RefreshCw,
  Check,
  X,
  Sparkles,
  Search,
  Copy,
  Sliders,
  Send,
  Wand2,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  FileText,
  Calendar,
  PieChart,
  BarChart3,
  Info
} from 'lucide-react';
import { api } from './services/api';
import type { 
  DashboardSummary, 
  ContentQueueItem, 
  HealthCheckResponse, 
  Competitor, 
  Lead, 
  LessonLearned, 
  Feedback,
  GeneratedVariation,
  VideoScript,
  PublishingRecord
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'review' | 'competitors' | 'leads' | 'learning' | 'analytics'>('dashboard');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  
  // Data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [queue, setQueue] = useState<ContentQueueItem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [publishingRecords, setPublishingRecords] = useState<PublishingRecord[]>([]);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Studio Form states
  const [studioBrand, setStudioBrand] = useState<'jade' | 'doctorshield' | 'jaguartransit'>('jade');
  const [studioPlatform, setStudioPlatform] = useState<string>('linkedin');
  const [studioLanguage, setStudioLanguage] = useState<string>('en');
  const [studioTopic, setStudioTopic] = useState<string>('Why Home Insurance Sub-Limits Fail Luxury Diamond Collections');
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);

  // Review & Modals
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModalItem, setRejectModalItem] = useState<ContentQueueItem | null>(null);
  const [rejectReasonTag, setRejectReasonTag] = useState<string>('false_guarantee');
  const [rejectNotes, setRejectNotes] = useState<string>('');
  
  const [editModalItem, setEditModalItem] = useState<ContentQueueItem | null>(null);
  const [editContentText, setEditContentText] = useState<string>('');

  // Publishing Preview Modal states
  const [publishingModalItem, setPublishingModalItem] = useState<ContentQueueItem | null>(null);
  const [scheduledPlatform, setScheduledPlatform] = useState<string>('linkedin');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  // Scraper & Competitor Form
  const [scrapeUrlInput, setScrapeUrlInput] = useState<string>('https://briteprotect.example.com');
  const [scrapeBrand, setScrapeBrand] = useState<'jade' | 'doctorshield' | 'jaguartransit'>('jade');
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  // Lead Discovery Filters & Enrichment
  const [leadCountry, setLeadCountry] = useState<string>('Singapore');
  const [leadBrand, setLeadBrand] = useState<string>('jade');
  const [leadIndustry, setLeadIndustry] = useState<string>('');
  const [enrichModalLead, setEnrichModalLead] = useState<Lead | null>(null);
  const [enrichUrlInput, setEnrichUrlInput] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s, q, c, l, les, fb, pubs] = await Promise.all([
        api.getHealth(),
        api.getDashboardSummary(),
        api.getQueue({ brand: selectedBrand !== 'all' ? selectedBrand : undefined }),
        api.getCompetitors(),
        api.getLeads(),
        api.getLessons(),
        api.getFeedback(),
        api.getPublishingRecords()
      ]);
      setHealth(h);
      setSummary(s);
      setQueue(q);
      setCompetitors(c);
      setLeads(l);
      setLessons(les);
      setFeedbacks(fb);
      setPublishingRecords(pubs);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend server at http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedBrand]);

  // Review Actions
  const handleApprove = async (id: number) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.approveContent(id, 'Human reviewer sign-off confirmed.');
      showToast('✓ Content approved and ready for publishing queue!');
      fetchAllData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (item: ContentQueueItem) => {
    setRejectModalItem(item);
    setRejectReasonTag(item.reason_tag || 'false_guarantee');
    setRejectNotes('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    setActionLoading(`reject-${rejectModalItem.id}`);
    try {
      await api.rejectContent(rejectModalItem.id, rejectReasonTag, rejectNotes || 'Rejected by reviewer');
      showToast('✕ Content rejected. Closed-loop lesson created & injected for future generations!');
      setRejectModalItem(null);
      fetchAllData();
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = (item: ContentQueueItem) => {
    setEditModalItem(item);
    setEditContentText(item.content_raw);
  };

  const handleConfirmEdit = async () => {
    if (!editModalItem) return;
    setActionLoading(`edit-${editModalItem.id}`);
    try {
      await api.editContent(editModalItem.id, editContentText, 'human_edit', 'Verified and corrected during human review');
      showToast('✓ Content updated, approved, and revision feedback recorded!');
      setEditModalItem(null);
      fetchAllData();
    } catch (err: any) {
      alert(`Edit error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRewrite = async (id: number) => {
    setActionLoading(`rewrite-${id}`);
    try {
      await api.rewriteContent(id);
      showToast('✨ AI Compliance Rewrite applied. Item re-evaluated and awaiting human sign-off!');
      fetchAllData();
    } catch (err: any) {
      alert(`Rewrite error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async (id: number) => {
    setActionLoading(`regen-${id}`);
    try {
      await api.regenerateContent(id);
      showToast('🔄 Content regenerated applying active lessons learned!');
      fetchAllData();
    } catch (err: any) {
      alert(`Regeneration error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Publishing Preview Handlers (Human-controlled simulated dispatch)
  const handleOpenScheduleModal = (item: ContentQueueItem) => {
    if (item.status !== 'approved' && item.status !== 'scheduled') {
      alert('Only human-approved content can reach simulated publishing dispatch preview.');
      return;
    }
    if (item.compliance_score < 80) {
      alert(`Cannot schedule non-compliant content (Score: ${item.compliance_score}/100).`);
      return;
    }
    setPublishingModalItem(item);
    setScheduledPlatform(item.platform || 'linkedin');
    
    // Default scheduled time: tomorrow at 09:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledTime(localIso);
  };

  const handleConfirmSchedule = async () => {
    if (!publishingModalItem) return;
    setActionLoading(`schedule-${publishingModalItem.id}`);
    try {
      await api.schedulePublishing({
        content_id: publishingModalItem.id,
        platform: scheduledPlatform,
        scheduled_at: scheduledTime ? new Date(scheduledTime).toISOString() : undefined
      });
      showToast(`✓ Simulated dispatch scheduled for ${scheduledPlatform.toUpperCase()}! Stored in SQLite.`);
      setPublishingModalItem(null);
      fetchAllData();
    } catch (err: any) {
      alert(`Scheduling error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPublishing = async (recordId: number) => {
    setActionLoading(`cancel-pub-${recordId}`);
    try {
      await api.cancelPublishing(recordId);
      showToast('Scheduled dispatch cancelled. Content item returned to approved pool.');
      fetchAllData();
    } catch (err: any) {
      alert(`Cancel error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Studio Generation
  const handleGenerateVariations = async () => {
    setActionLoading('generating');
    setGeneratedVariations([]);
    setVideoScript(null);
    try {
      if (studioPlatform === 'reel' || studioPlatform === 'video') {
        const script = await api.generateVideoScript({
          brand: studioBrand,
          topic: studioTopic,
          platform: studioPlatform,
          language: studioLanguage,
          target_duration: 45
        });
        setVideoScript(script);
        showToast('🎬 Structured 45s Video/Reels Storyboard generated!');
      } else {
        const vars = await api.generateVariations({
          brand: studioBrand,
          platform: studioPlatform,
          topic: studioTopic,
          language: studioLanguage
        });
        setGeneratedVariations(vars);
        showToast('✓ A/B marketing copy variations generated!');
      }
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLaunchFullSuite = async () => {
    setActionLoading('suite');
    try {
      const created = await api.generateSuite({
        brand: studioBrand,
        topic: studioTopic,
        platforms: ['linkedin', 'instagram'],
        content_types: ['post'],
        languages: [studioLanguage]
      });
      showToast(`🚀 Full Pipeline Suite executed! ${created.length} drafts staged for Human Review.`);
      fetchAllData();
      setActiveTab('review');
    } catch (err: any) {
      alert(`Suite error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Competitor Analysis & Scraper
  const handleScrape = async () => {
    if (!scrapeUrlInput) return;
    setActionLoading('scraping');
    try {
      const comp = await api.analyzeCompetitorUrl(scrapeUrlInput, scrapeBrand);
      setScrapeResult(comp);
      showToast(`✓ Analyzed competitor & extracted strategic intelligence: ${comp.name}`);
      fetchAllData();
    } catch (err: any) {
      alert(`Scraping / Analysis error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscoverLeadsWithFilters = async () => {
    setActionLoading('discovering');
    try {
      const prospects = await api.discoverLeads({
        brand: leadBrand !== 'all' ? leadBrand : undefined,
        country: leadCountry !== 'all' ? leadCountry : undefined,
        industry: leadIndustry || undefined
      });
      showToast(`✓ Discovered & scored ${prospects.length} B2B prospects!`);
      fetchAllData();
    } catch (err: any) {
      alert(`Discovery failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnrichLead = async () => {
    if (!enrichModalLead) return;
    setActionLoading(`enrich-${enrichModalLead.id}`);
    try {
      const enriched = await api.enrichLead(enrichModalLead.id, enrichUrlInput || undefined);
      showToast(`✓ Enriched risk profile & outreach for ${enriched.company}!`);
      setEnrichModalLead(null);
      setEnrichUrlInput('');
      fetchAllData();
    } catch (err: any) {
      alert(`Enrichment error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getSourceTypeBadge = (source?: string, sourceType?: string) => {
    const s = (sourceType || source || '').toUpperCase();
    if (s.includes('VERIFIED')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED SOURCE
        </span>
      );
    }
    if (s.includes('ANALYSIS')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/40 flex items-center gap-1">
          <BrainCircuit className="w-3 h-3 text-cyan-400" /> AI ANALYSIS
        </span>
      );
    }
    if (s.includes('PROSPECT') || s.includes('AI_GENERATED')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> AI-GENERATED PROSPECT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
        DEMO DATA
      </span>
    );
  };

  const getBrandBadge = (brand: string) => {
    switch (brand) {
      case 'jade':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Jade (Jewellery)</span>;
      case 'doctorshield':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">DoctorShield (Med Indemnity)</span>;
      case 'jaguartransit':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Jaguar Transit (Cargo)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300">{brand}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'scheduled':
        return <span className="inline-flex items-center gap-1 text-xs text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30"><Calendar className="w-3 h-3 text-cyan-400" /> Scheduled (Simulated)</span>;
      case 'published':
        return <span className="inline-flex items-center gap-1 text-xs text-blue-300 font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30"><Send className="w-3 h-3 text-blue-400" /> Dispatched (Simulated)</span>;
      case 'human_review':
        return <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium"><Clock className="w-3.5 h-3.5" /> Awaiting Review</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium"><Clock className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  const filteredQueue = queue.filter(item => {
    if (reviewFilter === 'pending') return item.status === 'human_review' || item.status === 'pending';
    if (reviewFilter === 'approved') return item.status === 'approved' || item.status === 'scheduled' || item.status === 'published';
    if (reviewFilter === 'rejected') return item.status === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce border border-blue-400/40">
          <Sparkles className="w-5 h-5 text-cyan-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-lg">
              JA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight text-white">JA Assure</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-500/30 font-mono font-semibold">
                  AI Marketing Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Multi-Brand Pipeline & Closed-Loop Compliance Gate</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Health pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-300 font-mono">
                {health ? `Backend: Online (${health.llm_mode})` : 'Connecting...'}
              </span>
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Brands</option>
                <option value="jade" className="bg-slate-900">Jade (Jewellery)</option>
                <option value="doctorshield" className="bg-slate-900">DoctorShield (Medical)</option>
                <option value="jaguartransit" className="bg-slate-900">Jaguar Transit (Cargo)</option>
              </select>
            </div>

            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'studio', label: 'Content Studio', icon: Wand2 },
            { id: 'review', label: `Review Center (${queue.filter(q => q.status === 'human_review' || q.status === 'pending').length})`, icon: ShieldCheck },
            { id: 'competitors', label: 'Competitor Intel', icon: Search },
            { id: 'leads', label: 'B2B Leads', icon: Users },
            { id: 'learning', label: 'Closed-Loop Learning', icon: BrainCircuit },
            { id: 'analytics', label: 'Analytics', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">Connection Error</p>
              <p className="text-rose-300/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && summary && (
          <div className="space-y-6">
            {/* Autonomous Closed-Loop Architecture Banner */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/40 via-slate-900/70 to-indigo-950/40 shadow-lg space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                      Autonomous Multi-Brand Governance Architecture
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        Human-in-the-Loop Enforced
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Strict regulatory compliance with closed-loop rule synthesis across Jade, DoctorShield & Jaguar Transit
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 6-Stage Process Flow */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">1. Research</span>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Competitor & Market Signals</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-semibold">2. Generate</span>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Multi-Platform AI Drafts</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">3. Comply</span>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Automated MAS & MOH Gate</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-800/40 bg-amber-950/10 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">4. Human Review</span>
                  <p className="text-[11px] text-amber-200 mt-1 font-medium">Mandatory Sign-off Gate</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">5. Learn</span>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Rejections Synthesize Rules</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-teal-400 uppercase font-semibold">6. Improve</span>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">Prompts Adapt Automatically</p>
                </div>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  <span>Queue Pipeline</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-white">{summary.total_content}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span className="text-amber-400 font-semibold">{summary.pending_human_review}</span> awaiting review
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  <span>Compliance Index</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-emerald-400">{summary.average_compliance_score}%</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Automated regulatory gate score
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  <span>Rejection Rate</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-rose-300">{summary.rejection_rate}%</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Triggers closed-loop learning
                  </div>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold tracking-wider uppercase">
                  <span>Active Lessons</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-purple-300">{summary.total_lessons_learned}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Rules steering future AI copy
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Queue Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-100 text-sm">Active Content Review Items</h2>
                    <p className="text-xs text-slate-400">Items requiring human sign-off before publishing</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('review')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {queue.slice(0, 3).map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getBrandBadge(item.brand)}
                          <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">{item.platform}</span>
                          <span className="text-xs font-mono text-emerald-400">{item.compliance_score}%</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium line-clamp-1">{item.topic}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="font-semibold text-slate-100 text-sm">Autonomous Closed-Loop Flow</h2>
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">1</span>
                    <span><strong>Research Agent</strong> scrapes competitor moves & market sub-limits.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">2</span>
                    <span><strong>Content Agent</strong> drafts variations injecting active <em>Lessons Learned</em>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold shrink-0">3</span>
                    <span><strong>Compliance Gate</strong> audits for insurance regulations (MAS/BNM/OIC).</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono font-bold shrink-0">4</span>
                    <span><strong>Human Review</strong> is mandatory. Rejections extract new guidelines.</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 hover:opacity-95 transition-opacity"
                >
                  Launch Content Studio →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTENT STUDIO VIEW */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Studio Controls */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-blue-400" />
                Campaign Brief Configurator
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Brand Persona</label>
                  <select
                    value={studioBrand}
                    onChange={(e) => setStudioBrand(e.target.value as any)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="jade">Jade (Luxury Jewellery & Watches)</option>
                    <option value="doctorshield">DoctorShield (Medical Indemnity)</option>
                    <option value="jaguartransit">Jaguar Transit (High-Value Cargo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium">Channel / Format</label>
                  <select
                    value={studioPlatform}
                    onChange={(e) => setStudioPlatform(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="linkedin">LinkedIn Post (Thought Leadership)</option>
                    <option value="instagram">Instagram Carousel / Caption</option>
                    <option value="blog">Blog Article (Long-form Educational)</option>
                    <option value="x">X / Twitter (Punchy Hook)</option>
                    <option value="reel">Video / Reels Storyboard (30-60s)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium">Target Localization</label>
                  <select
                    value={studioLanguage}
                    onChange={(e) => setStudioLanguage(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="en">English (SG / International)</option>
                    <option value="ms">Bahasa Melayu (Malaysia)</option>
                    <option value="id">Bahasa Indonesia</option>
                    <option value="th">Thai (ภาษาไทย)</option>
                    <option value="zh">Chinese (Simplified / 简体中文)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium">Campaign Topic & Focus</label>
                  <textarea
                    rows={3}
                    value={studioTopic}
                    onChange={(e) => setStudioTopic(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter campaign focus or insurance problem..."
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleGenerateVariations}
                    disabled={actionLoading === 'generating'}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {actionLoading === 'generating' ? 'Generating AI Variations...' : 'Generate A/B Variations'}
                  </button>

                  <button
                    onClick={handleLaunchFullSuite}
                    disabled={actionLoading === 'suite'}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    Execute Full Brain Pipeline Suite
                  </button>
                </div>
              </div>
            </div>

            {/* Studio Output Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video Script Display if Reel */}
              {videoScript && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">AI Video / Reels Storyboard</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {videoScript.media_status === 'ai_storyboard_generated' ? 'AI Generated Storyboard' : videoScript.media_status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-100">{videoScript.title || videoScript.concept}</h3>
                      <p className="text-xs text-slate-400">
                        Target Duration: <span className="text-slate-200 font-medium">{videoScript.target_duration_seconds}s</span> • 
                        Platform: <span className="text-slate-200 font-medium">{videoScript.target_platform || studioPlatform}</span> • 
                        Tone: <span className="text-slate-200 font-medium">{videoScript.voiceover_tone}</span>
                      </p>
                    </div>
                  </div>

                  {videoScript.hook && (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-xs text-cyan-200">
                      <span className="font-semibold text-cyan-400 font-mono uppercase tracking-wide mr-2">Opening Hook:</span>
                      "{videoScript.hook}"
                    </div>
                  )}

                  <div className="space-y-3">
                    {videoScript.scenes.map(scene => (
                      <div key={scene.scene_number} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400 font-mono">
                          <span className="font-semibold text-slate-200">Scene {scene.scene_number}</span>
                          <span className="text-cyan-400 font-mono">{scene.duration_seconds}s</span>
                        </div>
                        <p><strong className="text-slate-400">Visual:</strong> {scene.visual_description}</p>
                        <p><strong className="text-slate-400">Voiceover:</strong> "{scene.voiceover}"</p>
                        <p className="text-cyan-300 font-mono"><strong className="text-slate-400">On-Screen Text:</strong> [{scene.onscreen_text}]</p>
                        {scene.transition && (
                          <p className="text-slate-400 font-mono text-[11px]"><strong className="text-slate-500">Transition:</strong> {scene.transition}</p>
                        )}
                        {scene.compliance_disclaimer && (
                          <p className="text-amber-400/90 text-[11px] bg-amber-950/20 px-2 py-1 rounded border border-amber-800/30">
                            <strong>Compliance Note:</strong> {scene.compliance_disclaimer}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                    <p>{videoScript.disclaimer}</p>
                    <p className="text-[10px] text-slate-500 font-mono not-italic">
                      ℹ️ Production cue sheet & AI storyboard format. Actual video rendering is not executed.
                    </p>
                  </div>
                </div>
              )}

              {/* Standard Variations Display */}
              {generatedVariations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-slate-200">AI Generated A/B Variations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedVariations.map(v => (
                      <div key={v.variation_label} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Variation {v.variation_label} ({v.variation_label === 'A' ? 'Emotional/Trust' : 'Data/ROI'})
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(v.content_text);
                                showToast('Copied to clipboard!');
                              }}
                              className="text-slate-400 hover:text-white"
                              title="Copy Copy"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {v.headline && <h4 className="font-semibold text-slate-200 text-xs">{v.headline}</h4>}
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 font-sans">
                            {v.content_text}
                          </p>
                        </div>
                        {v.hashtags.length > 0 && (
                          <div className="text-[11px] text-cyan-400 font-mono">
                            {v.hashtags.join(' ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedVariations.length === 0 && !videoScript && (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                  <Wand2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-300">Ready to Draft Content</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Select your brand persona, format, and campaign topic on the left. Variations will automatically inject active Lessons Learned and relevant competitor context.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. REVIEW CENTER VIEW */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            {/* Filter Sub-nav */}
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <button
                onClick={() => setReviewFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reviewFilter === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Awaiting Human Review ({queue.filter(q => q.status === 'human_review' || q.status === 'pending').length})
              </button>
              <button
                onClick={() => setReviewFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reviewFilter === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Approved Content ({queue.filter(q => q.status === 'approved' || q.status === 'published').length})
              </button>
              <button
                onClick={() => setReviewFilter('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  reviewFilter === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rejected / Feedback Queue ({queue.filter(q => q.status === 'rejected').length})
              </button>
            </div>

            {/* Queue Cards */}
            <div className="space-y-4">
              {filteredQueue.length === 0 ? (
                <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                  No items currently in this review queue.
                </div>
              ) : (
                filteredQueue.map(item => (
                  <div key={item.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {getBrandBadge(item.brand)}
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 capitalize font-mono">{item.platform}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-800/60 text-slate-400 uppercase font-mono">Var {item.variation} • {item.language}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">Compliance Score:</span>
                        <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                          item.compliance_score >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          item.compliance_score >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {item.compliance_score}%
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{item.topic}</h4>
                      <p className="text-xs text-slate-300 mt-2 bg-slate-900/70 p-4 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed font-sans">
                        {item.content_raw}
                      </p>
                    </div>

                    {item.notes && (
                      <div className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-2">
                        <span className="font-semibold text-slate-300 not-italic">Reviewer / Audit Notes:</span>
                        <span>{item.notes}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Item ID: #{item.id} • Created {new Date(item.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* If item is Approved or Scheduled: Show Schedule Preview */}
                        {(item.status === 'approved' || item.status === 'scheduled') && (
                          <button
                            onClick={() => handleOpenScheduleModal(item)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {item.status === 'scheduled' ? 'Reschedule Preview' : 'Schedule Dispatch Preview'}
                          </button>
                        )}

                        {/* Auto Compliance Rewrite - only for pending review with low score */}
                        {(item.status === 'human_review' || item.status === 'pending') && item.compliance_score < 85 && (
                          <button
                            onClick={() => handleRewrite(item.id)}
                            disabled={actionLoading === `rewrite-${item.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" /> AI Rewrite Fix
                          </button>
                        )}

                        {/* Edit in place */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Edit Copy
                        </button>

                        {/* Regenerate with lessons (for pending or rejected items) */}
                        {(item.status === 'human_review' || item.status === 'pending' || item.status === 'rejected') && (
                          <button
                            onClick={() => handleRegenerate(item.id)}
                            disabled={actionLoading === `regen-${item.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                          </button>
                        )}

                        {/* Reject & Learn - only for items pending review */}
                        {(item.status === 'human_review' || item.status === 'pending') && (
                          <button
                            onClick={() => handleOpenReject(item)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject & Learn
                          </button>
                        )}

                        {/* Approve - only for items pending review */}
                        {(item.status === 'human_review' || item.status === 'pending') && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === `approve-${item.id}`}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. COMPETITOR INTEL VIEW */}
        {activeTab === 'competitors' && (
          <div className="space-y-6">
            {/* Live Scraper & Competitor Analysis Bar */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Live Competitor Scraper & Intelligence Extractor
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Enforces 8s timeout • 512KB payload limits • Counter-positioning whitespace
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={scrapeBrand}
                  onChange={(e: any) => setScrapeBrand(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 w-full sm:w-44"
                >
                  <option value="jade">Jade (Jewellery)</option>
                  <option value="doctorshield">DoctorShield (Med Indemnity)</option>
                  <option value="jaguartransit">Jaguar Transit (Cargo)</option>
                </select>

                <input
                  type="text"
                  value={scrapeUrlInput}
                  onChange={(e) => setScrapeUrlInput(e.target.value)}
                  placeholder="https://competitor.com/product"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 w-full"
                />

                <button
                  onClick={handleScrape}
                  disabled={actionLoading === 'scraping'}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium whitespace-nowrap shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {actionLoading === 'scraping' ? 'Analyzing Competitor...' : 'Scrape & Analyze URL'}
                </button>
              </div>

              {scrapeResult && (
                <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Analyzed: {scrapeResult.title || scrapeResult.name}
                    </span>
                    {getSourceTypeBadge(scrapeResult.source, scrapeResult.source_type || 'VERIFIED_SOURCE')}
                  </div>
                  <p className="text-slate-300">{scrapeResult.meta_description || scrapeResult.summary}</p>
                  {scrapeResult.actionable_recommendation && (
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/50 text-emerald-300">
                      <strong>Whitespace / Counter-Positioning Opportunity:</strong> {scrapeResult.actionable_recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Competitor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map(c => (
                <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-mono capitalize">{c.category}</span>
                      {getSourceTypeBadge(c.source, c.source_type)}
                      <span className="text-xs text-cyan-400 font-mono">Confidence: {(c.relevance * 100).toFixed(0)}%</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:underline break-all"
                        >
                          {c.url}
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-medium">{c.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{c.summary}</p>

                    {c.detected_change && (
                      <div className="bg-slate-900/70 p-2.5 rounded-lg text-xs text-cyan-300 border border-slate-800 space-y-0.5">
                        <strong className="text-slate-400 uppercase text-[10px] tracking-wider block">Observed Positioning & Claims:</strong>
                        <p>{c.detected_change}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {c.actionable_recommendation && (
                      <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40 text-xs text-emerald-300 space-y-1">
                        <strong className="text-emerald-400 uppercase text-[10px] tracking-wider block">
                          Strategic Whitespace / Counter-Positioning:
                        </strong>
                        <p>{c.actionable_recommendation}</p>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Attribution: {c.source || 'DEMO_DATA'}</span>
                      <span>Researched: {new Date(c.collected_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. LEADS VIEW */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Discovery Control & Filter Bar */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    B2B Insurance Prospect Discovery & Transparent Scoring
                  </h2>
                  <p className="text-xs text-slate-400">
                    5-factor scoring model (Industry, Profile, Geo, Product, Need). AI prospects are strictly labeled.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-mono">Brand Facility</label>
                  <select
                    value={leadBrand}
                    onChange={(e) => setLeadBrand(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="jade">Jade (Jewellery)</option>
                    <option value="doctorshield">DoctorShield (Med Indemnity)</option>
                    <option value="jaguartransit">Jaguar Transit (Cargo)</option>
                    <option value="all">All Brands</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-mono">Jurisdiction / Country</label>
                  <select
                    value={leadCountry}
                    onChange={(e) => setLeadCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="Singapore">Singapore (MAS / SMC)</option>
                    <option value="Malaysia">Malaysia (BNM)</option>
                    <option value="Thailand">Thailand (OIC)</option>
                    <option value="Indonesia">Indonesia (OJK)</option>
                    <option value="all">All Regional Markets</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-mono">Industry Focus (Optional)</label>
                  <input
                    type="text"
                    value={leadIndustry}
                    onChange={(e) => setLeadIndustry(e.target.value)}
                    placeholder="e.g. Cosmetic Dermatology, Fine Diamonds"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDiscoverLeadsWithFilters}
                    disabled={actionLoading === 'discovering'}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${actionLoading === 'discovering' ? 'animate-spin' : ''}`} />
                    {actionLoading === 'discovering' ? 'Discovering Prospects...' : 'Discover & Score Leads'}
                  </button>
                </div>
              </div>
            </div>

            {/* Prospects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {leads.map(lead => (
                <div key={lead.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-100 text-sm">{lead.name}</h4>
                          {getSourceTypeBadge(lead.source, lead.source_type)}
                        </div>
                        <p className="text-xs text-slate-400">{lead.company} • {lead.location}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-xl font-bold font-mono text-cyan-400">{lead.fit_score}%</div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Fit Score</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{lead.industry}</span>
                      {lead.recommended_brand && getBrandBadge(lead.recommended_brand)}
                    </div>

                    {lead.qualification_reason && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                        <strong className="text-cyan-400 uppercase text-[10px] tracking-wider block">Qualification Rationale & Risk Exposure:</strong>
                        <p className="leading-relaxed">{lead.qualification_reason}</p>
                      </div>
                    )}

                    {lead.outreach_draft && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold">Contextual B2B Outreach:</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEnrichModalLead(lead);
                                setEnrichUrlInput('');
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" /> Enrich Lead
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lead.outreach_draft!);
                                showToast('Outreach draft copied to clipboard!');
                              }}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed font-sans">
                          {lead.outreach_draft}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CLOSED-LOOP LEARNING VIEW */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">Closed-Loop Learning Repository</h2>
              <p className="text-xs text-slate-400">When reviewers reject or edit content, guidelines are synthesized and automatically injected into subsequent AI generation cycles.</p>
            </div>

            {/* Active Lessons Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map(l => (
                <div key={l.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 capitalize">
                        {l.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-cyan-400">Triggered {l.frequency}x</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{l.lesson}</p>
                    {l.examples && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                        {l.examples}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    <span>Status: {l.active ? 'Active in Prompts' : 'Inactive'}</span>
                    <button
                      onClick={async () => {
                        await api.toggleLesson(l.id);
                        fetchAllData();
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback History Log */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
              <h3 className="font-semibold text-sm text-slate-200">Recent Human Review Feedback Log</h3>
              <div className="divide-y divide-slate-800">
                {feedbacks.map(f => (
                  <div key={f.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {f.reason_tag}
                      </span>
                      <span className="text-slate-500 font-mono">{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                    <p><strong className="text-slate-400">Reviewer Note:</strong> {f.notes}</p>
                    <p className="text-slate-400 font-mono text-[11px] line-clamp-1"><strong className="text-slate-500">Original:</strong> {f.original_content}</p>
                    {f.corrected_content && (
                      <p className="text-emerald-400 font-mono text-[11px] line-clamp-1"><strong className="text-emerald-500">Corrected:</strong> {f.corrected_content}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. ANALYTICS VIEW */}
        {activeTab === 'analytics' && summary && (() => {
          const tot = summary.total_content || 0;
          const appr = summary.human_approved || summary.approved || 0;
          const rej = summary.rejected || 0;
          const pend = summary.pending_human_review || 0;
          const approvalRate = summary.approval_rate !== undefined 
            ? summary.approval_rate 
            : (tot > 0 ? Number(((appr / tot) * 100).toFixed(1)) : 0);
          const rejectionRate = summary.rejection_rate !== undefined
            ? summary.rejection_rate
            : (tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0);
          const pendingRate = tot > 0 ? Number(((pend / tot) * 100).toFixed(1)) : 0;

          // Donut geometry: circle r=36, circumference = 2 * PI * 36 = 226.19
          const c = 226.19;
          const apprStroke = (approvalRate / 100) * c;
          const rejStroke = (rejectionRate / 100) * c;
          const pendStroke = (pendingRate / 100) * c;

          const compDist = summary.compliance_score_distribution || { '90_100': 0, '80_89': 0, '<80': 0 };
          const highComp = compDist['90_100'] || 0;
          const medComp = compDist['80_89'] || 0;
          const lowComp = compDist['<80'] || 0;
          const compTotal = Math.max(1, highComp + medComp + lowComp);

          const leadDist = summary.lead_score_distribution || { 'tier_1_high': 0, 'tier_2_moderate': 0, 'tier_3_emerging': 0 };
          const t1 = leadDist['tier_1_high'] || 0;
          const t2 = leadDist['tier_2_moderate'] || 0;
          const t3 = leadDist['tier_3_emerging'] || 0;
          const leadTotal = Math.max(1, t1 + t2 + t3);

          return (
            <div className="space-y-6">
              {/* Analytics Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    InsurTech Governance & Closed-Loop Analytics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time operational KPIs computed directly from SQLite database records
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit">
                  Live SQLite Sync Active
                </span>
              </div>

              {/* 10 Live KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Content Generated */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">1. Generated</span>
                  <div className="text-2xl font-bold text-white font-mono">{summary.total_content}</div>
                  <span className="text-[10px] text-slate-500">Drafted variations</span>
                </div>

                {/* 2. Pending Human Review */}
                <div className="glass-panel p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-amber-400 block">2. Awaiting Review</span>
                  <div className="text-2xl font-bold text-amber-300 font-mono">{summary.pending_human_review}</div>
                  <span className="text-[10px] text-amber-200/70">Requires sign-off</span>
                </div>

                {/* 3. Approved */}
                <div className="glass-panel p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/10 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-emerald-400 block">3. Human Approved</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">{appr}</div>
                  <span className="text-[10px] text-emerald-300/70">Verified & compliant</span>
                </div>

                {/* 4. Rejected */}
                <div className="glass-panel p-4 rounded-xl border border-rose-900/40 bg-rose-950/10 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-rose-400 block">4. Rejected</span>
                  <div className="text-2xl font-bold text-rose-400 font-mono">{rej}</div>
                  <span className="text-[10px] text-rose-300/70">Lessons synthesized</span>
                </div>

                {/* 5. Approval Rate */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">5. Approval Rate</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">{approvalRate}%</div>
                  <span className="text-[10px] text-slate-500">Editorial acceptance</span>
                </div>

                {/* 6. Rejection Rate */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">6. Rejection Rate</span>
                  <div className="text-2xl font-bold text-rose-400 font-mono">{rejectionRate}%</div>
                  <span className="text-[10px] text-slate-500">Feedback trigger rate</span>
                </div>

                {/* 7. Avg Compliance Score */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">7. Avg Compliance</span>
                  <div className="text-2xl font-bold text-cyan-400 font-mono">{summary.average_compliance_score}%</div>
                  <span className="text-[10px] text-slate-500">MAS / MOH safety score</span>
                </div>

                {/* 8. Avg Lead Fit Score */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">8. Avg Lead Fit</span>
                  <div className="text-2xl font-bold text-indigo-400 font-mono">{summary.average_lead_score}%</div>
                  <span className="text-[10px] text-slate-500">B2B buyer match</span>
                </div>

                {/* 9. Active Lessons */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">9. Active Lessons</span>
                  <div className="text-2xl font-bold text-purple-400 font-mono">
                    {summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
                  </div>
                  <span className="text-[10px] text-slate-500">Steering future prompts</span>
                </div>

                {/* 10. Feedback Volume */}
                <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">10. Feedback Volume</span>
                  <div className="text-2xl font-bold text-teal-400 font-mono">
                    {summary.total_feedback_count !== undefined ? summary.total_feedback_count : feedbacks.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Reviewer audits recorded</span>
                </div>
              </div>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual 1: Approval vs. Rejection Governance Distribution */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-emerald-400" />
                      Approval vs. Rejection Distribution
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">Total: {tot} Items</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                    {/* SVG Donut */}
                    <div className="relative w-36 h-36 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#1e293b"
                          strokeWidth="14"
                        />
                        {/* Approved segment */}
                        {tot > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="14"
                            strokeDasharray={`${apprStroke} ${c}`}
                            strokeDashoffset="0"
                            className="transition-all duration-500"
                          />
                        )}
                        {/* Rejected segment */}
                        {tot > 0 && rej > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke="#f43f5e"
                            strokeWidth="14"
                            strokeDasharray={`${rejStroke} ${c}`}
                            strokeDashoffset={String(-apprStroke)}
                            className="transition-all duration-500"
                          />
                        )}
                        {/* Pending segment */}
                        {tot > 0 && pend > 0 && (
                          <circle
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="14"
                            strokeDasharray={`${pendStroke} ${c}`}
                            strokeDashoffset={String(-(apprStroke + rejStroke))}
                            className="transition-all duration-500"
                          />
                        )}
                      </svg>
                      {/* Center label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold font-mono text-white">{approvalRate}%</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Pass Rate</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-2.5 w-full max-w-xs text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          Human Approved
                        </span>
                        <span className="font-mono font-semibold text-emerald-400">
                          {appr} ({approvalRate}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          Rejected & Learned
                        </span>
                        <span className="font-mono font-semibold text-rose-400">
                          {rej} ({rejectionRate}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="flex items-center gap-2 text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          Pending Human Review
                        </span>
                        <span className="font-mono font-semibold text-amber-400">
                          {pend} ({pendingRate}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual 2: Regulatory Compliance Health Bands */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      Regulatory Compliance Health Bands
                    </h3>
                    <span className="text-[11px] font-mono text-cyan-400">Avg {summary.average_compliance_score}%</span>
                  </div>

                  {/* Segmented Stacked Progress Bar */}
                  <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${(highComp / compTotal) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`90-100%: ${highComp}`}
                    />
                    <div
                      style={{ width: `${(medComp / compTotal) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title={`80-89%: ${medComp}`}
                    />
                    <div
                      style={{ width: `${(lowComp / compTotal) * 100}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`<80%: ${lowComp}`}
                    />
                  </div>

                  {/* Detail Band Cards */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 block">90 - 100%</span>
                      <div className="text-base font-bold text-emerald-300 font-mono">{highComp} items</div>
                      <span className="text-[10px] text-emerald-400/80">High Confidence</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-400 block">80 - 89%</span>
                      <div className="text-base font-bold text-amber-300 font-mono">{medComp} items</div>
                      <span className="text-[10px] text-amber-400/80">Compliant / Audit OK</span>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-rose-400 block">&lt; 80%</span>
                      <div className="text-base font-bold text-rose-300 font-mono">{lowComp} items</div>
                      <span className="text-[10px] text-rose-400/80">Rewrite Required</span>
                    </div>
                  </div>
                </div>

                {/* Visual 3: Content Production by Brand */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Content Production by Brand
                  </h3>

                  <div className="space-y-3 pt-1">
                    {Object.entries(summary.brand_breakdown).length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">No brand data recorded</div>
                    ) : (
                      Object.entries(summary.brand_breakdown).map(([brand, count]) => {
                        const pct = tot > 0 ? ((count / tot) * 100).toFixed(0) : 0;
                        const brandColor = 
                          brand === 'jade' ? 'bg-emerald-500' :
                          brand === 'doctorshield' ? 'bg-blue-500' :
                          brand === 'jaguartransit' ? 'bg-amber-500' : 'bg-cyan-500';
                        return (
                          <div key={brand} className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-300 font-medium">
                              <span className="capitalize">{brand === 'jaguartransit' ? 'Jaguar Transit' : brand === 'doctorshield' ? 'DoctorShield' : 'Jade'}</span>
                              <span className="font-mono text-slate-400">{count} items ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${brandColor} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Visual 4: Content by Target Platform */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Content by Target Platform
                  </h3>

                  <div className="space-y-3 pt-1">
                    {Object.entries(summary.platform_breakdown).length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">No platform data recorded</div>
                    ) : (
                      Object.entries(summary.platform_breakdown).map(([platform, count]) => {
                        const pct = tot > 0 ? ((count / tot) * 100).toFixed(0) : 0;
                        return (
                          <div key={platform} className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-300 font-medium">
                              <span className="capitalize">{platform}</span>
                              <span className="font-mono text-slate-400">{count} items ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Visual 5: Top Rejection Reasons */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    Top Rejection Reasons & Safety Blocks
                  </h3>

                  <div className="space-y-3 pt-1">
                    {Object.entries(summary.feedback_reason_frequency).length === 0 ? (
                      <div className="text-xs text-slate-500 py-4 text-center">No rejections recorded. 100% first-pass rate!</div>
                    ) : (
                      Object.entries(summary.feedback_reason_frequency).map(([reason, count]) => (
                        <div key={reason} className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span className="capitalize">{reason.replace(/_/g, ' ')}</span>
                            <span className="font-mono text-rose-300 font-semibold">{count} occurrences</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, count * 20)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Visual 6: B2B Lead Fit Score Tiers */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      B2B Lead Score Distribution
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-400">Avg {summary.average_lead_score}% Fit</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tier 1: High Intent (80 - 100%)</span>
                        <span className="font-mono text-emerald-400 font-semibold">{t1} leads</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(t1 / leadTotal) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tier 2: Moderate Intent (60 - 79%)</span>
                        <span className="font-mono text-cyan-400 font-semibold">{t2} leads</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(t2 / leadTotal) * 100}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tier 3: Emerging Incubator (&lt; 60%)</span>
                        <span className="font-mono text-slate-400 font-semibold">{t3} leads</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-slate-600 rounded-full transition-all" style={{ width: `${(t3 / leadTotal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual 7 (Full Width): Simulated Publishing Dispatch Activity Log */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      Simulated Publishing Dispatch Log (SQLite Records)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Human-approved content staged for simulated publishing. No live social API keys are triggered.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-blue-500/30 w-fit">
                    SIMULATED DISPATCH ONLY
                  </span>
                </div>

                {publishingRecords.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-400">No simulated dispatches scheduled yet.</p>
                    <p>Approve items in the Review Center and click "Schedule Dispatch Preview" to simulate posting.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800/80">
                        <tr>
                          <th className="py-2.5 px-3">Record ID</th>
                          <th className="py-2.5 px-3">Content ID</th>
                          <th className="py-2.5 px-3">Target Platform</th>
                          <th className="py-2.5 px-3">Scheduled At</th>
                          <th className="py-2.5 px-3">Dispatch Mode</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {publishingRecords.map(rec => (
                          <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-3 font-mono font-semibold text-slate-300">#{rec.id}</td>
                            <td className="py-3 px-3 font-mono text-cyan-400">Item #{rec.content_id}</td>
                            <td className="py-3 px-3 capitalize font-semibold text-slate-200">{rec.platform}</td>
                            <td className="py-3 px-3 text-slate-300 font-mono">
                              {rec.scheduled_at ? new Date(rec.scheduled_at).toLocaleString() : 'Immediate'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                                Simulated Preview
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                rec.status === 'scheduled' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                                rec.status === 'cancelled' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {rec.status === 'scheduled' ? (
                                <button
                                  onClick={() => handleCancelPublishing(rec.id)}
                                  disabled={actionLoading === `cancel-pub-${rec.id}`}
                                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
                                >
                                  Cancel Dispatch
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-600 font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* REJECTION / FEEDBACK MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject Content & Synthesize Lesson
              </h3>
              <button onClick={() => setRejectModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Rejections directly feed the closed-loop learning engine. Future content generated for this brand will strictly avoid this error.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Reason Category</label>
                <select
                  value={rejectReasonTag}
                  onChange={(e) => setRejectReasonTag(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="false_guarantee">False Guarantee (100% Payout / Zero Risk)</option>
                  <option value="unsupported_claim">Unsupported Coverage / Unlimited Claims</option>
                  <option value="missing_disclaimer">Missing Mandatory Disclaimer</option>
                  <option value="medical_advice">Medical Advice / Diagnostic Claim (DoctorShield)</option>
                  <option value="pricing_claim">Unsubstantiated Pricing Superlative</option>
                  <option value="competitor_comparison">Misleading Competitor Comparison</option>
                  <option value="too_salesy">Too Salesy / Aggressive Tone</option>
                  <option value="off_brand">Off-Brand Voice</option>
                  <option value="poor_localization">Poor Regional Localization</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Reviewer Guidance & Rule Note</label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why this was rejected so future AI prompts can adhere..."
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading?.startsWith('reject-')}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium"
              >
                Confirm Rejection & Learn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE EDIT MODAL */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" /> Edit & Approve Copy
              </h3>
              <button onClick={() => setEditModalItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-400 font-medium">Corrected Marketing Text</label>
              <textarea
                rows={8}
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 font-sans leading-relaxed focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalItem(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={actionLoading?.startsWith('edit-')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                Save & Approve Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD ENRICHMENT MODAL */}
      {enrichModalLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Enrich Lead: {enrichModalLead.company}
              </h3>
              <button onClick={() => setEnrichModalLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Provide an official company website URL to scrape verified offerings and risk factors, or leave blank to perform AI reasoning enrichment.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium">Company Website / Source URL (Optional)</label>
              <input
                type="text"
                value={enrichUrlInput}
                onChange={(e) => setEnrichUrlInput(e.target.value)}
                placeholder="https://company.com/about"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEnrichModalLead(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrichLead}
                disabled={actionLoading?.startsWith('enrich-')}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {actionLoading?.startsWith('enrich-') ? 'Enriching...' : 'Enrich Prospect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISHING PREVIEW MODAL (Human-Controlled Simulated Dispatch) */}
      {publishingModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Schedule Publishing Preview</h3>
                  <p className="text-[11px] text-slate-400">Human-governed dispatch simulation</p>
                </div>
              </div>
              <button
                onClick={() => setPublishingModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Dispatch Disclaimer Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">SIMULATED DISPATCH — No external post has been published.</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Strict governance enforced: only verified human-approved content can reach this staging queue. No live social media OAuth or external posting APIs are triggered.
                </p>
              </div>
            </div>

            {/* Governance Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Brand Persona</span>
                <div className="mt-1">{getBrandBadge(publishingModalItem.brand)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Compliance Score</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {publishingModalItem.compliance_score}% (PASSED)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Governance Gate</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                  Human Signed-Off
                </span>
              </div>
            </div>

            {/* Platform & Schedule Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block">Destination Platform</label>
                <select
                  value={scheduledPlatform}
                  onChange={(e) => setScheduledPlatform(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="linkedin">LinkedIn (Simulated Feed)</option>
                  <option value="instagram">Instagram (Simulated Feed)</option>
                  <option value="facebook">Facebook (Simulated Page)</option>
                  <option value="x">X / Twitter (Simulated Stream)</option>
                  <option value="email">Email Newsletter (Simulated Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Mock Destination Route */}
            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <span>Estimated Mock Dispatch Target:</span>
              <span className="text-cyan-400">api.dispatch.simulated/{scheduledPlatform}/v1/queue</span>
            </div>

            {/* Content Preview Box */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-400 font-medium">Draft Preview for Reviewer Verification</label>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono border-b border-slate-800/60 pb-2">
                  <span className="capitalize font-semibold text-slate-300">{scheduledPlatform} Post Preview</span>
                  <span>{publishingModalItem.language.toUpperCase()} • Item #{publishingModalItem.id}</span>
                </div>
                <h4 className="font-semibold text-slate-200 text-xs">{publishingModalItem.topic}</h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {publishingModalItem.content_raw}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => setPublishingModalItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={actionLoading?.startsWith('schedule-')}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                {actionLoading?.startsWith('schedule-') ? 'Scheduling Dispatch...' : 'Confirm Schedule Preview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        JA Assure AI Marketing Agent Prototype • Multi-Brand InsurTech Governance Platform
      </footer>
    </div>
  );
}

export default App;
