import React from 'react';
import { 
  X, 
  Calendar, 
  Info, 
  XCircle, 
  FileText, 
  Sparkles,
  BrainCircuit
} from 'lucide-react';
import type { ContentQueueItem, Lead } from '../../types';

interface ModalsProps {
  // Publishing Preview Modal
  publishingModalItem: ContentQueueItem | null;
  setPublishingModalItem: (item: ContentQueueItem | null) => void;
  scheduledPlatform: string;
  setScheduledPlatform: (platform: string) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  onConfirmSchedule: () => void;

  // Rejection Modal
  rejectModalItem: ContentQueueItem | null;
  setRejectModalItem: (item: ContentQueueItem | null) => void;
  rejectReasonTag: string;
  setRejectReasonTag: (tag: string) => void;
  rejectNotes: string;
  setRejectNotes: (notes: string) => void;
  onConfirmReject: () => void;

  // Edit Modal
  editModalItem: ContentQueueItem | null;
  setEditModalItem: (item: ContentQueueItem | null) => void;
  editContentText: string;
  setEditContentText: (text: string) => void;
  onConfirmEdit: () => void;

  // Lead Enrichment Modal
  enrichModalLead: Lead | null;
  setEnrichModalLead: (lead: Lead | null) => void;
  enrichUrlInput: string;
  setEnrichUrlInput: (url: string) => void;
  onEnrichLead: () => void;

  // Global Action Loading state
  actionLoading: string | null;
  getBrandBadge: (brand: string) => React.ReactNode;
}

export const Modals: React.FC<ModalsProps> = ({
  publishingModalItem,
  setPublishingModalItem,
  scheduledPlatform,
  setScheduledPlatform,
  scheduledTime,
  setScheduledTime,
  onConfirmSchedule,

  rejectModalItem,
  setRejectModalItem,
  rejectReasonTag,
  setRejectReasonTag,
  rejectNotes,
  setRejectNotes,
  onConfirmReject,

  editModalItem,
  setEditModalItem,
  editContentText,
  setEditContentText,
  onConfirmEdit,

  enrichModalLead,
  setEnrichModalLead,
  enrichUrlInput,
  setEnrichUrlInput,
  onEnrichLead,

  actionLoading,
  getBrandBadge
}) => {
  return (
    <>
      {/* 1. PUBLISHING PREVIEW MODAL */}
      {publishingModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Schedule Publishing Preview</h3>
                  <p className="text-[11px] text-slate-500">Human-controlled dispatch staging</p>
                </div>
              </div>
              <button
                onClick={() => setPublishingModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Dispatch Disclaimer Banner */}
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3 text-blue-900 text-xs">
              <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-blue-950">SIMULATED DISPATCH — No external post will be published.</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Strict governance enforced: only verified human-approved content can reach this staging queue. No live social media OAuth or external posting APIs are triggered.
                </p>
              </div>
            </div>

            {/* Governance Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Brand Persona</span>
                <div className="mt-1">{getBrandBadge(publishingModalItem.brand)}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Compliance Score</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {publishingModalItem.compliance_score}% (PASSED)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Governance Gate</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-bold text-xs bg-blue-50 text-blue-800 border border-blue-200">
                  Human Signed-Off
                </span>
              </div>
            </div>

            {/* Platform & Schedule Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block">Destination Platform</label>
                <select
                  value={scheduledPlatform}
                  onChange={(e) => setScheduledPlatform(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="linkedin">LinkedIn (Simulated Feed)</option>
                  <option value="instagram">Instagram (Simulated Feed)</option>
                  <option value="facebook">Facebook (Simulated Page)</option>
                  <option value="x">X / Twitter (Simulated Stream)</option>
                  <option value="email">Email Newsletter (Simulated Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mock Destination Route */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
              <span>Mock Dispatch Route:</span>
              <span className="text-blue-700 font-mono">api.dispatch.simulated/{scheduledPlatform}/v1/queue</span>
            </div>

            {/* Content Preview Box */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-600 font-medium">Draft Preview for Reviewer Verification</label>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[11px] border-b border-slate-200 pb-2">
                  <span className="capitalize font-semibold text-slate-800">{scheduledPlatform} Post Preview</span>
                  <span>{publishingModalItem.language.toUpperCase()} • Item #{publishingModalItem.id}</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-xs">{publishingModalItem.topic}</h4>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {publishingModalItem.content_raw}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPublishingModalItem(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmSchedule}
                disabled={actionLoading?.startsWith('schedule-')}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                {actionLoading?.startsWith('schedule-') ? 'Scheduling Dispatch...' : 'Confirm Schedule Preview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECTION & CLOSED-LOOP FEEDBACK MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-rose-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject Content & Synthesize Lesson
              </h3>
              <button 
                onClick={() => setRejectModalItem(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Closed-loop Banner */}
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-2.5 text-xs text-purple-900">
              <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-950">Your feedback becomes a reusable AI lesson.</p>
                <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                  Rejections directly feed the closed-loop learning engine. Future content generated for this brand will strictly avoid this error.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block">Reason Category</label>
                <select
                  value={rejectReasonTag}
                  onChange={(e) => setRejectReasonTag(e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
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
                <label className="text-slate-700 font-semibold block">Reviewer Guidance & Rule Note</label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explain exactly why this was rejected so future AI prompts can adhere..."
                  className="w-full mt-1 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmReject}
                disabled={actionLoading?.startsWith('reject-')}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Rejection & Learn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. IN-PLACE EDIT MODAL */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Edit Copy
              </h3>
              <button 
                onClick={() => setEditModalItem(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 -mt-1">
              Saving sends this edit back to Human Review — it does not approve the content. A reviewer must sign off on the new version separately.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-700 font-semibold block">Corrected Marketing Text</label>
              <textarea
                rows={8}
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 font-sans leading-relaxed focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditModalItem(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmEdit}
                disabled={actionLoading?.startsWith('edit-')}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save & Resubmit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEAD ENRICHMENT MODAL */}
      {enrichModalLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Enrich Lead: {enrichModalLead.company}
              </h3>
              <button 
                onClick={() => setEnrichModalLead(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide an official company website URL to scrape verified offerings and risk factors, or leave blank to perform AI reasoning enrichment.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-700 font-semibold">Company Website / Source URL (Optional)</label>
              <input
                type="text"
                value={enrichUrlInput}
                onChange={(e) => setEnrichUrlInput(e.target.value)}
                placeholder="https://company.com/about"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEnrichModalLead(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onEnrichLead}
                disabled={actionLoading?.startsWith('enrich-')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {actionLoading?.startsWith('enrich-') ? 'Enriching...' : 'Enrich Prospect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
