import React from 'react';
import { RefreshCw, Sliders } from 'lucide-react';
import { JaAssureLogo } from '../common/BrandLogos';
import type { HealthCheckResponse } from '../../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'studio' | 'review' | 'competitors' | 'leads' | 'learning' | 'analytics';
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  health: HealthCheckResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

const tabMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Overview',
    subtitle: 'Autonomous InsurTech marketing operations and multi-brand portfolio governance'
  },
  studio: {
    title: 'Multi-Brand Content Studio',
    subtitle: 'Persona-aligned generation with automated statutory compliance and persistent lesson injection'
  },
  review: {
    title: 'Human Governance & Review Center',
    subtitle: 'Mandatory human sign-off gate before publishing dispatch. Editorial feedback continuously trains AI memory'
  },
  competitors: {
    title: 'Market Intelligence & Whitespace',
    subtitle: 'Source-backed competitor tracking, positioning analysis, and counter-messaging opportunities'
  },
  leads: {
    title: 'B2B Lead Intelligence & Prospecting',
    subtitle: '5-factor underwriting qualification scoring with tailored AI-assisted risk outreach'
  },
  learning: {
    title: 'Closed-Loop Learning Repository',
    subtitle: 'Autonomous memory synthesizing human rejections and edits into active prompt steering rules'
  },
  analytics: {
    title: 'Operational Governance Analytics',
    subtitle: 'Live KPIs, regulatory pass rates, compliance health bands, and simulated dispatch activity'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  selectedBrand,
  setSelectedBrand,
  health,
  loading,
  onRefresh
}) => {
  const current = tabMeta[activeTab] || tabMeta.dashboard;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: JA Assure Logo & Context */}
        <div className="flex items-center gap-5">
          <JaAssureLogo size="md" />

          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              {current.title}
            </h1>
            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Brand Controls & Status */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Brand Portfolio Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-[#0c2340]" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Portfolio:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent text-xs text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Brands (Portfolio)</option>
              <option value="jade">Jade (Luxury Jewellery)</option>
              <option value="doctorshield">DoctorShield (Med Indemnity)</option>
              <option value="jaguartransit">Jaguar Transit (Cargo)</option>
            </select>
          </div>

          {/* Engine Health Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-medium">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <span className="text-slate-700 text-[11px]">
              {health?.llm_mode?.includes('live') ? 'Groq LLaMA 3.3' : 'InsurTech Engine'}
            </span>
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Refresh All Database Signals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0c2340]' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
