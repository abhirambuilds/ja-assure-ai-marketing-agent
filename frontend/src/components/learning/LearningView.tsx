import React from 'react';
import { 
  BrainCircuit, 
  History 
} from 'lucide-react';
import type { LessonLearned, Feedback } from '../../types';

interface LearningViewProps {
  lessons: LessonLearned[];
  feedbacks: Feedback[];
  onToggleLesson: (lessonId: number) => void;
}

export const LearningView: React.FC<LearningViewProps> = ({
  lessons,
  feedbacks,
  onToggleLesson
}) => {
  const activeCount = lessons.filter(l => l.active).length;
  const totalTriggers = lessons.reduce((acc, l) => acc + (l.frequency || 0), 0);

  return (
    <div className="space-y-6">
      {/* AI Learning Memory Command Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              AI Learning Memory & Closed-Loop Synthesis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Self-improving feedback loop converting reviewer corrections into persistent prompt steering rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
              {activeCount} Active Rules Steering Prompts
            </span>
          </div>
        </div>

        {/* Closed-Loop Learning Visual Diagram */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block mb-3">
            Closed-Loop Synthesis Pipeline Flow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-rose-300 space-y-1">
              <span className="text-[10px] text-rose-400 font-bold block">STAGE 1</span>
              <p className="font-semibold text-[11px]">Human Rejection</p>
              <span className="text-[9px] text-slate-400 not-italic block font-sans">Reason tag recorded</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">STAGE 2</span>
              <p className="font-semibold text-[11px]">Feedback Audit</p>
              <span className="text-[9px] text-slate-400 not-italic block font-sans">{feedbacks.length} items logged</span>
            </div>

            <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-800/40 text-indigo-300 space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold block">STAGE 3</span>
              <p className="font-semibold text-[11px]">AI Synthesis</p>
              <span className="text-[9px] text-slate-400 not-italic block font-sans">Generalizes rule</span>
            </div>

            <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 text-purple-300 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold block">STAGE 4</span>
              <p className="font-semibold text-[11px]">Lesson Stored</p>
              <span className="text-[9px] text-slate-400 not-italic block font-sans">{lessons.length} rules saved</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">STAGE 5</span>
              <p className="font-semibold text-[11px]">Prompt Guided</p>
              <span className="text-[9px] text-slate-400 not-italic block font-sans">{totalTriggers}x injected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Lessons Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Synthesized Prompt Rules ({lessons.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Click Toggle to Activate/Deactivate in System Prompts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <div 
              key={l.id} 
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                l.active 
                  ? 'border-purple-500/30 bg-[#0e1426]/80' 
                  : 'border-slate-800/80 opacity-60 bg-slate-900/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    {l.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                    Triggered {l.frequency}x
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium leading-relaxed font-sans">
                  {l.lesson}
                </p>

                {l.examples && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-sans">
                    "{l.examples}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px]">
                <span className={`font-mono font-semibold ${l.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {l.active ? '● Active in Prompts' : '○ Deactivated'}
                </span>
                <button
                  onClick={() => onToggleLesson(l.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    l.active 
                      ? 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  {l.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Review Feedback History Log */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <History className="w-4 h-4 text-rose-400" />
            Human Review Audit History Log ({feedbacks.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Source Audit Records Stored in SQLite
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No rejection feedback recorded yet. 100% initial pass rate!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto">
            {feedbacks.map((f) => (
              <div key={f.id} className="py-3 text-xs space-y-1.5 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-mono px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 uppercase">
                    {f.reason_tag.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                <p><strong className="text-slate-300">Reviewer Note:</strong> {f.notes}</p>
                <p className="text-slate-400 font-mono text-[11px] line-clamp-1">
                  <strong className="text-slate-500">Original Copy:</strong> {f.original_content}
                </p>
                {f.corrected_content && (
                  <p className="text-emerald-400 font-mono text-[11px] line-clamp-1">
                    <strong className="text-emerald-500">Corrected Copy:</strong> {f.corrected_content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
