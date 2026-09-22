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
  setActiveTab: (tab: 'dashboard' | 'studio' | 'review' | 'competitors' | 'leads' | 'digest' | 'learning' | 'analytics') => void;
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
      {/* 1. EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Pipeline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{totalContent}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Total drafted items</p>
          </div>
        </div>

        {/* KPI 2: Pending Review */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-[11px] font-semibold uppercase tracking-wider">
            <span>Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-800">{pendingReview}</div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Awaiting human sign-off</p>
          </div>
        </div>

        {/* KPI 3: Approval Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Approval Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700">{approvalRate}%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Human pass rate</p>
          </div>
        </div>

        {/* KPI 4: Compliance Index */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Compliance</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-800">{summary.average_compliance_score}%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">MAS / MOH safety index</p>
          </div>
        </div>

        {/* KPI 5: Active Lessons */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>Memory Rules</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-900">
              {summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active prompt rules</p>
          </div>
        </div>

        {/* KPI 6: B2B Leads */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
            <span>B2B Prospects</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{summary.total_leads}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Avg fit: {summary.average_lead_score}%</p>
          </div>
        </div>
      </div>

      {/* 3. WORKFLOW PIPELINE VISUALIZER */}
      <WorkflowVisualizer 
        pendingCount={pendingReview}
        complianceAvg={summary.average_compliance_score}
        activeLessons={summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
        totalGenerated={totalContent}
      />

      {/* 4. TWO COLUMN OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Content Review Items */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Active Content Review Queue
              </h3>
              <p className="text-xs text-slate-500">Items requiring human sign-off before simulated dispatch</p>
            </div>
            <button
              onClick={() => setActiveTab('review')}
              className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              Open Review Center ({pendingReview}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-medium text-slate-700">Your content queue is completely clear.</p>
              <p>All items have been approved or dispatched.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingItems.slice(0, 3).map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getBrandBadge(item.brand)}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                        {item.platform}
                      </span>
                      <span className="text-[10px] text-slate-400">#{item.id}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="font-semibold text-xs text-slate-900 truncate">{item.topic}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{item.content_raw}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.compliance_score >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      item.compliance_score >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {item.compliance_score}%
                    </span>
                    <button
                      onClick={() => setActiveTab('review')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
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
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                Active Prompt Memory Rules
              </h3>
              <button 
                onClick={() => setActiveTab('learning')}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {activeLessons.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">No active lessons recorded yet.</div>
              ) : (
                activeLessons.map((l) => (
                  <div key={l.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-indigo-700 uppercase">
                        {l.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-500 font-medium">Triggered {l.frequency}x</span>
                    </div>
                    <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">{l.lesson}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations Launchers */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Quick Operations</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('studio')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold">Draft New Content Campaign</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('competitors')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold">Scrape Competitor Intelligence</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-800 transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('leads')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold">Discover High-Fit B2B Leads</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-700 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
