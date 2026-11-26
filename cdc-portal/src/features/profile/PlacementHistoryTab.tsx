import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, FileCheck, Award, ExternalLink, ChevronRight } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { Application } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../shared/utils';

export const PlacementHistoryTab: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    const list = await applicationService.getApplications();
    setApplications(list);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#142B4A]">Placement Applications & Offer History</h2>
          <p className="text-xs text-[#78869A] mt-0.5">
            Historical record of all campus recruitment drives, assessments and interview outcomes
          </p>
        </div>

        <button
          onClick={() => navigate('/student/applications')}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#2855A6] bg-[#EAF2FF] hover:bg-blue-100 rounded-xl transition self-start sm:self-auto"
        >
          <span>Manage Active Applications</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Job Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Package / CTC</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Applied Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Recruitment Stage</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={app.companyLogo}
                        alt={app.companyName}
                        className="w-7 h-7 object-contain p-0.5 border border-slate-200 rounded-lg bg-white"
                      />
                      <span className="font-bold text-[#142B4A]">{app.companyName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">{app.roleTitle}</td>
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">{app.packageCtc}</td>
                  <td className="py-3.5 px-4 text-slate-600">{formatDate(app.appliedDate)}</td>

                  <td className="py-3.5 px-4">
                    <span className="text-slate-700 font-medium">{app.nextStage || 'Process Completed'}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={app.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => navigate('/student/applications')}
                      className="px-2.5 py-1 text-xs font-semibold text-[#2855A6] hover:bg-blue-50 rounded-lg transition"
                    >
                      View Timeline
                    </button>
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
