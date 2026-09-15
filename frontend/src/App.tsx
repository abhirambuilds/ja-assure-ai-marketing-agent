import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Users, 
  BookOpen, 
  AlertCircle, 
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { api } from './services/api';
import type { DashboardSummary, ContentQueueItem, HealthCheckResponse } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'leads' | 'lessons'>('overview');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [queue, setQueue] = useState<ContentQueueItem[]>([]);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, s, q] = await Promise.all([
        api.getHealth(),
        api.getDashboardSummary(),
        api.getQueue(selectedBrand !== 'all' ? { brand: selectedBrand } : undefined)
      ]);
      setHealth(h);
      setSummary(s);
      setQueue(q);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to backend server. Make sure the FastAPI server is running on http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBrand]);

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.reviewContent(id, action, { notes: `Human review: ${action}` });
      fetchData();
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    }
  };

  const getBrandBadge = (brand: string) => {
    switch (brand) {
      case 'jade':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Jade (Jewellery)</span>;
      case 'doctorshield':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">DoctorShield (Med Indemnity)</span>;
      case 'jaguartransit':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Jaguar Transit (Cargo)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300">{brand}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Approved</span>;
      case 'human_review':
        return <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock className="w-3.5 h-3.5" /> Human Review</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 text-xs text-rose-400"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              JA
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight flex items-center gap-2">
                JA Assure <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono font-medium">AI Marketing Agent</span>
              </h1>
              <p className="text-xs text-slate-400">Multi-Brand Autonomous Pipeline & Compliance Gate</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Health pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-slate-300">
                {health ? `Backend: Online (${health.llm_mode})` : 'Connecting...'}
              </span>
            </div>

            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-300">Backend Connection Warning</p>
              <p className="text-rose-300/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Brand Selector & Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'queue' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Content Queue ({queue.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Brand Filter:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Brands (Jade, DoctorShield, Jaguar)</option>
              <option value="jade">Jade (Jewellery)</option>
              <option value="doctorshield">DoctorShield (Med Indemnity)</option>
              <option value="jaguartransit">Jaguar Transit (Cargo)</option>
            </select>
          </div>
        </div>

        {/* Dashboard Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Queue Total</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-slate-100">{summary.total_content}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">{summary.pending_human_review}</span> pending human review
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Compliance Index</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-emerald-400">{summary.average_compliance_score}%</div>
                <div className="text-xs text-slate-400 mt-1">
                  Average automated compliance score
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">B2B Leads</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-cyan-300">{summary.total_leads}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Enriched & scored prospects
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Lessons</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-purple-300">{summary.total_lessons_learned}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Closed-loop learning feedback rules
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Queue Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-200">Multi-Channel Marketing Queue</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated pipeline drafts awaiting compliance & human governance</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {queue.length} items in pipeline
            </span>
          </div>

          <div className="divide-y divide-slate-800">
            {queue.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No content items found for this brand filter.
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-6 hover:bg-slate-900/40 transition-colors space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getBrandBadge(item.brand)}
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 capitalize font-mono">
                        {item.platform}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800/60 text-slate-400 uppercase font-mono">
                        Var {item.variation} • {item.content_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-slate-400">Compliance:</span>
                        <span className={`font-semibold ${
                          item.compliance_score >= 85 ? 'text-emerald-400' :
                          item.compliance_score >= 60 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {item.compliance_score}%
                        </span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-slate-200 text-sm">{item.topic}</h3>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line font-sans leading-relaxed">
                      {item.content_raw}
                    </p>
                  </div>

                  {item.notes && (
                    <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
                      <span className="font-medium text-slate-300">Review Notes:</span> {item.notes}
                    </div>
                  )}

                  {/* Actions for human review */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Created: {new Date(item.created_at).toLocaleString()}
                    </span>

                    {item.status === 'human_review' || item.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReview(item.id, 'approve')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReview(item.id, 'reject')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" /> Reject & Learn
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono italic">
                        State locked ({item.status})
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        JA Assure AI Marketing Agent Prototype • Prompt 1/10 Foundation Complete
      </footer>
    </div>
  );
}

export default App;
