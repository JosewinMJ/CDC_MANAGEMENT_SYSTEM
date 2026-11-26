import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { db, subscribeToStore } from '../../services/storage';
import { Application, ApplicationStatus } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatDateTime } from '../../shared/utils';

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const loadApps = async () => {
    const list = await applicationService.getApplications();
    setApplications(list);
  };

  useEffect(() => {
    loadApps();
    const unsub = subscribeToStore('cdc_applications', loadApps);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">My Recruitment Applications</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Track status progression, assessment schedules, and interview milestones for campus placements
          </p>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Job Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Applied Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Application Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Next Recruitment Stage</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Recruitment Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active applications submitted yet.
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.companyLogo}
                          alt={app.companyName}
                          className="w-8 h-8 rounded-lg object-contain p-1 border border-slate-200 bg-white"
                        />
                        <div>
                          <span className="font-bold text-[#142B4A] block">{app.companyName}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{app.packageCtc}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">{app.roleTitle}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(app.appliedDate)}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {app.nextStage || 'Process Concluded'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3.5 py-1.5 bg-[#EAF2FF] hover:bg-blue-100 text-[#2855A6] font-bold rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Recruitment Timeline Modal (UI Spec Section 8) */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Recruitment Timeline: ${selectedApp.companyName}`}
          subtitle={`Role: ${selectedApp.roleTitle} (${selectedApp.packageCtc})`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Current Status</span>
                <StatusBadge status={selectedApp.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Applied Date</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedApp.appliedDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Next Milestone</span>
                <span className="font-semibold text-[#2855A6]">{selectedApp.nextStage}</span>
              </div>
            </div>

            {/* Stage Progress Stepper */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                Recruitment Stage Progression
              </h4>

              <div className="space-y-4 pl-2">
                {selectedApp.timeline.map((stage, idx) => {
                  const isLast = idx === selectedApp.timeline.length - 1;
                  return (
                    <div key={idx} className="relative flex items-start gap-4 text-xs">
                      {!isLast && (
                        <div
                          className={`absolute left-3.5 top-7 w-0.5 h-full -ml-[1px] ${
                            stage.completed ? 'bg-emerald-300' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                          stage.completed
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                            : 'bg-slate-50 border-slate-300 text-slate-400'
                        }`}
                      >
                        {stage.completed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-[#142B4A]">{stage.stage}</h5>
                          {stage.date && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDate(stage.date)}
                            </span>
                          )}
                        </div>

                        {stage.remarks && (
                          <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                            {stage.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
