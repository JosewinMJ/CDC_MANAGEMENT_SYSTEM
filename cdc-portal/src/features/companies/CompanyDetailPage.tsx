import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  ShieldAlert,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { companyService } from '../../services/companyService';
import { applicationService } from '../../services/applicationService';
import { eligibilityService } from '../../services/eligibilityService';
import { db } from '../../services/storage';
import { Company, JobRole, EligibilityResult, EligibilityStatus, Application } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const CompanyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<Company | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    if (!id) return;
    const comp = await companyService.getCompanyById(id);
    if (!comp) {
      navigate('/student/companies');
      return;
    }
    setCompany(comp);
    setSelectedRole(comp.roles[0]);

    const apps = await applicationService.getApplications();
    setApplications(apps);

    // Check eligibility for first role
    const elRes = await eligibilityService.checkEligibility(comp.roles[0].id);
    if (elRes) setEligibilityResult(elRes.result);
  };

  const handleRoleSelect = async (role: JobRole) => {
    setSelectedRole(role);
    const elRes = await eligibilityService.checkEligibility(role.id);
    if (elRes) setEligibilityResult(elRes.result);
  };

  const isAppliedForSelectedRole = applications.some(
    a => a.companyId === company?.id && a.roleId === selectedRole?.id
  );

  const isEligibleForSelectedRole =
    eligibilityResult?.overallStatus === EligibilityStatus.ELIGIBLE;

  const handleApplyConfirm = async () => {
    if (!company || !selectedRole) return;

    try {
      await applicationService.applyForRole(company.id, selectedRole.id);
      setIsApplyModalOpen(false);

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast({
        type: 'success',
        title: 'Application Submitted Successfully!',
        message: `You have applied for ${selectedRole.roleTitle} at ${company.name}.`,
      });

      // Reload applications
      const apps = await applicationService.getApplications();
      setApplications(apps);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Application Error', message: err.message });
    }
  };

  if (!company || !selectedRole) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading company details...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/student/companies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2855A6] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Opportunities
      </Link>

      {/* Company Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={company.logoUrl}
              alt={company.name}
              className="w-16 h-16 object-contain p-2 border border-slate-200 rounded-2xl bg-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#142B4A]">{company.name}</h1>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-[#2855A6] transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-[#78869A] mt-0.5">
                Eligible Branches: {company.department.join(', ')} · Academic Year: {company.academicYear}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate(`/student/eligibility?roleId=${selectedRole.id}`)}
              className="px-4 py-2 border border-slate-300 hover:border-[#2855A6] text-slate-700 hover:text-[#2855A6] text-xs font-bold rounded-xl transition"
            >
              Detailed Breakdown
            </button>

            {isAppliedForSelectedRole ? (
              <span className="px-5 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                Application Submitted
              </span>
            ) : isEligibleForSelectedRole ? (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-6 py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Apply for this Role
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed"
              >
                Ineligible to Apply
              </button>
            )}
          </div>
        </div>

        {/* Amber Parent Notification Alert Line (UI Spec Section B) */}
        {isEligibleForSelectedRole && !isAppliedForSelectedRole && (
          <div className="mt-5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Impending Deadline Alert:</strong> You are eligible for this recruitment drive but have not applied. Parent reminder is scheduled for <strong>27 Nov 2026</strong>.
              </span>
            </div>
            <Link
              to="/student/parent-alerts"
              className="text-[11px] font-bold text-amber-800 hover:underline shrink-0"
            >
              View Alert Rules →
            </Link>
          </div>
        )}
      </div>

      {/* Role Selection Tabs if multiple roles exist */}
      {company.roles.length > 1 && (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
          {company.roles.map(r => (
            <button
              key={r.id}
              onClick={() => handleRoleSelect(r)}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition ${
                selectedRole.id === r.id
                  ? 'bg-white text-[#142B4A] shadow-xs'
                  : 'text-slate-600 hover:text-[#142B4A]'
              }`}
            >
              {r.roleTitle} ({r.packageCtc})
            </button>
          ))}
        </div>
      )}

      {/* Grid: Job Role Details (2/3) & Recruitment Schedule (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Job Role Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider">
                  Role Profile
                </span>
                <h2 className="text-lg font-bold text-[#142B4A]">{selectedRole.roleTitle}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Package / CTC</span>
                <span className="text-lg font-bold text-emerald-700">{selectedRole.packageCtc}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Job Type</span>
                <span className="font-semibold text-slate-800">{selectedRole.jobType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Work Location</span>
                <span className="font-semibold text-slate-800 truncate block">{selectedRole.workLocation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Bond Period</span>
                <span className="font-semibold text-slate-800">{selectedRole.bondPeriod || 'No Bond'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Stipend</span>
                <span className="font-semibold text-slate-800">{selectedRole.stipend || 'Standard CTC'}</span>
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-1.5">
                Role Description & Responsibilities
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedRole.description}</p>
            </div>

            {/* Required Skills */}
            <div>
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2">
                Mandatory Skill Competencies
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedRole.requiredSkills.map(skill => (
                  <span
                    key={skill}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-[#2855A6] border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Eligibility Requirements Breakdown */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-3">
                Mandatory Criteria Thresholds
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Minimum CGPA</span>
                  <span className="font-bold text-slate-800">{selectedRole.eligibilityCriteria.minCgpa}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">10th & 12th Marks</span>
                  <span className="font-bold text-slate-800">
                    {selectedRole.eligibilityCriteria.minTenthMarks}% / {selectedRole.eligibilityCriteria.minTwelfthMarks}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Backlog Restrictions</span>
                  <span className="font-bold text-slate-800">
                    Max {selectedRole.eligibilityCriteria.maxActiveBacklogs} Active
                  </span>
                </div>
                {selectedRole.eligibilityCriteria.minCodingProblemsSolved !== undefined && (
                  <div className="p-2.5 rounded-lg border border-orange-200 bg-orange-50/50">
                    <span className="text-orange-700 block text-[10px] font-bold">Coding Requirement</span>
                    <span className="font-bold text-orange-950">
                      Min {selectedRole.eligibilityCriteria.minCodingProblemsSolved} Problems Solved
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Recruitment Schedule & Instructions */}
        <div className="space-y-6">
          {/* Recruitment Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#2855A6]" />
              Recruitment Process Schedule
            </h3>

            <div className="space-y-3">
              {company.recruitmentSchedule.map((stage, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Round {idx + 1}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2855A6]">
                      {stage.mode}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#142B4A] mt-1">{stage.stageName}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{formatDate(stage.date)}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block text-[10px]">Final Application Deadline:</span>
              <span className="font-bold text-rose-700">{formatDate(company.applicationDeadline)}</span>
            </div>
          </div>

          {/* Company Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-[#142B4A] uppercase tracking-wider text-[11px]">
              CDC Placement Guidelines
            </h3>
            <p className="text-slate-600 leading-relaxed">{company.instructions}</p>
          </div>
        </div>
      </div>

      {/* Application Confirmation Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Confirm Application: ${company.name}`}
        subtitle={`Role: ${selectedRole.roleTitle} (${selectedRole.packageCtc})`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <span className="font-bold text-[#142B4A]">Student Candidate: Sneha R (21BCE1042)</span>
            <p className="text-slate-600">
              Your verified resume (<code>Sneha_R_Resume_2026.pdf</code>) and official academic CGPA (<strong>8.42</strong>) will be transmitted to the CDC recruiting portal.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-snug">
            <strong>Placement Policy:</strong> Submitting an application commits you to attending all scheduled online tests, technical evaluations, and HR interview rounds.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyConfirm}
              className="px-5 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Confirm & Submit Application
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
