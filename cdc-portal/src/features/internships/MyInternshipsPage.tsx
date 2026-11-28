import { apiRequest } from '../../services/apiClient';
import { DocumentDownload } from '../../components/common/DocumentDownload';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  Upload,
  AlertCircle,
  Eye,
  Plus,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { internshipService } from '../../services/internshipService';
import { subscribeToStore } from '../../services/storeEvents';
import {
  Internship,
  InternshipTrack,
  InternshipStatus,
  DocumentVerificationStatus,
} from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StepperTimeline } from '../../components/common/StepperTimeline';
import { Modal } from '../../components/common/Modal';
import { FileUploader } from '../../components/common/FileUploader';
import { formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const MyInternshipsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useNotification();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

  // Completion Submission Modal States
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionCertDoc, setCompletionCertDoc] = useState('');
  const [finalReportDoc, setFinalReportDoc] = useState('');

  const loadData = async () => {
    const list = await internshipService.getInternships();
    setInternships(list);

    const trackParam = searchParams.get('track');
    if (trackParam === '1') {
      const t1 = list.find(i => i.track === InternshipTrack.TRACK_1_SUMMER);
      if (t1) setSelectedInternship(t1);
    } else if (trackParam === '2') {
      const t2 = list.find(i => i.track === InternshipTrack.TRACK_2_HYBRID);
      if (t2) setSelectedInternship(t2);
    } else if (!selectedInternship && list.length > 0) {
      setSelectedInternship(list[0]);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStore('cdc_internships', loadData);
    return () => unsub();
  }, [searchParams]);

  const [resubmitting, setResubmitting] = useState(false);
  async function resubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInternship || resubmitting) return;
    const body = new FormData(event.currentTarget);
    if (!(body.get('supporting') as File)?.size) body.delete('supporting');
    setResubmitting(true);
    try {
      await apiRequest('/internships/' + selectedInternship.id + '/resubmit', { portal: 'student', method: 'POST', body });
      const list = await internshipService.getInternships();
      setInternships(list);
      setSelectedInternship(list.find(item => item.id === selectedInternship.id) ?? null);
      showToast({type: 'success', title: 'Resubmitted', message: 'Your guide can now review the revision.'});
    } catch (err) {
      showToast({type: 'error', title: 'Resubmission failed', message: err instanceof Error ? err.message : 'Try again.'});
    } finally { setResubmitting(false); }
  }

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternship) return;
    if (!completionCertDoc || !finalReportDoc) {
      showToast({ type: 'error', title: 'Documents Required', message: 'Please upload both completion certificate and final report.' });
      return;
    }

    await internshipService.submitCompletion(
      selectedInternship.id,
      completionCertDoc,
      finalReportDoc
    );

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    showToast({
      type: 'success',
      title: 'Completion Report Submitted',
      message: 'Internship status updated to COMPLETED. Credits will be registered.',
    });

    setIsCompletionModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* 1. Track Summary View Table (UI Spec Section A) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#142B4A]">Track Summary Table</h2>
            <p className="text-xs text-[#78869A] mt-0.5">
              Consolidated overview across all three mandatory internship tracks
            </p>
          </div>

          <button
            onClick={() => navigate('/student/internships/register')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Track</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Track Designation</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Company / Org</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Internship Role</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Duration</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Stipend</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Approval Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {internships.map(intern => (
                <tr
                  key={intern.id}
                  onClick={() => setSelectedInternship(intern)}
                  className={`hover:bg-slate-50/80 transition cursor-pointer ${
                    selectedInternship?.id === intern.id ? 'bg-[#EAF2FF]/40 font-medium' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                    {intern.track}
                    {intern.semester && <span className="block text-[10px] text-slate-400 font-normal">{intern.semester}</span>}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{intern.companyName}</td>
                  <td className="py-3.5 px-4 text-slate-700">{intern.jobRole}</td>
                  <td className="py-3.5 px-4 text-slate-600">{intern.durationWeeks} Weeks</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">
                    {intern.isStipend ? `₹${intern.stipendAmount?.toLocaleString()}/mo` : 'Unpaid'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={intern.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedInternship(intern);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-[#2855A6] hover:bg-blue-50 rounded-lg transition"
                    >
                      Inspect Stepper →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Detailed Approval Tracking & Documents Repository for Selected Internship */}
      {selectedInternship && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3): Stepper & Detailed Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2855A6] uppercase tracking-wider">
                      {selectedInternship.track}
                    </span>
                    <StatusBadge status={selectedInternship.status} />
                  </div>
                  <h3 className="text-xl font-bold text-[#142B4A] mt-1.5">{selectedInternship.companyName}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Role: <strong>{selectedInternship.jobRole}</strong> · Duration: <strong>{selectedInternship.durationWeeks} Weeks</strong> ({formatDate(selectedInternship.startDate)} – {formatDate(selectedInternship.endDate)})
                  </p>
                </div>

                {[InternshipStatus.APPROVED, InternshipStatus.IN_PROGRESS].includes(selectedInternship.status) && (
                  <button
                    onClick={() => setIsCompletionModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition self-start sm:self-auto"
                  >
                    <Award className="w-4 h-4" />
                    <span>Submit Completion Evidence</span>
                  </button>
                )}
              </div>

              {/* Work Profile */}
              <div>
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-1">
                  Internship Work Profile & Deliverables
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {selectedInternship.workProfile}
                </p>
              </div>

              {/* Approval Workflow Stepper (Report §6.2 & UI Spec §A) */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-4">
                  Multi-Stage Verification Workflow (Student → Guide → Coordinator → Final Approval)
                </h4>
                <StepperTimeline steps={selectedInternship.steps} />
                {selectedInternship.status === InternshipStatus.CHANGES_REQUESTED && (
                  <form key={selectedInternship.id} onSubmit={resubmit} className="mt-4 grid gap-3 text-sm">
                    <label>Updated work profile or response to guide
                      <textarea required maxLength={10000} name="workProfile" defaultValue={selectedInternship.workProfile} className="block w-full rounded border p-2" />
                    </label>
                    <label>Revised supporting document (optional)
                      <input type="file" name="supporting" accept=".pdf,.doc,.docx" className="block" />
                    </label>
                    <button disabled={resubmitting} className="rounded bg-[#2855A6] p-2 font-semibold text-white">Resubmit for guide review</button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3): Supporting Documents Repository */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2855A6]" />
                Track Documents Repository
              </h3>

              <div className="space-y-3">
                {selectedInternship.documents.length === 0 ? (
                  <p className="text-xs text-slate-400">No documents attached.</p>
                ) : (
                  selectedInternship.documents.map(doc => (
                    <div key={doc.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{doc.category}</span>
                        <StatusBadge status={doc.verificationStatus} />
                      </div>
                      <h5 className="text-xs font-bold text-[#142B4A] truncate">{doc.name}</h5>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                        <DocumentDownload path={doc.fileUrl} name={doc.name} portal="student" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Submission Modal */}
      <Modal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        title="Submit Internship Completion Evidence"
        subtitle={`Award academic credits for ${selectedInternship?.companyName}`}
        maxWidth="md"
      >
        <form onSubmit={handleCompletionSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-snug">
            Upload your final evaluation credentials issued by your corporate mentor. Once validated, course credits will be reflected on your official transcript.
          </div>

          <FileUploader
            label="1. Official Internship Completion Certificate (Mandatory):"
            helperText="PDF up to 5MB"
            onFileSelect={setCompletionCertDoc}
            selectedFileName={completionCertDoc}
          />

          <FileUploader
            label="2. Final Internship Technical Report (Mandatory):"
            helperText="PDF up to 10MB formatted according to CDC academic project guidelines"
            onFileSelect={setFinalReportDoc}
            selectedFileName={finalReportDoc}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCompletionModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
            >
              Submit Evidence & Complete Track
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
