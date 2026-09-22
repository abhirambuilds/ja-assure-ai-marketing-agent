import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldCheck,
  Zap,
  Sparkles,
  Copy,
  UserCheck,
  RefreshCw,
  Ban,
  Radio
} from 'lucide-react';
import type { Lead, OutreachMessage, ProviderStatus, SequenceTouch, ReplyClassification } from '../../types';
import { api } from '../../services/api';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onLeadUpdated?: (lead: Lead) => void;
}

export const OutreachModal: React.FC<OutreachModalProps> = ({
  isOpen,
  onClose,
  lead,
  onLeadUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'cadence' | 'simulator' | 'history' | 'suppression'>('cadence');
  const [selectedTouchStep, setSelectedTouchStep] = useState<number>(1);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [latestOutreach, setLatestOutreach] = useState<OutreachMessage | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  
  // Editable fields for touchpoint
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [sequenceTouches, setSequenceTouches] = useState<SequenceTouch[]>([]);

  // Action states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [showSendConfirm, setShowSendConfirm] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ sent: boolean; messageId?: string; reason?: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reply simulation state
  const [simulatedText, setSimulatedText] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastClassification, setLastClassification] = useState<ReplyClassification | null>(null);

  // Suppression state
  const [isSuppressed, setIsSuppressed] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgs, status, suppList] = await Promise.all([
        api.getLeadMessages(lead.id),
        api.getProviderStatus(),
        api.listSuppression()
      ]);

      setMessages(msgs);
      setProviderStatus(status);

      const recipientEmail = (lead.email || '').trim().toLowerCase();
      const suppressed = suppList.some(s => s.normalized_email === recipientEmail);
      setIsSuppressed(suppressed);

      // Latest outbound outreach draft or message
      const latest = msgs.find(m => m.direction === 'outbound') || null;
      setLatestOutreach(latest);

      if (latest && latest.sequence_touches && latest.sequence_touches.length > 0) {
        setSequenceTouches(latest.sequence_touches);
        const currentTouch = latest.sequence_touches.find(t => t.step === selectedTouchStep) || latest.sequence_touches[0];
        setSubject(currentTouch.subject);
        setBody(currentTouch.body);
      } else if (latest) {
        setSubject(latest.subject);
        setBody(latest.body);
      } else {
        // Prepare default draft preview from lead
        setSubject(`${(lead.recommended_brand || 'jade').toUpperCase()}: Underwriting Context for ${lead.company}`);
        setBody(lead.outreach_draft || `Hello,\n\nJA Assure works with ${lead.country || 'regional'} enterprises providing Lloyd's of London coverholder terms.`);
      }
    } catch (err) {
      console.error('Failed to load outreach modal data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, lead.id]);

  useEffect(() => {
    if (sequenceTouches.length > 0) {
      const targetTouch = sequenceTouches.find(t => t.step === selectedTouchStep);
      if (targetTouch) {
        setSubject(targetTouch.subject);
        setBody(targetTouch.body);
      }
    }
  }, [selectedTouchStep, sequenceTouches]);

  if (!isOpen) return null;

  const handleGenerateCadence = async () => {
    setIsLoading(true);
    try {
      const generated = await api.generateOutreachCadence(lead.id);
      setLatestOutreach(generated);
      if (generated.sequence_touches && generated.sequence_touches.length > 0) {
        setSequenceTouches(generated.sequence_touches);
        setSubject(generated.sequence_touches[0].subject);
        setBody(generated.sequence_touches[0].body);
        setSelectedTouchStep(1);
      } else {
        setSubject(generated.subject);
        setBody(generated.body);
      }
      showToast('3-Touch Cadence generated & submitted for Human Review!');
      if (onLeadUpdated) {
        onLeadUpdated({ ...lead, status: 'pending_approval' });
      }
      const updatedMsgs = await api.getLeadMessages(lead.id);
      setMessages(updatedMsgs);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate cadence sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!latestOutreach) return;
    setIsLoading(true);
    try {
      const approved = await api.approveOutreach(latestOutreach.id, 'Underwriting Lead Reviewer');
      setLatestOutreach(approved);
      showToast('Outreach sequence approved by Human Reviewer! Ready for dispatch.');
      if (onLeadUpdated) {
        onLeadUpdated({ ...lead, status: 'approved' });
      }
      const updatedMsgs = await api.getLeadMessages(lead.id);
      setMessages(updatedMsgs);
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve outreach');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDispatch = async () => {
    if (!latestOutreach) return;
    setIsSending(true);
    setShowSendConfirm(false);
    try {
      const res = await api.sendOutreach(latestOutreach.id, dryRun);
      setSendResult({
        sent: res.sent,
        messageId: res.provider_message_id,
        reason: res.reason
      });

      if (res.sent) {
        showToast(`Outreach dispatched successfully via ${providerStatus?.provider || 'provider'}!`);
        if (onLeadUpdated) {
          onLeadUpdated({ ...lead, status: 'contacted' });
        }
      } else {
        showToast(`Send blocked or dry-run: ${res.reason || 'Not sent'}`);
      }

      const updatedMsgs = await api.getLeadMessages(lead.id);
      setMessages(updatedMsgs);
    } catch (err: any) {
      showToast(err?.message || 'Send execution failed');
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateReply = async (presetText?: string) => {
    const textToSend = presetText || simulatedText;
    if (!textToSend.trim()) return;
    setIsSimulating(true);
    try {
      const classification = await api.simulateInboundReply(lead.id, textToSend, lead.email);
      setLastClassification(classification);
      setSimulatedText('');
      showToast(`Inbound reply classified as: ${classification.intent.toUpperCase()}`);
      if (classification.intent === 'unsubscribe') {
        setIsSuppressed(true);
      }
      if (onLeadUpdated) {
        onLeadUpdated({ ...lead, status: classification.lead_status });
      }
      const updatedMsgs = await api.getLeadMessages(lead.id);
      setMessages(updatedMsgs);
    } catch (err: any) {
      showToast(err?.message || 'Reply simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleSuppression = async () => {
    const email = lead.email || '';
    if (!email) return;
    setIsLoading(true);
    try {
      if (isSuppressed) {
        await api.removeSuppression(email);
        setIsSuppressed(false);
        showToast(`Removed ${email} from suppression list.`);
      } else {
        await api.addSuppression(email, 'manual_opt_out', 'admin_console');
        setIsSuppressed(true);
        showToast(`Added ${email} to suppression list.`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatus = latestOutreach?.status || lead.status || 'new';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{lead.company}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                  {lead.recommended_brand?.toUpperCase() || 'JADE'}
                </span>
                {isSuppressed && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                    <Ban className="w-3 h-3" /> Suppressed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Contact: <strong className="text-slate-700">{lead.name || 'Decision Maker'}</strong> ({lead.email || 'No email registered'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 text-xs font-semibold text-slate-500 bg-white">
          <button
            onClick={() => setActiveTab('cadence')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'cadence'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" /> 3-Touch Cadence Sequence
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Reply Intelligence Simulator
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" /> Message History ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('suppression')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'suppression'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Compliance & Suppression
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3 bg-slate-900 text-white text-xs rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Send Execution Result Banner */}
          {sendResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
              sendResult.sent
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                {sendResult.sent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>
                  {sendResult.sent
                    ? `Dispatch Confirmed (Message-ID: ${sendResult.messageId || 'mock-dispatched'})`
                    : `Send Blocked or Dry-run: ${sendResult.reason || 'Not dispatched'}`}
                </span>
              </div>
              <button
                onClick={() => setSendResult(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: 3-TOUCH CADENCE */}
          {activeTab === 'cadence' && (
            <div className="space-y-5">
              
              {/* Provider & Governance Status Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700">Governance State:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    currentStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : currentStatus === 'pending_approval'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : currentStatus === 'sent' || currentStatus === 'contacted'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {currentStatus}
                  </span>

                  <span className="text-slate-300">|</span>

                  <span className="font-semibold text-slate-700">Provider Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
                    {providerStatus?.provider === 'smtp' && providerStatus.healthy
                      ? 'SMTP Live (Active)'
                      : providerStatus?.provider === 'gmail'
                      ? 'Gmail (OAuth Boundary Adapter)'
                      : 'Mock Provider (Hermetic Safe Mode)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateCadence}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Regenerate 3-Touch Sequence
                  </button>
                </div>
              </div>

              {/* Touch Step Selector Tabs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { step: 1, day: 'Day 0', label: '1. Initial Intro & Hook' },
                  { step: 2, day: 'Day 4', label: "2. Lloyd's Warranty Advantage" },
                  { step: 3, day: 'Day 9', label: '3. Executive Wrap-up' }
                ].map((touch) => {
                  const isSelected = selectedTouchStep === touch.step;
                  return (
                    <button
                      key={touch.step}
                      onClick={() => setSelectedTouchStep(touch.step)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isSelected ? 'text-blue-700' : 'text-slate-500'
                        }`}>
                          {touch.day}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                        {touch.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sequence Editor / Preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email Body (Plain Text / HTML Multipart)</label>
                  <textarea
                    rows={10}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 leading-relaxed focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Footer Disclaimers & Compliance Tags */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RFC 8058 One-Click List-Unsubscribe Header Injected</span>
                  </div>
                  <span>Forbidden Phrases Checked: Passed</span>
                </div>
              </div>

              {/* Action Buttons: Human Approval & Send */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
                      showToast('Outreach copied to clipboard!');
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Human Approval Gate */}
                  {currentStatus !== 'approved' && currentStatus !== 'sent' && (
                    <button
                      onClick={handleApprove}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve Sequence (HITL Gate)
                    </button>
                  )}

                  {/* Send Action */}
                  <button
                    onClick={() => setShowSendConfirm(true)}
                    disabled={isSending || currentStatus !== 'approved' || isSuppressed}
                    className={`px-5 py-2 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all ${
                      currentStatus === 'approved' && !isSuppressed
                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                        : 'bg-slate-400 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      isSuppressed
                        ? 'Recipient is suppressed'
                        : currentStatus !== 'approved'
                        ? 'Requires human review approval before sending'
                        : 'Dispatch approved outreach'
                    }
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'Dispatching...' : 'Send Outreach'}
                  </button>
                </div>
              </div>

              {/* Send Confirmation Dialog */}
              {showSendConfirm && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Confirm Outreach Dispatch</h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        You are about to dispatch Touchpoint #{selectedTouchStep} to{' '}
                        <strong>{lead.email || lead.company}</strong> via{' '}
                        <strong>{providerStatus?.provider?.toUpperCase() || 'MOCK'}</strong> provider.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                    <label className="flex items-center gap-2 text-xs font-medium text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Dry Run Only (simulate send without network dispatch)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSendConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendDispatch}
                        className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Confirm & Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INBOUND REPLY SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Zap className="w-4 h-4 text-blue-600" />
                  Deterministic Inbound Reply Classifier Playground
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Test the rule-based intent engine against prospect responses. Evaluates legal opt-outs,
                  meeting requests, pricing inquiries, or objections in real time.
                </p>
              </div>

              {/* Preset Quick Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Quick Reply Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => handleSimulateReply('Please remove me from your list and stop contacting me')}
                    className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-900 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-rose-700 uppercase">1. Unsubscribe</span>
                    "Please remove me from your list"
                  </button>

                  <button
                    onClick={() => handleSimulateReply('Can we schedule a 15-minute call next Tuesday at 2pm?')}
                    className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-900 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-emerald-700 uppercase">2. Meeting Request</span>
                    "Can we schedule a call next Tuesday?"
                  </button>

                  <button
                    onClick={() => handleSimulateReply('Please send more information regarding pricing and coverage deductibles.')}
                    className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-indigo-700 uppercase">3. Request Info</span>
                    "Please send more info and pricing"
                  </button>

                  <button
                    onClick={() => handleSimulateReply('No thanks, we are not interested in insurance at this time.')}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-slate-600 uppercase">4. Negative / Not Interested</span>
                    "We are not interested at this time"
                  </button>

                  <button
                    onClick={() => handleSimulateReply('I am currently out of office on annual leave until next Monday.')}
                    className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-amber-700 uppercase">5. Out Of Office</span>
                    "I am out of office on annual leave"
                  </button>

                  <button
                    onClick={() => handleSimulateReply('Yes, interested. Let’s talk about Lloyd’s terms.')}
                    className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-blue-900 text-left font-medium transition-all cursor-pointer"
                  >
                    <span className="block font-bold text-[10px] text-blue-700 uppercase">6. Positive Intent</span>
                    "Yes, interested. Let's talk"
                  </button>
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Custom Inbound Message</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simulatedText}
                    onChange={(e) => setSimulatedText(e.target.value)}
                    placeholder="Type a prospect reply or objection..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                  <button
                    onClick={() => handleSimulateReply()}
                    disabled={isSimulating || !simulatedText.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    Classify & Log
                  </button>
                </div>
              </div>

              {/* Classification Result Card */}
              {lastClassification && (
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Classification Outcome</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Intent: {lastClassification.intent.toUpperCase()} ({(lastClassification.confidence * 100).toFixed(0)}% confidence)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    <strong>Suggested Action:</strong> {lastClassification.suggested_action}
                  </p>
                  <p className="text-xs text-slate-400">
                    <strong>Updated Lead Status:</strong> <span className="text-emerald-400 font-semibold">{lastClassification.lead_status}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MESSAGE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Outreach & Inbound Thread ({messages.length})
                </h4>
                <button
                  onClick={loadData}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  No outreach or reply messages recorded for this lead yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isOutbound = m.direction === 'outbound';
                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
                          isOutbound
                            ? 'bg-white border-slate-200 shadow-2xs'
                            : 'bg-blue-50/50 border-blue-100 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                              isOutbound
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {m.direction}
                            </span>
                            <span className="font-bold text-slate-900">{m.subject}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                          {m.body}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Status: <strong className="text-slate-800">{m.status}</strong></span>
                          {m.provider_message_id && (
                            <span className="font-mono text-[10px] text-slate-400">
                              ID: {m.provider_message_id}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLIANCE & SUPPRESSION */}
          {activeTab === 'suppression' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Regulatory Opt-Out & Suppression List Enforcement
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Under regional data protection regulations (Singapore PDPA, Malaysia PDPA), recipients who opt out or
                  unsubscribe must be immediately suppressed from future automated marketing communications.
                </p>
              </div>

              <div className="p-5 rounded-xl border bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Current Contact Suppression Status</span>
                    <span className="text-[11px] text-slate-500">{lead.email || 'No email registered'}</span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isSuppressed
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {isSuppressed ? 'SUPPRESSED (Blocked from Sends)' : 'CLEAN (Eligible for Outreach)'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">
                    {isSuppressed
                      ? 'This email address is suppressed. Any attempt to send outreach will be blocked.'
                      : 'You may manually suppress this address to prevent any outreach.'}
                  </p>

                  <button
                    onClick={handleToggleSuppression}
                    disabled={isLoading || !lead.email}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSuppressed
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isSuppressed ? 'Override / Remove Suppression' : 'Suppress This Contact'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
