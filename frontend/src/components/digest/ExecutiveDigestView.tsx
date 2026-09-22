import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  Shield,
  Swords,
  Megaphone,
  Calendar,
  Globe,
  Tag,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Layers,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';
import type { ExecutiveDigest } from '../../types';

interface ExecutiveDigestViewProps {
  selectedBrandFilter?: string;
  onNavigateToCompetitor?: (competitorId?: number) => void;
  onNavigateToLeads?: () => void;
}

export const ExecutiveDigestView: React.FC<ExecutiveDigestViewProps> = ({
  selectedBrandFilter = 'all',
}) => {
  const [digests, setDigests] = useState<ExecutiveDigest[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<ExecutiveDigest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Filter & Generation inputs
  const [brand, setBrand] = useState<string>(selectedBrandFilter === 'all' ? 'all' : selectedBrandFilter);
  const [market, setMarket] = useState<string>('Singapore');
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [activePillarTab, setActivePillarTab] = useState<'all' | 'pricing' | 'underwriting' | 'sales' | 'marketing'>('all');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadDigests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDigests({
        brand: brand !== 'all' ? brand : undefined,
        market: market !== 'all' ? market : undefined,
      });
      setDigests(data);
      if (data.length > 0) {
        setSelectedDigest(data[0]);
      } else {
        // Fetch latest or auto-generate
        const latest = await api.getLatestDigest({
          brand: brand !== 'all' ? brand : undefined,
          market: market !== 'all' ? market : undefined,
        });
        if (latest) {
          setDigests([latest]);
          setSelectedDigest(latest);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load executive digests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDigests();
  }, [brand, market]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const newDigest = await api.generateDigest({
        brand: brand,
        market: market,
        period_days: periodDays,
      });
      setDigests((prev) => [newDigest, ...prev.filter((d) => d.id !== newDigest.id)]);
      setSelectedDigest(newDigest);
      showToast(`Executive Digest "${newDigest.title}" generated successfully.`);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0c2340] text-white px-4 py-3 rounded-lg shadow-xl border border-amber-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium">{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                STRATEGIC RADAR SYNTHESIS
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-500">Lloyd's Coverholder Facility</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Competitor & Market Digest</h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Synthesizes Phase 1 lead signals, Phase 2 competitor shifts, and regional underwriting anomalies into an actionable four-pillar strategic action blueprint.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c2340] hover:bg-[#14345c] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Synthesizing Intelligence...' : 'Generate New Digest'}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Brand Scope:</span>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-2.5 py-1 font-medium focus:ring-1 focus:ring-[#0c2340] outline-none"
            >
              <option value="all">All Portfolio Brands</option>
              <option value="jade">Jade (Jewellers Block)</option>
              <option value="doctorshield">DoctorShield (Med-Mal)</option>
              <option value="jaguartransit">Jaguar Transit (Specie/Cargo)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Regional Market:</span>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-2.5 py-1 font-medium focus:ring-1 focus:ring-[#0c2340] outline-none"
            >
              <option value="Singapore">Singapore</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Hong Kong">Hong Kong</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Thailand">Thailand</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Lookback Period:</span>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-md px-2.5 py-1 font-medium focus:ring-1 focus:ring-[#0c2340] outline-none"
            >
              <option value={14}>Past 14 Days</option>
              <option value={30}>Past 30 Days (Standard)</option>
              <option value={60}>Past 60 Days</option>
              <option value={90}>Past 90 Days (Quarterly)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadDigests} className="text-rose-900 underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Sidebar of historical digests + Detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Historical Digests List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Digest Archive</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {digests.length} Records
            </span>
          </div>

          <div className="mt-3 space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {loading && digests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 animate-pulse">
                Loading intelligence archive...
              </div>
            ) : digests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No executive digests found for this filter. Click "Generate New Digest" above.
              </div>
            ) : (
              digests.map((d) => {
                const isSelected = selectedDigest?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDigest(d)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 border-[#0c2340] text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[#0c2340]">
                        {d.brand.toUpperCase()} • {d.market}
                      </span>
                      <span>{formatDate(d.generated_at)}</span>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 line-clamp-1">{d.title}</div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {d.executive_summary}
                    </p>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{d.total_shifts_analyzed || d.changes_analyzed?.length || 0} Competitor Shifts</span>
                      <span>•</span>
                      <span>{d.source_count || 0} Evidence Signals</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Digest Report */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDigest ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Report Header Metadata */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                      {selectedDigest.brand.toUpperCase()} RADAR
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {selectedDigest.market}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-[11px] text-slate-500">
                      Window: {formatDate(selectedDigest.period_start)} – {formatDate(selectedDigest.period_end)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Model: <span className="font-semibold text-slate-700">{selectedDigest.model || 'Groq'}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-3">
                  {selectedDigest.title}
                </h2>
              </div>

              {/* Strict Factuality Disclaimer Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-0.5">
                    Verified Intelligence & Compliance Governance
                  </span>
                  Synthesized from <strong>{selectedDigest.changes_analyzed?.length || selectedDigest.total_shifts_analyzed || 0} verified competitor shifts</strong> and <strong>{selectedDigest.lead_signals_analyzed?.length || 0} high-fit prospect signals</strong>. 
                  Underwriting positioning and sales talking points represent strategic counter-actions for JA Assure internal use. External marketing must undergo standard Human-in-the-Loop review before dispatch.
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>1. Executive Summary</span>
                </div>
                <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedDigest.executive_summary}
                </div>
              </div>

              {/* Section 2: Four-Pillar Strategic Blueprint */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>2. Four-Pillar Strategic Action Plan ("What JA Assure Should Do")</span>
                  </div>

                  {/* Pillar filter pill tabs */}
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['all', 'pricing', 'underwriting', 'sales', 'marketing'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActivePillarTab(tab)}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                          activePillarTab === tab
                            ? 'bg-[#0c2340] text-white font-semibold'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {tab === 'all' && 'All Pillars'}
                        {tab === 'pricing' && 'Pricing'}
                        {tab === 'underwriting' && 'Underwriting'}
                        {tab === 'sales' && 'Battlecards'}
                        {tab === 'marketing' && 'Marketing'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pillar 1: Tactical Pricing */}
                  {(activePillarTab === 'all' || activePillarTab === 'pricing') && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>1. 🎯 Tactical Pricing & Margin Strategy</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-emerald-900">
                        {selectedDigest.pricing_strategy_points && selectedDigest.pricing_strategy_points.length > 0 ? (
                          selectedDigest.pricing_strategy_points.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500 italic">Deploy entry-tier rate schedules with deductible waivers.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Pillar 2: Underwriting Tweaks */}
                  {(activePillarTab === 'all' || activePillarTab === 'underwriting') && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>2. 🛡️ Policy Coverage & Wording Counter-Actions</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-blue-900">
                        {selectedDigest.underwriting_tweaks && selectedDigest.underwriting_tweaks.length > 0 ? (
                          selectedDigest.underwriting_tweaks.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500 italic">Relax security warranties with verified telematics CCTV.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Pillar 3: Sales Battlecard Hooks */}
                  {(activePillarTab === 'all' || activePillarTab === 'sales') && (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                        <Swords className="w-4 h-4 text-amber-600" />
                        <span>3. ⚔️ Sales Battlecards & Lead Displacement</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-amber-900">
                        {selectedDigest.battlecard_updates && selectedDigest.battlecard_updates.length > 0 ? (
                          selectedDigest.battlecard_updates.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500 italic">Target renewal dates with Lloyd's contract certainty comparison.</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Pillar 4: Marketing Campaigns */}
                  {(activePillarTab === 'all' || activePillarTab === 'marketing') && (
                    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-950">
                        <Megaphone className="w-4 h-4 text-purple-600" />
                        <span>4. 📢 Marketing & Campaign Positioning</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-purple-900">
                        {selectedDigest.marketing_campaign_ideas && selectedDigest.marketing_campaign_ideas.length > 0 ? (
                          selectedDigest.marketing_campaign_ideas.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500 italic">Deploy LinkedIn thought leadership addressing legacy carrier delays.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Key Competitor Developments (Observed Shifts) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>3. Verified Competitor Developments & Pricing Shifts</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {selectedDigest.changes_analyzed?.length || 0} Events Detected
                  </span>
                </div>

                {selectedDigest.changes_analyzed && selectedDigest.changes_analyzed.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {selectedDigest.changes_analyzed.map((ch, idx) => (
                        <div key={idx} className="p-3 bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900">{ch.competitor || 'Incumbent Underwriter'}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ch.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                ch.severity === 'major' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {ch.severity?.toUpperCase() || 'INFO'}
                              </span>
                              <span className="text-[10px] text-slate-400">{ch.change_type}</span>
                            </div>
                            <div className="text-xs font-medium text-slate-800">{ch.title}</div>
                            <p className="text-xs text-slate-600">{ch.description}</p>
                          </div>
                          {ch.detected_at && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                              {ch.detected_at}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 italic text-center">
                    No major website pricing or coverage alterations recorded during this monitoring window.
                  </div>
                )}
              </div>

              {/* Section 4: Phase 1 Lead Intelligence Cross-Link */}
              {selectedDigest.lead_signals_analyzed && selectedDigest.lead_signals_analyzed.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>4. Lead Discovery Market Signals (Phase 1 Integration)</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {selectedDigest.lead_signals_analyzed.length} Qualified Targets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDigest.lead_signals_analyzed.slice(0, 4).map((ld, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">{ld.company}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Fit: {ld.fit_score}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{ld.industry} • {ld.recommended_brand?.toUpperCase() || 'JADE'}</div>
                        {ld.why_now && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 italic pt-1 border-t border-slate-200/60">
                            "{ld.why_now}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Markdown Action Blueprint Accordion/Details */}
              <div className="pt-3 border-t border-slate-100">
                <details className="group">
                  <summary className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between cursor-pointer py-1">
                    <span>View Unabridged Strategic Guidance Transcript</span>
                    <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform">▸</span>
                  </summary>
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200/60">
                    {selectedDigest.what_ja_should_do}
                  </div>
                </details>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-xl border border-slate-200 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Digest Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a previous report from the archive or click "Generate New Digest" to create a fresh strategic intelligence briefing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
