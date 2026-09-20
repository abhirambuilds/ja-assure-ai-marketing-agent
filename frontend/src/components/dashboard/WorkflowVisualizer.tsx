import React from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  MessageSquareX, 
  BrainCircuit, 
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

interface WorkflowVisualizerProps {
  pendingCount?: number;
  complianceAvg?: number;
  activeLessons?: number;
  totalGenerated?: number;
}

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  pendingCount = 0,
  complianceAvg = 87,
  activeLessons = 6,
  totalGenerated = 0
}) => {
  const stages = [
    {
      step: '01',
      name: 'RESEARCH',
      icon: Search,
      desc: 'Competitor & Regulatory Intel',
      status: 'Continuous',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      accent: 'border-cyan-500/30'
    },
    {
      step: '02',
      name: 'AI GENERATION',
      icon: Sparkles,
      desc: 'Persona-Driven A/B Drafts',
      status: `${totalGenerated} Total`,
      statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      accent: 'border-indigo-500/30'
    },
    {
      step: '03',
      name: 'COMPLIANCE',
      icon: ShieldCheck,
      desc: 'MAS & MOH 6-Rule Audit',
      status: `${complianceAvg}% Index`,
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      accent: 'border-emerald-500/30'
    },
    {
      step: '04',
      name: 'HUMAN REVIEW',
      icon: UserCheck,
      desc: 'Mandatory Sign-off Gate',
      status: `${pendingCount} Pending`,
      statusColor: pendingCount > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-400 bg-slate-800/40 border-slate-700',
      accent: 'border-amber-500/40 bg-amber-950/10'
    },
    {
      step: '05',
      name: 'FEEDBACK',
      icon: MessageSquareX,
      desc: 'Rejections & Inline Edits',
      status: 'Logged',
      statusColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      accent: 'border-rose-500/30'
    },
    {
      step: '06',
      name: 'LESSON',
      icon: BrainCircuit,
      desc: 'AI Synthesizes General Rule',
      status: `${activeLessons} Active`,
      statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      accent: 'border-purple-500/30'
    },
    {
      step: '07',
      name: 'BETTER CONTENT',
      icon: TrendingUp,
      desc: 'Prompt Dynamically Guided',
      status: 'Self-Optimizing',
      statusColor: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
      accent: 'border-amber-500/40 bg-amber-950/10'
    }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Autonomous Closed-Loop Differentiator
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Self-Improving Memory
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Unlike stateless AI models, human feedback directly synthesizes persistent rules for future generation cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Closed-Loop Pipeline Armed</span>
        </div>
      </div>

      {/* 7-Stage Pipeline Visualizer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div 
              key={stage.step}
              className={`p-3 rounded-xl bg-slate-900/80 border ${stage.accent} flex flex-col justify-between space-y-2 relative transition-all hover:bg-slate-900`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-slate-800/90 text-slate-300 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-bold">{stage.step}</span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-200 tracking-wide font-mono uppercase">{stage.name}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{stage.desc}</p>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80">
                <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border inline-block ${stage.statusColor}`}>
                  {stage.status}
                </span>
              </div>

              {/* Subdued Directional Indicator */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 font-mono text-xs z-10 pointer-events-none">
                  ›
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
