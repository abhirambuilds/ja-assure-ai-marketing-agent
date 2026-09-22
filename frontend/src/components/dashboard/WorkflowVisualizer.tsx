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
      desc: 'Competitor & Whitespace Intel',
      status: 'Continuous',
      statusColor: 'text-blue-700 bg-blue-50 border-blue-200',
      accent: 'border-slate-200'
    },
    {
      step: '02',
      name: 'AI DRAFTS',
      icon: Sparkles,
      desc: 'Persona-Driven A/B Generation',
      status: `${totalGenerated} Total`,
      statusColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      accent: 'border-slate-200'
    },
    {
      step: '03',
      name: 'COMPLIANCE',
      icon: ShieldCheck,
      desc: 'MAS & MOH 6-Rule Audit',
      status: `${complianceAvg}% Index`,
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      accent: 'border-slate-200'
    },
    {
      step: '04',
      name: 'REVIEW GATE',
      icon: UserCheck,
      desc: 'Mandatory Human Sign-off',
      status: `${pendingCount} Pending`,
      statusColor: pendingCount > 0 ? 'text-amber-800 bg-amber-50 border-amber-300 font-bold' : 'text-slate-600 bg-slate-100 border-slate-200',
      accent: pendingCount > 0 ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'
    },
    {
      step: '05',
      name: 'FEEDBACK',
      icon: MessageSquareX,
      desc: 'Rejections & Inline Edits',
      status: 'Logged',
      statusColor: 'text-rose-700 bg-rose-50 border-rose-200',
      accent: 'border-slate-200'
    },
    {
      step: '06',
      name: 'LESSONS',
      icon: BrainCircuit,
      desc: 'AI Synthesizes Policy Rules',
      status: `${activeLessons} Active`,
      statusColor: 'text-purple-700 bg-purple-50 border-purple-200',
      accent: 'border-slate-200'
    },
    {
      step: '07',
      name: 'IMPROVEMENT',
      icon: TrendingUp,
      desc: 'Prompts Dynamically Guided',
      status: 'Optimizing',
      statusColor: 'text-amber-900 bg-amber-100 border-amber-300 font-bold',
      accent: 'border-amber-200 bg-amber-50/30'
    }
  ];

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              Autonomous Closed-Loop Differentiator
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Self-Improving Memory
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Unlike stateless models, human feedback directly synthesizes persistent rules for future generation cycles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
              className={`p-3 rounded-lg bg-slate-50 hover:bg-slate-100/80 border ${stage.accent} flex flex-col justify-between space-y-2 relative transition-all shadow-2xs`}
            >
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{stage.step}</span>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">{stage.name}</h4>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{stage.desc}</p>
              </div>

              <div className="pt-1.5 border-t border-slate-200/60">
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border inline-block ${stage.statusColor}`}>
                  {stage.status}
                </span>
              </div>

              {/* Directional Indicator */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs z-10 pointer-events-none">
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
