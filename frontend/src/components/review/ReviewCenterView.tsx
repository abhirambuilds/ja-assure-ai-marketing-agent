import React, { useState } from 'react';
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
  AlertCircle,
  Scale,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import type { ContentQueueItem, ComplianceViolation, ClaimItem, ReviewDecisionItem } from '../../types';
import { api } from '../../services/api';

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

interface ParsedMetadata {
  compliance_status?: string;
  compliance_score?: number;
  compliance_jurisdiction?: string;
  compliance_product?: string;
  compliance_disclaimer_status?: string;
  compliance_violations?: ComplianceViolation[];
  compliance_warnings?: ComplianceViolation[];
  claims_analyzed?: ClaimItem[];
  audit_trail?: Array<{ action: string; timestamp: string; previous_score?: number; new_score?: number }>;
}

function parseMetadata(jsonStr?: string): ParsedMetadata | null {
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
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
  const [expandedAudits, setExpandedAudits] = useState<Record<number, boolean>>({});
  const [historyModalItem, setHistoryModalItem] = useState<ContentQueueItem | null>(null);
  const [historyItems, setHistoryItems] = useState<ReviewDecisionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const toggleAudit = (id: number) => {
    setExpandedAudits(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenHistory = async (item: ContentQueueItem) => {
    setHistoryModalItem(item);
    setHistoryLoading(true);
    try {
      const data = await api.getReviewHistory(item.id);
      setHistoryItems(data);
    } catch (err) {
      console.error('Failed to fetch review history:', err);
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

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
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Human Governance & Editorial Gate
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict human approval required for every generated asset. Rejections synthesize permanent prompt guardrails.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setReviewFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              reviewFilter === 'all' 
                ? 'bg-slate-200 text-slate-900 font-bold' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            All Items ({queue.length})
          </button>

          <button
            onClick={() => setReviewFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'pending' 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'text-slate-600 hover:text-amber-800 bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review ({pendingCount})
          </button>

          <button
            onClick={() => setReviewFilter('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'approved' 
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                : 'text-slate-600 hover:text-emerald-800 bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setReviewFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reviewFilter === 'rejected' 
                ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                : 'text-slate-600 hover:text-rose-800 bg-slate-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Queue List Cards */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="bg-white p-16 rounded-xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">No content in this review filter</h4>
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

            const parsedMeta = parseMetadata(item.metadata_json);
            const violations: ComplianceViolation[] = parsedMeta?.compliance_violations || [];
            const warnings: ComplianceViolation[] = parsedMeta?.compliance_warnings || [];
            const allViolations = [...violations, ...warnings];
            
            // If no structured violations from metadata, construct one from reason_tag if present
            if (allViolations.length === 0 && item.reason_tag && item.reason_tag !== 'none' && item.reason_tag !== 'human_edit') {
              allViolations.push({
                rule_id: item.reason_tag,
                severity: item.compliance_score < 60 ? 'CRITICAL' : 'HIGH',
                message: item.notes || 'Compliance rule flag triggered',
                reason: item.notes || 'Identified non-compliant phrasing in draft'
              });
            }

            const rawStatus = (parsedMeta?.compliance_status || (
              item.compliance_score >= 85 ? 'PASS' :
              item.compliance_score < 60 ? 'BLOCKED' : 'WARNING'
            )).toUpperCase();

            const isBlocked = rawStatus === 'BLOCKED' || item.compliance_status === 'failed' || item.compliance_score < 60;
            const isWarning = rawStatus === 'WARNING' || (!isBlocked && item.compliance_score < 85);
            const isPass = !isBlocked && !isWarning;

            return (
              <div 
                key={item.id} 
                className={`bg-white p-6 rounded-xl border transition-all space-y-4 shadow-2xs ${
                  isPending ? 'border-amber-300' :
                  isApproved ? 'border-emerald-200' :
                  'border-rose-200'
                }`}
              >
                {/* Item Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getBrandBadge(item.brand)}
                    <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700 capitalize font-medium">
                      {item.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 uppercase">
                      Var {item.variation} • {item.language}
                    </span>
                    <span className="text-[11px] text-slate-400">#{item.id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">Compliance Audit:</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.compliance_score >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      item.compliance_score >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {item.compliance_score}%
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isPass ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      isBlocked ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {rawStatus}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Content Raw & Topic */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-slate-900">{item.topic}</h4>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 font-sans">
                    {item.content_raw}
                  </p>
                </div>

                {/* Compliance Audit Inspector Card */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-blue-700" />
                        Regulatory Governance Audit
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPass ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                        isBlocked ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {rawStatus}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        {parsedMeta?.compliance_jurisdiction || 'SG / MAS'}
                      </span>
                      {parsedMeta?.compliance_product && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {parsedMeta.compliance_product}
                        </span>
                      )}
                      {parsedMeta?.compliance_disclaimer_status && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                          Disclaimer: {parsedMeta.compliance_disclaimer_status}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAudit(item.id)}
                      className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {expandedAudits[item.id] ? (
                        <>Hide Audit Breakdown <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>
                          Inspect Audit Breakdown
                          {allViolations.length > 0 && ` (${allViolations.length})`}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Collapsed Snippet if violations exist */}
                  {!expandedAudits[item.id] && allViolations.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="truncate">
                        <strong>{allViolations[0].rule_id}</strong>: {allViolations[0].reason || allViolations[0].message}
                      </span>
                      {allViolations.length > 1 && (
                        <span className="text-[10px] bg-rose-200 px-1.5 py-0.5 rounded text-rose-900 shrink-0 font-bold">
                          +{allViolations.length - 1} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Expanded Breakdown */}
                  {expandedAudits[item.id] && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      {allViolations.length === 0 ? (
                        <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Zero regulatory violations detected across 12 statutory rule categories. Ready for human review sign-off.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                            Detected Regulatory Violations & Remediations ({allViolations.length})
                          </div>
                          {allViolations.map((v, vIdx) => {
                            const sev = (v.severity || 'MEDIUM').toUpperCase();
                            const sevBadgeStyle = 
                              sev === 'CRITICAL' ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold' :
                              sev === 'HIGH' ? 'bg-orange-100 text-orange-900 border-orange-300 font-bold' :
                              sev === 'MEDIUM' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                              'bg-blue-100 text-blue-900 border-blue-300';

                            return (
                              <div key={vIdx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-xs shadow-2xs">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sevBadgeStyle}`}>
                                      {sev}
                                    </span>
                                    <span className="font-bold text-slate-800">{v.rule_id}</span>
                                    {v.category && (
                                      <span className="text-[10px] text-slate-500 capitalize">({v.category.replace(/_/g, ' ')})</span>
                                    )}
                                  </div>
                                </div>

                                {(v.matched_text || v.flagged_phrase) && (
                                  <div className="text-[11px] text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                                    <span className="text-slate-500">Flagged phrase: </span>
                                    <span className="text-rose-900 font-semibold underline decoration-rose-500">
                                      "{v.matched_text || v.flagged_phrase}"
                                    </span>
                                  </div>
                                )}

                                <div className="text-slate-700 text-xs">
                                  <span className="text-slate-500 font-medium">Reason: </span>
                                  {v.reason || v.message}
                                </div>

                                {(v.recommendation || v.suggested_fix) && (
                                  <div className="text-emerald-900 text-xs bg-emerald-50 p-2 rounded border border-emerald-200">
                                    <span className="text-emerald-700 font-bold">Suggested Remediation: </span>
                                    {v.recommendation || v.suggested_fix}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Claims Analyzed Section */}
                      {parsedMeta?.claims_analyzed && parsedMeta.claims_analyzed.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5">
                          <div className="text-[11px] uppercase tracking-wider text-slate-600 font-bold">
                            Claims Analyzed ({parsedMeta.claims_analyzed.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {parsedMeta.claims_analyzed.map((claim, cIdx) => (
                              <div key={cIdx} className="text-[11px] px-2 py-1 rounded bg-white border border-slate-200 text-slate-800 flex items-center gap-1.5 shadow-2xs">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  claim.risk_level === 'high' ? 'bg-rose-500' : claim.risk_level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <span className="max-w-xs truncate">"{claim.claim_text}"</span>
                                <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-600">{claim.claim_type}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Audit / Reviewer Notes if present */}
                {item.notes && (
                  <div className="text-xs text-slate-800 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900">Reviewer Guidance Note:</span>
                      <p className="text-amber-800 mt-0.5">{item.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      Staged {new Date(item.created_at).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(item)}
                      className="px-2.5 py-1 rounded-lg text-[11px] text-slate-600 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="View Human Governance Decision Audit Trail"
                    >
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      Audit Trail
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* For Approved Items: Schedule Dispatch Preview */}
                    {isApproved && (
                      <button
                        onClick={() => onOpenScheduleModal(item)}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {item.status === 'scheduled' ? 'Reschedule Preview' : 'Schedule Dispatch Preview'}
                      </button>
                    )}

                    {/* Auto Compliance Rewrite */}
                    {isPending && (item.compliance_score < 85 || isBlocked || allViolations.length > 0) && (
                      <button
                        onClick={() => onRewrite(item.id)}
                        disabled={actionLoading === `rewrite-${item.id}`}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                        {actionLoading === `rewrite-${item.id}` ? 'Rewriting...' : 'AI Rewrite Fix'}
                      </button>
                    )}

                    {/* Edit in place */}
                    {isPending && (
                      <button
                        onClick={() => onOpenEdit(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Edit Copy
                      </button>
                    )}

                    {/* Regenerate */}
                    {(isPending || isRejected) && (
                      <button
                        onClick={() => onRegenerate(item.id)}
                        disabled={actionLoading === `regen-${item.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    )}

                    {/* Reject & Learn */}
                    {isPending && (
                      <button
                        onClick={() => onOpenReject(item)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject & Learn
                      </button>
                    )}

                    {/* Approve */}
                    {isPending && (
                      <button
                        onClick={() => onApprove(item.id)}
                        disabled={actionLoading === `approve-${item.id}`}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

      {/* HITL Audit History Modal */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    HITL Governance Audit Trail
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      Item #{historyModalItem.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immutable log of reviewer decisions, status transitions, and copy alterations.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  Fetching governance audit log...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No review decisions recorded yet. Content is currently in initial staging.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {historyItems.map((dec, idx) => {
                    const decisionColor =
                      dec.decision === 'approve' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      dec.decision === 'reject' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      dec.decision === 'edit' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      dec.decision === 'rewrite' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                      'bg-purple-50 text-purple-800 border-purple-200';

                    return (
                      <div key={dec.id || idx} className="relative group">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 transition-transform" />

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${decisionColor}`}>
                                {dec.decision}
                              </span>
                              <span className="text-slate-700 flex items-center gap-1 font-medium">
                                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                                {dec.reviewer || 'compliance_officer'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(dec.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                            <span>Status transition:</span>
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">{dec.previous_status}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-emerald-700 font-semibold">{dec.new_status}</span>
                            {dec.compliance_score !== null && dec.compliance_score !== undefined && (
                              <span className="ml-auto text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                                Score: {dec.compliance_score.toFixed(1)}/100
                              </span>
                            )}
                          </div>

                          {(dec.reason_tag || dec.notes) && (
                            <div className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                              {dec.reason_tag && (
                                <div className="text-[11px] text-amber-800 font-semibold">
                                  Reason: {dec.reason_tag}
                                </div>
                              )}
                              {dec.notes && <p className="text-slate-600 text-xs">{dec.notes}</p>}
                            </div>
                          )}

                          {dec.edited_content && dec.edited_content !== dec.original_content && (
                            <div className="text-xs space-y-1.5 pt-1">
                              {dec.original_content && (
                                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-[11px] text-rose-800 line-clamp-2">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Prior Version:</span>
                                  "{dec.original_content}"
                                </div>
                              )}
                              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 line-clamp-2">
                                <span className="text-slate-500 block text-[10px] uppercase font-semibold">New / Corrected Version:</span>
                                "{dec.edited_content}"
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
