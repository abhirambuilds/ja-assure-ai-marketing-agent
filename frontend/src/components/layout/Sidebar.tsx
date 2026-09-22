import React from 'react';
import { 
  TrendingUp, 
  Wand2, 
  ShieldCheck, 
  Search, 
  Users, 
  BrainCircuit, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  type LucideIcon 
} from 'lucide-react';
import { JaAssureLogo } from '../common/BrandLogos';
import type { HealthCheckResponse } from '../../types';

export type TabType = 'dashboard' | 'studio' | 'review' | 'competitors' | 'leads' | 'digest' | 'learning' | 'analytics';

interface NavItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  badgeColor?: string;
}

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingReviewCount: number;
  health: HealthCheckResponse | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingReviewCount,
  health
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Executive Overview', icon: TrendingUp, badge: null },
    { id: 'studio', label: 'Content Studio', icon: Wand2, badge: null },
    { 
      id: 'review', 
      label: 'Review Center', 
      icon: ShieldCheck, 
      badge: pendingReviewCount > 0 ? pendingReviewCount : null,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' 
    },
    { id: 'competitors', label: 'Competitor Intel', icon: Search, badge: null },
    { id: 'leads', label: 'Lead Intelligence', icon: Users, badge: null },
    { id: 'digest', label: 'Executive Digest', icon: FileText, badge: null },
    { id: 'learning', label: 'Closed-Loop Memory', icon: BrainCircuit, badge: null },
    { id: 'analytics', label: 'Governance Analytics', icon: Layers, badge: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <JaAssureLogo size="sm" />
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            PORTAL
          </span>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>MODULE NAVIGATION</span>
          <span className="text-emerald-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> LIVE
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-slate-100 text-[#0c2340] font-bold border-l-4 border-[#0c2340]' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#0c2340]' : 'text-slate-400 group-hover:text-slate-600'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer — Engine & Regulatory Status */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2.5">
        {/* Groq AI Status Card */}
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-700 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              AI Engine
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              health?.llm_mode?.includes('live') 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {health?.llm_mode?.includes('live') ? 'GROQ LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Model</span>
            <span className="text-slate-700 font-medium">{health?.llm_model || 'llama-3.3-70b'}</span>
          </div>
        </div>

        {/* Regulatory & System Gate */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            {health?.database === 'connected' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            )}
            MAS / MOH Gate
          </span>
          <span className="text-emerald-700 font-semibold">Active</span>
        </div>

        {/* Lloyd's Affiliation */}
        <div className="text-[10px] text-slate-500 px-1 text-center font-medium border-t border-slate-200/60 pt-2">
          JA Assure • Lloyd's Coverholder
        </div>
      </div>
    </aside>
  );
};
