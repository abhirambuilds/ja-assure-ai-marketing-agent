import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  MapPin, 
  Building, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Mail,
  Globe,
  Phone,
  Zap
} from 'lucide-react';
import type { Lead } from '../../types';

interface LeadsViewProps {
  leads: Lead[];
  leadCountry: string;
  setLeadCountry: (country: string) => void;
  leadBrand: string;
  setLeadBrand: (brand: string) => void;
  leadIndustry: string;
  setLeadIndustry: (industry: string) => void;
  onDiscoverLeads: () => void;
  onOpenEnrichModal: (lead: Lead) => void;
  onGenerateOutreach: (leadId: number) => void;
  actionLoading: string | null;
  showToast: (msg: string) => void;
  getSourceTypeBadge: (source?: string, sourceType?: string) => React.ReactNode;
  getBrandBadge: (brand: string) => React.ReactNode;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  leadCountry,
  setLeadCountry,
  leadBrand,
  setLeadBrand,
  leadIndustry,
  setLeadIndustry,
  onDiscoverLeads,
  onOpenEnrichModal,
  onGenerateOutreach,
  actionLoading,
  showToast,
  getSourceTypeBadge,
  getBrandBadge
}) => {
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const isDiscovering = actionLoading === 'discovering';

  const toggleExpand = (id: number) => {
    setExpandedLeadId(expandedLeadId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Lead Intelligence Command Header & Discovery Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              B2B Lead Intelligence & Risk Underwriting Match
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              5-factor underwriting qualification algorithm scoring high-value prospects across Southeast Asia
            </p>
          </div>
          <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full w-fit">
            5-Factor Scoring Active
          </span>
        </div>

        {/* Discovery Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block">Brand Persona</label>
            <select
              value={leadBrand}
              onChange={(e) => setLeadBrand(e.target.value)}
              className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Brand Lines</option>
              <option value="jade">Jade (Luxury Jewellery)</option>
              <option value="doctorshield">DoctorShield (Med Indemnity)</option>
              <option value="jaguartransit">Jaguar Transit (Cargo)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block">Jurisdiction / Country</label>
            <select
              value={leadCountry}
              onChange={(e) => setLeadCountry(e.target.value)}
              className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Jurisdictions</option>
              <option value="Singapore">Singapore (MAS Licensed)</option>
              <option value="Malaysia">Malaysia (BNM Regulated)</option>
              <option value="Indonesia">Indonesia (OJK Compliance)</option>
              <option value="Thailand">Thailand (OIC Regulated)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block">Target Vertical</label>
            <input
              type="text"
              value={leadIndustry}
              onChange={(e) => setLeadIndustry(e.target.value)}
              placeholder="e.g. Diamond Dealer, Clinic"
              className="w-full mt-1.5 bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={onDiscoverLeads}
              disabled={isDiscovering}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isDiscovering ? 'Discovering Prospects...' : 'Discover & Score Leads'}
            </button>
          </div>
        </div>
      </div>

      {/* Prospect Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            Qualified Prospects ({leads.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Sorted by Underwriting Fit Score
          </span>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white p-16 rounded-xl border border-slate-200 text-center space-y-2 shadow-2xs">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">No leads match the current filters</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the discovery controls above to scan for high-net-worth jewelers, aesthetic surgeons, or transit operators.
            </p>
          </div>
        ) : (
          leads.map((lead) => {
            const isExpanded = expandedLeadId === lead.id;
            const fitScore = Math.round(lead.fit_score || 75);

            // Compute or parse 5-factor breakdown
            let parsedBreakdown: Record<string, number> | null = null;
            if (lead.score_breakdown_json) {
              try {
                parsedBreakdown = JSON.parse(lead.score_breakdown_json);
              } catch {
                parsedBreakdown = null;
              }
            }
            const industryFit = parsedBreakdown?.industry_fit ?? Math.min(25, Math.round(fitScore * 0.25));
            const companyProfile = parsedBreakdown?.company_relevance ?? Math.min(20, Math.round(fitScore * 0.20));
            const geoRelevance = parsedBreakdown?.geographic_fit ?? Math.min(20, Math.round(fitScore * 0.20));
            const productRelevance = parsedBreakdown?.product_fit ?? Math.min(20, Math.round(fitScore * 0.20));
            const triggerStrength = parsedBreakdown?.trigger_strength ?? Math.min(15, Math.round(fitScore * 0.15));

            return (
              <div 
                key={lead.id} 
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all overflow-hidden shadow-2xs"
              >
                {/* Main Card Row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">{lead.company}</h4>
                      {lead.recommended_brand && getBrandBadge(lead.recommended_brand)}
                      {getSourceTypeBadge(lead.source, lead.source_type)}
                      {lead.is_demo && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          DEMO DATA
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">#{lead.id}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {lead.industry}
                      </span>
                      {lead.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {lead.location}
                        </span>
                      )}
                      {lead.domain && (
                        <a 
                          href={lead.website || `https://${lead.domain}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {lead.domain}
                        </a>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.name && (
                        <span className="text-slate-800 font-medium">
                          Contact: {lead.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Score badge & Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Underwriting Fit</div>
                      <span className={`text-base font-bold px-3 py-0.5 rounded-full inline-block ${
                        fitScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        fitScore >= 60 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {fitScore}%
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenEnrichModal(lead)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Enrich
                    </button>

                    <button
                      onClick={() => toggleExpand(lead.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer transition-colors"
                      title="Toggle 5-Factor Score & Outreach"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Section: 5-Factor Score Breakdown & AI Outreach */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50 space-y-4 text-xs">
                    {/* "Why Now" Opportunity Trigger */}
                    {lead.why_now && (
                      <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/90 space-y-1 shadow-2xs">
                        <span className="font-bold text-amber-900 uppercase text-[10px] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                          "Why Now" Underwriting Opportunity Trigger
                        </span>
                        <p className="text-amber-950 text-[11px] leading-relaxed font-sans">{lead.why_now}</p>
                      </div>
                    )}

                    {/* Qualification Rationale */}
                    {lead.qualification_reason && !lead.why_now && (
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                        <span className="font-bold text-slate-800 uppercase text-[10px]">Underwriter Rationale</span>
                        <p className="text-slate-600 text-[11px] leading-relaxed font-sans">{lead.qualification_reason}</p>
                      </div>
                    )}

                    {/* 5-Factor Underwriting Score Breakdown */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 uppercase text-[10px] block">
                        5-Factor Deterministic Scoring Breakdown
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-slate-500 block">1. Industry Fit</span>
                          <span className="text-emerald-700 font-bold text-xs">{industryFit}/25 pts</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-slate-500 block">2. Company Profile</span>
                          <span className="text-emerald-700 font-bold text-xs">{companyProfile}/20 pts</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-slate-500 block">3. Geo Relevance</span>
                          <span className="text-blue-700 font-bold text-xs">{geoRelevance}/20 pts</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-slate-500 block">4. Product Fit</span>
                          <span className="text-indigo-700 font-bold text-xs">{productRelevance}/20 pts</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
                          <span className="text-slate-500 block">5. Triggers & Need</span>
                          <span className="text-purple-700 font-bold text-xs">{triggerStrength}/15 pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Professional AI Outreach Draft */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          Contextual Underwriter Outreach Draft
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onGenerateOutreach(lead.id)}
                            disabled={actionLoading === `outreach-${lead.id}`}
                            className="text-[11px] text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            {actionLoading === `outreach-${lead.id}` ? 'Regenerating...' : 'Regenerate Draft'}
                          </button>
                          
                          {lead.outreach_draft && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(lead.outreach_draft!);
                                showToast('Outreach draft copied to clipboard!');
                              }}
                              className="text-[11px] text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Copy Message
                            </button>
                          )}
                        </div>
                      </div>

                      {lead.outreach_draft ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 font-sans shadow-2xs">
                          <div className="text-[11px] text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                            <span>To: <strong className="text-slate-800">{lead.name || lead.company}</strong></span>
                            <span className="text-[10px] text-slate-500">Subject: Tailored Risk Intermediary Review</span>
                          </div>
                          <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                            {lead.outreach_draft}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500">
                          Click "Regenerate Draft" to draft personalized underwriting outreach for this prospect.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
