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
  FileText
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
  VideoScript 
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

  // Scraper Form
  const [scrapeUrlInput, setScrapeUrlInput] = useState<string>('https://briteprotect.example.com');
  const [scrapeResult, setScrapeResult] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s, q, c, l, les, fb] = await Promise.all([
        api.getHealth(),
        api.getDashboardSummary(),
        api.getQueue({ brand: selectedBrand !== 'all' ? selectedBrand : undefined }),
        api.getCompetitors(),
        api.getLeads(),
        api.getLessons(),
        api.getFeedback()
      ]);
      setHealth(h);
      setSummary(s);
      setQueue(q);
      setCompetitors(c);
      setLeads(l);
      setLessons(les);
      setFeedbacks(fb);
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

  // Competitor Scraper
  const handleScrape = async () => {
    setActionLoading('scraping');
    try {
      const res = await api.scrapeUrl(scrapeUrlInput);
      setScrapeResult(res);
      showToast('🔍 Competitor website metadata extracted!');
      fetchAllData();
    } catch (err: any) {
      alert(`Scraping error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
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
    if (reviewFilter === 'approved') return item.status === 'approved' || item.status === 'published';
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
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Video / Reels Storyboard</span>
                      <h3 className="text-base font-bold text-slate-100">{videoScript.concept}</h3>
                      <p className="text-xs text-slate-400">Target Duration: {videoScript.target_duration_seconds}s • Tone: {videoScript.voiceover_tone}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                      {videoScript.media_status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {videoScript.scenes.map(scene => (
                      <div key={scene.scene_number} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-400 font-mono">
                          <span className="font-semibold text-slate-200">Scene {scene.scene_number}</span>
                          <span>{scene.duration_seconds} seconds</span>
                        </div>
                        <p><strong className="text-slate-400">Visual:</strong> {scene.visual_description}</p>
                        <p><strong className="text-slate-400">Voiceover:</strong> "{scene.voiceover}"</p>
                        <p className="text-cyan-300 font-mono"><strong className="text-slate-400">On-Screen:</strong> [{scene.onscreen_text}]</p>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {videoScript.disclaimer}
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
                        {/* Auto Compliance Rewrite */}
                        {item.compliance_score < 85 && (
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

                        {/* Regenerate with lessons */}
                        <button
                          onClick={() => handleRegenerate(item.id)}
                          disabled={actionLoading === `regen-${item.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() => handleOpenReject(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject & Learn
                        </button>

                        {/* Approve */}
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoading === `approve-${item.id}`}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
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
            {/* Live Scraper Bar */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                Live Competitor Scraper & Change Extractor
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-2">
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium whitespace-nowrap shadow-sm"
                >
                  {actionLoading === 'scraping' ? 'Analyzing...' : 'Scrape & Extract'}
                </button>
              </div>

              {scrapeResult && (
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-cyan-300">Scraped: {scrapeResult.title}</p>
                  <p className="text-slate-400">{scrapeResult.meta_description || scrapeResult.extracted_sample?.slice(0, 200)}</p>
                </div>
              )}
            </div>

            {/* Competitor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitors.map(c => (
                <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-mono capitalize">{c.category}</span>
                      <span className="text-xs text-amber-400 font-mono">Relevance: {(c.relevance * 100).toFixed(0)}%</span>
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-300 font-medium">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.summary}</p>
                    {c.detected_change && (
                      <div className="bg-slate-900/70 p-2 rounded-lg text-xs text-cyan-300 border border-slate-800">
                        <strong>Detected Shift:</strong> {c.detected_change}
                      </div>
                    )}
                  </div>

                  {c.actionable_recommendation && (
                    <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40 text-xs text-emerald-300">
                      <strong>JA Assure Opportunity:</strong> {c.actionable_recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. LEADS VIEW */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-100 text-sm">B2B Insurance Prospects</h2>
                <p className="text-xs text-slate-400">Scored on 5-factor model: Industry Fit, Geo Relevance, Company Profile, Product Need</p>
              </div>
              <button
                onClick={async () => {
                  setActionLoading('discovering');
                  await api.discoverLeads({});
                  showToast('Lead discovery pipeline refreshed!');
                  fetchAllData();
                  setActionLoading(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'discovering' ? 'animate-spin' : ''}`} />
                Run Lead Discovery
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {leads.map(lead => (
                <div key={lead.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{lead.name}</h4>
                        <p className="text-xs text-slate-400">{lead.company} • {lead.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-cyan-400">{lead.fit_score}%</div>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Fit Score</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{lead.industry}</span>
                      {lead.recommended_brand && getBrandBadge(lead.recommended_brand)}
                    </div>

                    {lead.qualification_reason && (
                      <p className="text-xs text-slate-400 italic">
                        <strong>Rationale:</strong> {lead.qualification_reason}
                      </p>
                    )}

                    {lead.outreach_draft && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold">Personalized Outreach Draft:</span>
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
        {activeTab === 'analytics' && summary && (
          <div className="space-y-6">
            <h2 className="font-semibold text-slate-100 text-sm">System Analytics & Closed-Loop Performance</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Human Approval Rate</span>
                <div className="text-2xl font-bold text-emerald-400 mt-2">
                  {summary.total_content > 0 ? ((summary.human_approved / summary.total_content) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Editorial Rejection Rate</span>
                <div className="text-2xl font-bold text-rose-400 mt-2">{summary.rejection_rate}%</div>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Avg Lead Fit Score</span>
                <div className="text-2xl font-bold text-cyan-300 mt-2">{summary.average_lead_score}%</div>
              </div>
              <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400">Regeneration Cycles</span>
                <div className="text-2xl font-bold text-purple-300 mt-2">{summary.regeneration_count}</div>
              </div>
            </div>

            {/* Breakdown Charts / Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Content by Brand</h3>
                <div className="space-y-3">
                  {Object.entries(summary.brand_breakdown).map(([brand, count]) => (
                    <div key={brand} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300 capitalize">
                        <span>{brand}</span>
                        <span className="font-mono">{count} items</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, (count / summary.total_content) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Top Feedback Rejection Reasons</h3>
                <div className="space-y-3">
                  {Object.entries(summary.feedback_reason_frequency).map(([reason, count]) => (
                    <div key={reason} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="capitalize">{reason.replace('_', ' ')}</span>
                        <span className="font-mono text-rose-300">{count} times</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, count * 25)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        JA Assure AI Marketing Agent Prototype • Multi-Brand InsurTech Governance Platform
      </footer>
    </div>
  );
}

export default App;
