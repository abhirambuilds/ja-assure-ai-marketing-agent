import React from 'react';
import { 
  Layers, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  Wand2, 
  Search, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import type { DashboardSummary, ContentQueueItem, LessonLearned } from '../../types';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  queue: ContentQueueItem[];
  lessons: LessonLearned[];
  setActiveTab: (tab: 'dashboard' | 'studio' | 'review' | 'competitors' | 'leads' | 'learning' | 'analytics') => void;
  getBrandBadge: (brand: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  queue,
  lessons,
  setActiveTab,
  getBrandBadge,
  getStatusBadge
}) => {
  if (!summary) return null;

  const totalContent = summary.total_content || 0;
  const pendingReview = summary.pending_human_review || 0;
  const humanApproved = summary.human_approved || summary.approved || 0;
  const approvalRate = summary.approval_rate !== undefined 
    ? summary.approval_rate 
    : (totalContent > 0 ? Number(((humanApproved / totalContent) * 100).toFixed(1)) : 0);

  const pendingItems = queue.filter(q => q.status === 'human_review' || q.status === 'pending');
  const activeLessons = lessons.filter(l => l.active).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Pipeline */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>Pipeline</span>
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">{totalContent}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Total drafted items</p>
          </div>
        </div>

        {/* KPI 2: Pending Human Review */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-900/40 bg-amber-950/10 hover:border-amber-700/50 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>Pending Review</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300">{pendingReview}</div>
            <p className="text-[10px] text-amber-200/70 mt-0.5">Awaiting human sign-off</p>
          </div>
        </div>

        {/* KPI 3: Approval Rate */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>Approval Rate</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-400">{approvalRate}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Human pass rate</p>
          </div>
        </div>

        {/* KPI 4: Compliance Index */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>Compliance</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-cyan-400">{summary.average_compliance_score}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">MAS / MOH safety index</p>
          </div>
        </div>

        {/* KPI 5: Active Lessons */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>AI Lessons</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <BrainCircuit className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-purple-300">
              {summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Active prompt rules</p>
          </div>
        </div>

        {/* KPI 6: B2B Leads */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono font-semibold tracking-wider uppercase">
            <span>B2B Leads</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-indigo-300">{summary.total_leads}</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Avg fit: {summary.average_lead_score}%</p>
          </div>
        </div>
      </div>

      {/* Prominent Core Differentiator: 7-Stage Closed-Loop Workflow */}
      <WorkflowVisualizer 
        pendingCount={pendingReview}
        complianceAvg={summary.average_compliance_score}
        activeLessons={summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
        totalGenerated={totalContent}
      />

      {/* Two Column Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Content Review Items */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Active Content Review Queue
              </h3>
              <p className="text-xs text-slate-400">Items requiring human sign-off before simulated dispatch</p>
            </div>
            <button
              onClick={() => setActiveTab('review')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              Open Review Center ({pendingReview}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto opacity-70" />
              <p className="font-medium text-slate-400">Your content queue is completely clear.</p>
              <p>All items have been approved or dispatched.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {pendingItems.slice(0, 3).map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/30 px-2 rounded-xl transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getBrandBadge(item.brand)}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                        {item.platform}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">#{item.id}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="font-semibold text-xs text-slate-200 truncate">{item.topic}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">{item.content_raw}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={`text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full ${
                      item.compliance_score >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      item.compliance_score >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {item.compliance_score}%
                    </span>
                    <button
                      onClick={() => setActiveTab('review')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Audit Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): AI Intelligence & Shortcuts */}
        <div className="space-y-6">
          {/* Active Lessons Spotlight */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Active Prompt Memory Rules
              </h3>
              <button 
                onClick={() => setActiveTab('learning')}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-mono cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {activeLessons.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">No active lessons recorded yet.</div>
              ) : (
                activeLessons.map((l) => (
                  <div key={l.id} className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-semibold text-purple-400 uppercase">
                        {l.category.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-cyan-400">Triggered {l.frequency}x</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-sans">{l.lesson}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Action Launchers */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Quick Operations</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('studio')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-cyan-400 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Draft New Content Campaign</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('competitors')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Scrape Competitor Intelligence</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Discover High-Fit B2B Leads</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
