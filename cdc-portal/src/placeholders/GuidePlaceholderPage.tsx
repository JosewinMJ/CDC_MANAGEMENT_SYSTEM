import React from 'react';
import { UserCheck, CheckCircle2, ArrowLeft, BookOpen, Users, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GuidePlaceholderPage: React.FC = () => {
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
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Future Module (Report Section 4)
            </span>
            <h1 className="text-2xl font-bold text-[#142B4A] mt-1">Guide Portal – Faculty Mentor</h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          The Guide Portal is architected to plug directly into this system. As defined in Section 4 of the Functional Report, faculty mentors will use this area to monitor assigned students, review resumes and verified credentials, evaluate 3-track internship requests, and communicate official mentoring guidance.
        </p>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-4">
            Implementation Scope Ready for Integration:
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Users className="w-4 h-4 text-emerald-600" />
                4.1 & 4.2 Assigned Students Roster
              </div>
              <p className="text-xs text-slate-600">
                Real-time visibility into assigned mentees (e.g. User), profile completion rings, pending documents, and placement status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                4.4 Internship Review Workflow
              </div>
              <p className="text-xs text-slate-600">
                Review summer, hybrid, and 7th/8th sem submissions with approval decisions and official remarks (testable right now via the Demo Controls drawer).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                4.5 Mentoring Notes & Privacy Rules
              </div>
              <p className="text-xs text-slate-600">
                Confidential faculty notes strictly isolated from student visibility according to Section 4.6 privacy boundaries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Shared Services & Types
              </div>
              <p className="text-xs text-slate-600">
                Reuses <code>internshipService</code>, <code>studentService</code>, and identical UI tokens without refactoring.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
