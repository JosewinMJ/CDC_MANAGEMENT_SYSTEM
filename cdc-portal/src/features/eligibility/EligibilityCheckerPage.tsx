import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  RefreshCw,
  Info,
  ArrowRight,
  ShieldCheck,
  Code2,
} from 'lucide-react';
import { companyService } from '../../services/companyService';
import { eligibilityService } from '../../services/eligibilityService';
import { db, subscribeToStore } from '../../services/storage';
import {
  Company,
  JobRole,
  Student,
  EligibilityResult,
  EligibilityStatus,
} from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const EligibilityCheckerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(searchParams.get('roleId') || '');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentRole, setCurrentRole] = useState<JobRole | null>(null);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { showToast } = useNotification();

  const loadData = async (targetRoleId?: string) => {
    const comps = await companyService.getCompanies();
    setCompanies(comps);

    const roleToEval = targetRoleId || selectedRoleId || comps[0]?.roles[0]?.id;
    if (roleToEval) {
      setSelectedRoleId(roleToEval);
      const evalRes = await eligibilityService.checkEligibility(roleToEval);
      if (evalRes) {
        setCurrentCompany(evalRes.company);
        setCurrentRole(evalRes.role);
        setResult(evalRes.result);
      }
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore('cdc_student', () => loadData(selectedRoleId));
    return () => unsub();
  }, [selectedRoleId]);

  const handleRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId);
    const evalRes = await eligibilityService.checkEligibility(roleId);
    if (evalRes) {
      setCurrentCompany(evalRes.company);
      setCurrentRole(evalRes.role);
      setResult(evalRes.result);
    }
  };

  const handleRecheck = async () => {
    setIsRecalculating(true);
    setTimeout(async () => {
      const evalRes = await eligibilityService.checkEligibility(selectedRoleId);
      if (evalRes) {
        setResult(evalRes.result);
      }
      setIsRecalculating(false);
      showToast({ type: 'success', title: 'Eligibility Recalculated', message: 'Assessed against verified academic credentials.' });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Company Eligibility Assessment Engine</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Automated evaluation matching verified student profile against mandatory recruitment criteria
          </p>
        </div>

        <button
          onClick={handleRecheck}
          disabled={isRecalculating}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl shadow-xs transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
          <span>{isRecalculating ? 'Evaluating...' : 'Recheck Eligibility'}</span>
        </button>
      </div>

      {/* Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <label className="block text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2">
          Select Target Company & Recruitment Drive:
        </label>

        <select
          value={selectedRoleId}
          onChange={e => handleRoleChange(e.target.value)}
          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
        >
          {companies.map(comp => (
            <optgroup key={comp.id} label={comp.name}>
              {comp.roles.map(r => (
                <option key={r.id} value={r.id}>
                  {comp.name} – {r.roleTitle} ({r.packageCtc})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Main Assessment Outcome Card */}
      {result && currentCompany && currentRole && (
        <div className="space-y-6">
          <div
            className={`rounded-2xl border p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              result.overallStatus === EligibilityStatus.ELIGIBLE
                ? 'bg-emerald-50/70 border-emerald-300'
                : result.overallStatus === EligibilityStatus.NOT_ELIGIBLE
                ? 'bg-rose-50/70 border-rose-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  result.overallStatus === EligibilityStatus.ELIGIBLE
                    ? 'bg-emerald-600 text-white'
                    : result.overallStatus === EligibilityStatus.NOT_ELIGIBLE
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {result.overallStatus === EligibilityStatus.ELIGIBLE && <CheckCircle className="w-6 h-6" />}
                {result.overallStatus === EligibilityStatus.NOT_ELIGIBLE && <XCircle className="w-6 h-6" />}
                {result.overallStatus === EligibilityStatus.PENDING_VERIFICATION && <Clock className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Overall Evaluation Result:
                  </span>
                  <StatusBadge status={result.overallStatus} />
                </div>

                <h2 className="text-xl font-bold text-[#142B4A] mt-1">
                  {result.overallStatus === EligibilityStatus.ELIGIBLE
                    ? `Eligible for ${currentCompany.name} (${currentRole.roleTitle})`
                    : result.overallStatus === EligibilityStatus.NOT_ELIGIBLE
                    ? `Not Eligible for ${currentCompany.name} (${currentRole.roleTitle})`
                    : `Pending Verification for ${currentCompany.name}`}
                </h2>

                {result.summaryReason && (
                  <p className="text-xs text-rose-800 font-medium mt-1 leading-relaxed">
                    Reason: {result.summaryReason}
                  </p>
                )}
              </div>
            </div>

            {result.overallStatus === EligibilityStatus.ELIGIBLE && (
              <button
                onClick={() => navigate(`/student/companies/${currentCompany.id}`)}
                className="px-5 py-2.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <span>Proceed to Apply</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Detailed Criteria Comparison Breakdown Table (UI Spec Section 7) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider mb-4">
              Detailed Criteria Breakdown & Evaluation
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Criteria Parameter</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Student Profile Details</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company Requirement</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Result</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider">Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* CGPA */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">Cumulative CGPA</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.cgpa.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.cgpa.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.cgpa.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{result.criteriaBreakdown.cgpa.reason || 'Satisfies requirement'}</td>
                  </tr>

                  {/* 10th Marks */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">10th Grade Percentage</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.tenthMarks.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.tenthMarks.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.tenthMarks.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{result.criteriaBreakdown.tenthMarks.reason || 'Satisfies requirement'}</td>
                  </tr>

                  {/* 12th Marks */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">12th Grade / PUC Percentage</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.twelfthMarks.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.twelfthMarks.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.twelfthMarks.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{result.criteriaBreakdown.twelfthMarks.reason || 'Satisfies requirement'}</td>
                  </tr>

                  {/* Active Backlogs */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">Active Backlogs</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.activeBacklogs.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.activeBacklogs.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.activeBacklogs.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{result.criteriaBreakdown.activeBacklogs.reason || 'No backlog penalty'}</td>
                  </tr>

                  {/* Permitted Branch */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">Degree Branch</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.branch.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.branch.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.branch.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{result.criteriaBreakdown.branch.reason || 'Eligible branch stream'}</td>
                  </tr>

                  {/* Optional Coding Practice criterion */}
                  {result.criteriaBreakdown.codingPractice && (
                    <tr className="hover:bg-slate-50/80 transition bg-orange-50/30">
                      <td className="py-3.5 px-4 font-bold text-orange-950 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-orange-600" />
                        Coding Practice (LeetCode)
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{result.criteriaBreakdown.codingPractice.studentValue}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.codingPractice.requiredValue}</td>
                      <td className="py-3.5 px-4">
                        {result.criteriaBreakdown.codingPractice.passed ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Passed
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            Not Met
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-orange-800 font-medium">
                        {result.criteriaBreakdown.codingPractice.reason || 'Target met on Daily Coding Challenge'}
                      </td>
                    </tr>
                  )}

                  {/* Academic Verification status */}
                  <tr className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-[#142B4A]">Official Verification Status</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{result.criteriaBreakdown.academicVerification.studentValue}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{result.criteriaBreakdown.academicVerification.requiredValue}</td>
                    <td className="py-3.5 px-4">
                      {result.criteriaBreakdown.academicVerification.passed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Passed
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {result.criteriaBreakdown.academicVerification.reason || 'Verified by CDC Placement Office'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Informational Policy Note (UI Spec Section 7) */}
            <div className="mt-5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-2.5 text-xs text-[#2855A6]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Placement Disclaimer:</strong> Eligibility assessment verifies that your profile satisfies the company's mandatory academic thresholds. It does not guarantee shortlisting or final selection, which depends on performance in subsequent assessments and interviews.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
