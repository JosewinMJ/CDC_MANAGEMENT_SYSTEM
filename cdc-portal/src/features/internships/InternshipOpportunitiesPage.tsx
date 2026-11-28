import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { internshipService } from '../../services/internshipService';
import { applicationService } from '../../services/applicationService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../shared/utils';

export const InternshipOpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [companies, setCompanies] = useState<any[]>([]);
  const [appliedRoleIds, setAppliedRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingRoleId, setApplyingRoleId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [opps, apps] = await Promise.all([
        internshipService.getPublishedOpportunities(),
        applicationService.getApplications(),
      ]);
      setCompanies(opps);
      setAppliedRoleIds(apps.map(a => String(a.roleId)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (companyId: string, companyName: string, roleId: string, roleTitle: string) => {
    setApplyingRoleId(roleId);
    try {
      await applicationService.applyForRole(companyId, roleId);
      setAppliedRoleIds(prev => [...prev, roleId]);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      showToast({
        type: 'success',
        title: 'Opportunity Application Sent',
        message: `Applied for ${roleTitle} at ${companyName} in CDC database.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Application Failed',
        message: err instanceof Error ? err.message : 'Unable to apply.',
      });
    } finally {
      setApplyingRoleId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading CDC internship opportunities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#142B4A]">CDC-Published Internship Opportunities</h2>
          <p className="text-xs text-[#78869A] mt-0.5">
            Live corporate internship roles published in the unified CDC MySQL registry
          </p>
        </div>
        <button
          onClick={() => navigate('/student/applications')}
          className="px-3.5 py-2 rounded-xl bg-[#EAF2FF] text-[#2855A6] text-xs font-bold hover:bg-blue-100 transition self-start sm:self-auto"
        >
          View My Applications →
        </button>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No open CDC internship drives are currently published.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.flatMap(comp =>
            (comp.roles || []).map((role: any) => {
              const roleId = String(role.id);
              const compId = String(comp.id);
              const isApplied = appliedRoleIds.includes(roleId);
              const logoUrl =
                comp.logo_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(comp.name)}&background=142B4A&color=fff&bold=true`;

              return (
                <div
                  key={`${compId}-${roleId}`}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={logoUrl}
                        alt={comp.name}
                        className="w-10 h-10 object-contain p-1 border border-slate-200 rounded-xl bg-white shadow-2xs"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-[#142B4A]">{comp.name}</h3>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {role.stipend ? `Stipend: ${role.stipend}` : role.package_ctc}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{role.role_title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                        {role.description || comp.description || 'Industrial internship track.'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Type & Location:</span>
                        <span className="font-semibold text-slate-800">
                          {role.job_type} · {role.work_location}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Eligibility Criteria:</span>
                        <span className="font-semibold text-slate-800">
                          CGPA ≥ {role.eligibility_criteria?.minCgpa ?? 0} ·{' '}
                          {(role.eligibility_criteria?.allowedBranches || ['ALL']).join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Deadline:</span>
                        <span className="font-bold text-rose-700">{formatDate(comp.application_deadline)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(role.required_skills || []).map((s: string) => (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-[#2855A6] border border-blue-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {isApplied ? (
                      <span className="w-full py-2 block text-center bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200">
                        Application Submitted
                      </span>
                    ) : (
                      <button
                        disabled={applyingRoleId === roleId}
                        onClick={() => handleApply(compId, comp.name, roleId, role.role_title)}
                        className="w-full py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {applyingRoleId === roleId ? 'Submitting...' : 'Apply Through CDC'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
