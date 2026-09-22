import React from 'react';
import { 
  Layers, 
  PieChart, 
  ShieldCheck, 
  BarChart3, 
  TrendingUp, 
  XCircle, 
  Users, 
  Calendar
} from 'lucide-react';
import type { DashboardSummary, PublishingRecord, Feedback } from '../../types';

interface AnalyticsViewProps {
  summary: DashboardSummary | null;
  publishingRecords: PublishingRecord[];
  feedbacks: Feedback[];
  onCancelPublishing: (recordId: number) => void;
  actionLoading: string | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  publishingRecords,
  feedbacks,
  onCancelPublishing,
  actionLoading
}) => {
  if (!summary) return null;

  const tot = summary.total_content || 0;
  const appr = summary.human_approved || summary.approved || 0;
  const rej = summary.rejected || 0;
  const pend = summary.pending_human_review || 0;
  const approvalRate = summary.approval_rate !== undefined 
    ? summary.approval_rate 
    : (tot > 0 ? Number(((appr / tot) * 100).toFixed(1)) : 0);
  const rejectionRate = summary.rejection_rate !== undefined
    ? summary.rejection_rate
    : (tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0);
  const pendingRate = tot > 0 ? Number(((pend / tot) * 100).toFixed(1)) : 0;

  // Donut geometry: circle r=36, circumference = 2 * PI * 36 = 226.19
  const c = 226.19;
  const apprStroke = (approvalRate / 100) * c;
  const rejStroke = (rejectionRate / 100) * c;
  const pendStroke = (pendingRate / 100) * c;

  const compDist = summary.compliance_score_distribution || { '90_100': 0, '80_89': 0, '<80': 0 };
  const highComp = compDist['90_100'] || compDist['high_90_100'] || 0;
  const medComp = compDist['80_89'] || compDist['medium_80_89'] || 0;
  const lowComp = compDist['<80'] || compDist['flagged_below_80'] || 0;
  const compTotal = Math.max(1, highComp + medComp + lowComp);

  const leadDist = summary.lead_score_distribution || { 'tier_1_high': 0, 'tier_2_moderate': 0, 'tier_3_emerging': 0 };
  const t1 = leadDist['tier_1_high'] || leadDist['high_fit_80_plus'] || 0;
  const t2 = leadDist['tier_2_moderate'] || leadDist['moderate_fit_60_79'] || 0;
  const t3 = leadDist['tier_3_emerging'] || leadDist['general_below_60'] || 0;
  const leadTotal = Math.max(1, t1 + t2 + t3);

  return (
    <div className="space-y-6">
      {/* Analytics Command Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            InsurTech Operational & Governance Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time regulatory pass rates, compliance health distributions, and simulated dispatch telemetry
          </p>
        </div>
        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
          Telemetry Synchronized
        </span>
      </div>

      {/* 10 Operational Live KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Content Generated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">1. Generated</span>
          <div className="text-2xl font-bold text-slate-900">{summary.total_content}</div>
          <span className="text-[10px] text-slate-400">Drafted variations</span>
        </div>

        {/* 2. Pending Human Review */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-amber-800 block">2. Awaiting Review</span>
          <div className="text-2xl font-bold text-amber-800">{summary.pending_human_review}</div>
          <span className="text-[10px] text-amber-700/80">Requires sign-off</span>
        </div>

        {/* 3. Approved */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-emerald-800 block">3. Human Approved</span>
          <div className="text-2xl font-bold text-emerald-700">{appr}</div>
          <span className="text-[10px] text-emerald-600">Verified & compliant</span>
        </div>

        {/* 4. Rejected */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-rose-800 block">4. Rejected</span>
          <div className="text-2xl font-bold text-rose-700">{rej}</div>
          <span className="text-[10px] text-rose-600">Lessons synthesized</span>
        </div>

        {/* 5. Approval Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">5. Approval Rate</span>
          <div className="text-2xl font-bold text-emerald-700">{approvalRate}%</div>
          <span className="text-[10px] text-slate-400">Editorial acceptance</span>
        </div>

        {/* 6. Rejection Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">6. Rejection Rate</span>
          <div className="text-2xl font-bold text-rose-700">{rejectionRate}%</div>
          <span className="text-[10px] text-slate-400">Feedback trigger rate</span>
        </div>

        {/* 7. Avg Compliance Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">7. Avg Compliance</span>
          <div className="text-2xl font-bold text-blue-700">{summary.average_compliance_score}%</div>
          <span className="text-[10px] text-slate-400">MAS / MOH safety score</span>
        </div>

        {/* 8. Avg Lead Fit Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">8. Avg Lead Fit</span>
          <div className="text-2xl font-bold text-indigo-700">{summary.average_lead_score}%</div>
          <span className="text-[10px] text-slate-400">B2B buyer match</span>
        </div>

        {/* 9. Active Lessons */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">9. Active Lessons</span>
          <div className="text-2xl font-bold text-purple-700">
            {summary.active_lessons_count !== undefined ? summary.active_lessons_count : summary.total_lessons_learned}
          </div>
          <span className="text-[10px] text-slate-400">Steering future prompts</span>
        </div>

        {/* 10. Feedback Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase text-slate-500 block">10. Feedback Volume</span>
          <div className="text-2xl font-bold text-slate-800">
            {summary.total_feedback_count !== undefined ? summary.total_feedback_count : feedbacks.length}
          </div>
          <span className="text-[10px] text-slate-400">Reviewer audits recorded</span>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Approval vs. Rejection Governance Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Approval vs. Rejection Distribution
            </h3>
            <span className="text-[11px] text-slate-500">Total: {tot} Items</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="14"
                />
                {tot > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray={`${apprStroke} ${c}`}
                    strokeDashoffset="0"
                    className="transition-all duration-500"
                  />
                )}
                {tot > 0 && rej > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="14"
                    strokeDasharray={`${rejStroke} ${c}`}
                    strokeDashoffset={String(-apprStroke)}
                    className="transition-all duration-500"
                  />
                )}
                {tot > 0 && pend > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray={`${pendStroke} ${c}`}
                    strokeDashoffset={String(-(apprStroke + rejStroke))}
                    className="transition-all duration-500"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-900">{approvalRate}%</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Pass Rate</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2.5 w-full max-w-xs text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Human Approved
                </span>
                <span className="font-semibold text-emerald-700">
                  {appr} ({approvalRate}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Rejected & Learned
                </span>
                <span className="font-semibold text-rose-700">
                  {rej} ({rejectionRate}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Pending Review
                </span>
                <span className="font-semibold text-amber-800">
                  {pend} ({pendingRate}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual 2: Regulatory Compliance Health Bands */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Regulatory Compliance Health Bands
            </h3>
            <span className="text-[11px] text-blue-700 font-semibold">Avg {summary.average_compliance_score}%</span>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${(highComp / compTotal) * 100}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`90-100%: ${highComp}`}
            />
            <div
              style={{ width: `${(medComp / compTotal) * 100}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`80-89%: ${medComp}`}
            />
            <div
              style={{ width: `${(lowComp / compTotal) * 100}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`<80%: ${lowComp}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 block">90 - 100%</span>
              <div className="text-base font-bold text-emerald-700">{highComp} items</div>
              <span className="text-[10px] text-emerald-700">High Confidence</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 block">80 - 89%</span>
              <div className="text-base font-bold text-amber-800">{medComp} items</div>
              <span className="text-[10px] text-amber-700">Compliant / Audit OK</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[10px] font-bold text-rose-800 block">&lt; 80%</span>
              <div className="text-base font-bold text-rose-700">{lowComp} items</div>
              <span className="text-[10px] text-rose-700">Rewrite Required</span>
            </div>
          </div>
        </div>

        {/* Visual 3: Content Production by Brand */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Content Production by Brand
          </h3>

          <div className="space-y-3 pt-1">
            {Object.entries(summary.brand_breakdown).length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No brand data recorded</div>
            ) : (
              Object.entries(summary.brand_breakdown).map(([brand, count]) => {
                const pct = tot > 0 ? ((count / tot) * 100).toFixed(0) : 0;
                const brandColor = 
                  brand === 'jade' ? 'bg-emerald-500' :
                  brand === 'doctorshield' ? 'bg-blue-600' :
                  brand === 'jaguartransit' ? 'bg-amber-500' : 'bg-blue-600';
                return (
                  <div key={brand} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span className="capitalize">{brand === 'jaguartransit' ? 'Jaguar Transit' : brand === 'doctorshield' ? 'DoctorShield' : 'Jade'}</span>
                      <span className="text-slate-500">{count} items ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${brandColor} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual 4: Content by Target Platform */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Content by Target Platform
          </h3>

          <div className="space-y-3 pt-1">
            {Object.entries(summary.platform_breakdown).length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No platform data recorded</div>
            ) : (
              Object.entries(summary.platform_breakdown).map(([platform, count]) => {
                const pct = tot > 0 ? ((count / tot) * 100).toFixed(0) : 0;
                return (
                  <div key={platform} className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span className="capitalize">{platform}</span>
                      <span className="text-slate-500">{count} items ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visual 5: Top Rejection Reasons */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            Top Rejection Reasons & Safety Blocks
          </h3>

          <div className="space-y-3 pt-1">
            {Object.entries(summary.feedback_reason_frequency).length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No rejections recorded. 100% first-pass rate!</div>
            ) : (
              Object.entries(summary.feedback_reason_frequency).map(([reason, count]) => (
                <div key={reason} className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="capitalize font-medium">{reason.replace(/_/g, ' ')}</span>
                    <span className="text-rose-700 font-semibold">{count} occurrences</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, count * 20)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visual 6: B2B Lead Fit Score Tiers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              B2B Lead Score Distribution
            </h3>
            <span className="text-[11px] text-indigo-700 font-semibold">Avg {summary.average_lead_score}% Fit</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Tier 1: High Intent (80 - 100%)</span>
                <span className="text-emerald-700 font-semibold">{t1} leads</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(t1 / leadTotal) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Tier 2: Moderate Intent (60 - 79%)</span>
                <span className="text-blue-700 font-semibold">{t2} leads</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(t2 / leadTotal) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Tier 3: Emerging Incubator (&lt; 60%)</span>
                <span className="text-slate-500 font-semibold">{t3} leads</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${(t3 / leadTotal) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual 7 (Full Width): Simulated Publishing Dispatch Activity Log */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Simulated Publishing Dispatch Log
            </h3>
            <p className="text-xs text-slate-500">
              Human-approved content staged for simulated publishing. No live social API keys are triggered.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 w-fit">
            SIMULATED DISPATCH ONLY
          </span>
        </div>

        {publishingRecords.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">No simulated dispatches scheduled yet.</p>
            <p>Approve items in the Review Center and click "Schedule Dispatch Preview" to simulate posting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Content ID</th>
                  <th className="py-2.5 px-3">Target Platform</th>
                  <th className="py-2.5 px-3">Scheduled At</th>
                  <th className="py-2.5 px-3">Dispatch Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {publishingRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">#{rec.id}</td>
                    <td className="py-3 px-3 text-blue-700 font-medium">Item #{rec.content_id}</td>
                    <td className="py-3 px-3 capitalize font-semibold text-slate-800">{rec.platform}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {rec.scheduled_at ? new Date(rec.scheduled_at).toLocaleString() : 'Immediate'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                        Simulated Preview
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.status === 'scheduled' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        rec.status === 'cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {rec.status === 'scheduled' ? (
                        <button
                          onClick={() => onCancelPublishing(rec.id)}
                          disabled={actionLoading === `cancel-pub-${rec.id}`}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] transition-colors cursor-pointer"
                        >
                          Cancel Dispatch
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
