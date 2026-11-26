import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Clock,
  Info,
} from 'lucide-react';
import { codingChallengeService } from '../../services/codingChallengeService';
import { WeeklyReport } from '../../shared/types';

export const WeeklyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const profile = await codingChallengeService.getCodingProfile();
    setReports(profile.weeklyReports);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Weekly Performance & Consistency Reports</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Archived weekly totals and target compliance audits reset every Sunday at 11:59 PM IST
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#2855A6] flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Sunday Reset Protocol:</strong> The CDC algorithmic preparation target requires <strong>10 verified problems per week</strong>. The count resets automatically every Sunday at midnight IST. Past performance records are permanently archived below for mentor reference.
        </span>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Week Cycle</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Week Ending (Sunday)</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Easy</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Medium</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Hard</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Solved This Week</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">Cumulative Solves</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-center">CDC Posted Done</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Target Audit Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map(rep => (
                <tr key={rep.weekNumber} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                    Week {rep.weekNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {rep.weekEndingDate}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-emerald-700">
                    {rep.easy}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-amber-700">
                    {rep.medium}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-rose-700">
                    {rep.hard}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-[#2855A6]">
                    {rep.solvedThisWeek}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {rep.totalSinceStart}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                    {rep.postedQuestionsDone}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {rep.targetMet ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Target Met (10+)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Below Target (10)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
