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
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-600" />
              AI Learning Memory & Closed-Loop Synthesis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Self-improving feedback loop converting reviewer corrections into persistent prompt steering rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
              {activeCount} Active Rules Steering Prompts
            </span>
          </div>
        </div>

        {/* Closed-Loop Learning Visual Diagram */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-3">
            Closed-Loop Synthesis Pipeline Flow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-rose-800 space-y-1 shadow-2xs">
              <span className="text-[10px] text-rose-600 font-bold block">STAGE 1</span>
              <p className="font-semibold text-[11px]">Human Rejection</p>
              <span className="text-[10px] text-slate-500 not-italic block">Reason tag recorded</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 space-y-1 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-bold block">STAGE 2</span>
              <p className="font-semibold text-[11px]">Feedback Audit</p>
              <span className="text-[10px] text-slate-500 not-italic block">{feedbacks.length} items logged</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 text-blue-800 space-y-1 shadow-2xs">
              <span className="text-[10px] text-blue-600 font-bold block">STAGE 3</span>
              <p className="font-semibold text-[11px]">AI Synthesis</p>
              <span className="text-[10px] text-slate-500 not-italic block">Generalizes rule</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 text-purple-800 space-y-1 shadow-2xs">
              <span className="text-[10px] text-purple-600 font-bold block">STAGE 4</span>
              <p className="font-semibold text-[11px]">Lesson Stored</p>
              <span className="text-[10px] text-slate-500 not-italic block">{lessons.length} rules saved</span>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 text-emerald-800 space-y-1 shadow-2xs">
              <span className="text-[10px] text-emerald-600 font-bold block">STAGE 5</span>
              <p className="font-semibold text-[11px]">Prompt Guided</p>
              <span className="text-[10px] text-slate-500 not-italic block">{totalTriggers}x injected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Lessons Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            Synthesized Prompt Rules ({lessons.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Click Toggle to Activate/Deactivate in System Prompts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <div 
              key={l.id} 
              className={`bg-white p-5 rounded-xl border transition-all flex flex-col justify-between space-y-3 shadow-2xs ${
                l.active 
                  ? 'border-purple-200' 
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                    {l.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    Triggered {l.frequency}x
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-medium leading-relaxed font-sans">
                  {l.lesson}
                </p>

                {l.examples && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-sans">
                    "{l.examples}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px]">
                <span className={`font-semibold ${l.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {l.active ? '● Active in Prompts' : '○ Deactivated'}
                </span>
                <button
                  onClick={() => onToggleLesson(l.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    l.active 
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-rose-600" />
            Human Review Audit History Log ({feedbacks.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Source Audit Records Stored in PostgreSQL
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No rejection feedback recorded yet. 100% initial pass rate!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {feedbacks.map((f) => (
              <div key={f.id} className="py-3 text-xs space-y-1.5 font-sans">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 uppercase">
                    {f.reason_tag.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400 text-[10px]">{new Date(f.created_at).toLocaleString()}</span>
                </div>
                <p><strong className="text-slate-700">Reviewer Note:</strong> {f.notes}</p>
                <p className="text-slate-500 text-[11px] line-clamp-1">
                  <strong className="text-slate-600">Original Copy:</strong> {f.original_content}
                </p>
                {f.corrected_content && (
                  <p className="text-emerald-700 text-[11px] line-clamp-1 font-medium">
                    <strong className="text-emerald-800">Corrected Copy:</strong> {f.corrected_content}
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
