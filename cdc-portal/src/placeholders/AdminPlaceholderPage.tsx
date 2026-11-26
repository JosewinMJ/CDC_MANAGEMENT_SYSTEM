import React from 'react';
import { ShieldCheck, ArrowLeft, Building, FileCheck2, BarChart2, CalendarRange } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Link
        to="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2855A6] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Student Portal
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Future Module (Report Section 5)
            </span>
            <h1 className="text-2xl font-bold text-[#142B4A] mt-1">Admin Portal – CDC & Placement Administration</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          The Admin Portal is the institutional hub for Career Development Centre operations. As specified in Section 5 of the Functional Report, authorized coordinators will manage recruitment drives, verify student academic records, oversee final internship approvals, configure eligibility thresholds, and track multi-year historical placement analytics.
        </p>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-4">
            Core Modules Ready for Integration:
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building className="w-4 h-4 text-purple-600" />
                5.4 Company & Drive Management
              </div>
              <p className="text-xs text-slate-600">
                Add recruitment drives with multiple job roles, CTC packages, criteria configurations, and recruitment stages that directly feed into the student portal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                5.6 Final Internship Coordination
              </div>
              <p className="text-xs text-slate-600">
                Review guide-approved internships, record coordinator approval, verify completion certificates, and award credits.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <CalendarRange className="w-4 h-4 text-purple-600" />
                5.9 Academic Year Archival
              </div>
              <p className="text-xs text-slate-600">
                Retains multi-year historical data (e.g. 2024-2025, 2025-2026, 2026-2027) so past records are never overwritten.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                5.10 Placement Analytics & MOUs
              </div>
              <p className="text-xs text-slate-600">
                Department-wise placement conversions, highest/average CTC calculations, and corporate MOU tracking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
