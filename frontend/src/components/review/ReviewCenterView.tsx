import React from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Wand2, 
  FileText, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import type { ContentQueueItem } from '../../types';

interface ReviewCenterViewProps {
  queue: ContentQueueItem[];
  reviewFilter: 'pending' | 'approved' | 'rejected' | 'all';
  setReviewFilter: (filter: 'pending' | 'approved' | 'rejected' | 'all') => void;
  onApprove: (id: number) => void;
  onOpenReject: (item: ContentQueueItem) => void;
  onOpenEdit: (item: ContentQueueItem) => void;
  onRewrite: (id: number) => void;
  onRegenerate: (id: number) => void;
  onOpenScheduleModal: (item: ContentQueueItem) => void;
  actionLoading: string | null;
  getBrandBadge: (brand: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

export const ReviewCenterView: React.FC<ReviewCenterViewProps> = ({
  queue,
  reviewFilter,
  setReviewFilter,
  onApprove,
  onOpenReject,
  onOpenEdit,
  onRewrite,
  onRegenerate,
  onOpenScheduleModal,
  actionLoading,
  getBrandBadge,
  getStatusBadge
}) => {
  const pendingCount = queue.filter(q => q.status === 'human_review' || q.status === 'pending').length;
  const approvedCount = queue.filter(q => q.status === 'approved' || q.status === 'scheduled' || q.status === 'published').length;
  const rejectedCount = queue.filter(q => q.status === 'rejected').length;

  const filteredQueue = queue.filter(item => {
    if (reviewFilter === 'pending') return item.status === 'human_review' || item.status === 'pending';
    if (reviewFilter === 'approved') return item.status === 'approved' || item.status === 'scheduled' || item.status === 'published';
    if (reviewFilter === 'rejected') return item.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Compliance Control Room Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Human Governance & Editorial Gate
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict human approval required for every generated asset. Rejections synthesize permanent prompt guardrails.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setReviewFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
              reviewFilter === 'all' 
                ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({queue.length})
          </button>

          <button
            onClick={() => setReviewFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'pending' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10' 
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Review ({pendingCount})
          </button>

          <button
            onClick={() => setReviewFilter('approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'approved' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setReviewFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'rejected' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10' 
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Queue List Cards */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="glass-panel p-16 rounded-2xl border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-200">No content in this review filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {reviewFilter === 'pending'
                ? 'All generated marketing items have been evaluated. Excellent governance compliance!'
                : 'Generate drafts in the Content Studio to populate the review queue.'}
            </p>
          </div>
        ) : (
          filteredQueue.map((item) => {
            const isApproved = item.status === 'approved' || item.status === 'scheduled' || item.status === 'published';
            const isPending = item.status === 'human_review' || item.status === 'pending';
            const isRejected = item.status === 'rejected';

            return (
              <div 
                key={item.id} 
                className={`glass-panel p-6 rounded-2xl border transition-all space-y-4 ${
                  isPending ? 'border-amber-500/30 hover:border-amber-500/50 bg-[#0e1628]/70' :
                  isApproved ? 'border-emerald-500/20 hover:border-emerald-500/40' :
                  'border-rose-500/20 hover:border-rose-500/40'
                }`}
              >
                {/* Item Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getBrandBadge(item.brand)}
                    <span className="px-2.5 py-0.5 rounded text-xs bg-slate-800/90 text-slate-300 capitalize font-mono border border-slate-700">
                      {item.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-800/60 text-slate-400 uppercase font-mono">
                      Var {item.variation} • {item.language}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">#{item.id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">Compliance Audit:</span>
                    <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                      item.compliance_score >= 85 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      item.compliance_score >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {item.compliance_score}%
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Content Raw & Topic */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-100">{item.topic}</h4>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-[#0a0f1d] p-4 rounded-xl border border-slate-800/80 font-sans selection:bg-amber-500 selection:text-slate-950">
                    {item.content_raw}
                  </p>
                </div>

                {/* Audit / Reviewer Notes if present */}
                {item.notes && (
                  <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-200">Reviewer Guidance Note:</span>
                      <p className="text-slate-400 mt-0.5">{item.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500">
                    Staged {new Date(item.created_at).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* For Approved Items: Schedule Dispatch Preview */}
                    {isApproved && (
                      <button
                        onClick={() => onOpenScheduleModal(item)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {item.status === 'scheduled' ? 'Reschedule Preview' : 'Schedule Dispatch Preview'}
                      </button>
                    )}

                    {/* Auto Compliance Rewrite - only for low score items */}
                    {isPending && item.compliance_score < 85 && (
                      <button
                        onClick={() => onRewrite(item.id)}
                        disabled={actionLoading === `rewrite-${item.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" /> AI Rewrite Fix
                      </button>
                    )}

                    {/* Edit in place — only legal on items still awaiting human review (server-enforced) */}
                    {isPending && (
                      <button
                        onClick={() => onOpenEdit(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Edit Copy
                      </button>
                    )}

                    {/* Regenerate with lessons (for pending or rejected items) */}
                    {(isPending || isRejected) && (
                      <button
                        onClick={() => onRegenerate(item.id)}
                        disabled={actionLoading === `regen-${item.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    )}

                    {/* Reject & Learn - DISTINCT ROSE COLOR */}
                    {isPending && (
                      <button
                        onClick={() => onOpenReject(item)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject & Learn
                      </button>
                    )}

                    {/* Approve - DISTINCT EMERALD COLOR */}
                    {isPending && (
                      <button
                        onClick={() => onApprove(item.id)}
                        disabled={actionLoading === `approve-${item.id}`}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
