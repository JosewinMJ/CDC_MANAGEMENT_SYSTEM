import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  CheckCircle2,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { Student, AcademicCorrectionRequest } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { FileUploader } from '../../components/common/FileUploader';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../shared/utils';

export const AcademicTab: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [corrections, setCorrections] = useState<AcademicCorrectionRequest[]>([]);

  // Correction Request Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correctionField, setCorrectionField] = useState('currentCgpa');
  const [currentVal, setCurrentVal] = useState('');
  const [requestedVal, setRequestedVal] = useState('');
  const [reason, setReason] = useState('');
  const [supportingDoc, setSupportingDoc] = useState('');

  const { showToast } = useNotification();

  const loadAcademicData = async () => {
    const [profile, tickets] = await Promise.all([
      studentService.getStudentProfile(),
      studentService.getAcademicCorrections(),
    ]);
    setStudent(profile);
    setCorrections(tickets);
    setCurrentVal(String(profile.academicRecord.currentCgpa));
  };

  useEffect(() => {
    loadAcademicData().catch(() => {});
  }, []);

  if (!student) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading academic profile...</div>;
  }

  const academic = student.academicRecord;

  const handleFieldChange = (field: string) => {
    setCorrectionField(field);
    if (field === 'currentCgpa') setCurrentVal(String(academic.currentCgpa));
    else if (field === 'tenthPercentage') setCurrentVal(`${academic.tenthPercentage}%`);
    else if (field === 'twelfthPercentage') setCurrentVal(`${academic.twelfthPercentage}%`);
    else if (field === 'activeBacklogs') setCurrentVal(String(academic.activeBacklogs));
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedVal.trim() || !reason.trim()) {
      showToast({ type: 'error', title: 'Missing Information', message: 'Please provide the requested value and reason.' });
      return;
    }

    await studentService.requestAcademicCorrection({
      studentId: student.id,
      field: correctionField,
      currentValue: currentVal,
      requestedValue: requestedVal,
      reason,
      supportingDocName: supportingDoc || 'Consolidated_GradeSheet.pdf',
    });

    await loadAcademicData();
    setIsModalOpen(false);
    setRequestedVal('');
    setReason('');
    setSupportingDoc('');

    showToast({
      type: 'info',
      title: 'Correction Request Submitted',
      message: 'Your request has been routed to the CDC Placement Office for administrative review.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Academic Summary Cards & Official Verification Badge */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#142B4A]">Official Academic Profile</h3>
              <StatusBadge status={academic.verificationStatus} />
              {corrections.length > 0 && (
                <span className="sr-only">{corrections.length} correction request(s) recorded</span>
              )}
              {(academic.correctionPending || corrections.some(c => c.status === 'PENDING')) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Correction Request Under Review
                </span>
              )}
            </div>
            <p className="text-xs text-[#78869A] mt-0.5">
              Verified by {academic.verifiedBy || 'CDC Administration'} on {formatDate(academic.verifiedAt)}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2855A6] bg-[#EAF2FF] hover:bg-blue-100 rounded-xl transition self-start sm:self-auto border border-blue-200"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            Request Academic Correction
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-center">
            <span className="text-[10px] font-bold text-[#2855A6] uppercase tracking-wider block">
              Cumulative CGPA
            </span>
            <span className="text-2xl font-black text-[#142B4A] mt-1 block">
              {academic.currentCgpa}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">Scale of 10.0</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              10th Marks
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {academic.tenthPercentage}%
            </span>
            <span className="text-[10px] text-slate-500">CBSE Board</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              12th / PUC Marks
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {academic.twelfthPercentage}%
            </span>
            <span className="text-[10px] text-slate-500">Higher Secondary</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Active Backlogs
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1 block">
              {academic.activeBacklogs}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">All Cleared</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
              Historical Backlogs
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-1 block">
              {academic.historicalBacklogs}
            </span>
            <span className="text-[10px] text-slate-500">Zero History</span>
          </div>
        </div>

        {/* Academic Degree Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[#78869A] block mb-1">Degree & Programme</span>
            <p className="font-semibold text-slate-800 text-sm">
              {academic.degree} ({academic.programme})
            </p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Department / School</span>
            <p className="font-semibold text-slate-800 text-sm">{academic.department}</p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Branch & Specialization</span>
            <p className="font-semibold text-slate-800 text-sm">
              {academic.branch} ({academic.specialization})
            </p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Graduation Year</span>
            <p className="font-semibold text-slate-800 text-sm">May {academic.graduationYear}</p>
          </div>
        </div>
      </div>

      {/* 2. Semester-wise Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#142B4A] uppercase tracking-wider mb-4">
          Semester-Wise Performance History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F5F7FA]/70 text-[#78869A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Semester</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Credits Earned</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Semester GPA</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Backlogs</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {academic.semesterResults.map(sem => (
                <tr key={sem.semesterNumber} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-[#142B4A]">
                    Semester {sem.semesterNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {sem.credits} Credits
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {sem.gpa.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                    {sem.backlogs === 0 ? 'Nil' : sem.backlogs}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Passed & Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Academic Correction Modal (Report §3.2 & §7) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Official Academic Correction"
        subtitle="Submit a formal ticket to the CDC to adjust verified academic criteria"
        maxWidth="lg"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Select Field to Correct:</label>
            <select
              value={correctionField}
              onChange={e => handleFieldChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="currentCgpa">Cumulative CGPA</option>
              <option value="tenthPercentage">10th Grade Percentage</option>
              <option value="twelfthPercentage">12th Grade Percentage</option>
              <option value="activeBacklogs">Active Backlogs Count</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#142B4A] mb-1">Current Recorded Value:</label>
              <input
                type="text"
                value={currentVal}
                disabled
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#142B4A] mb-1">Requested Correct Value:</label>
              <input
                type="text"
                value={requestedVal}
                onChange={e => setRequestedVal(e.target.value)}
                placeholder="e.g. 8.55"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Reason for Correction Request:</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain the discrepancy (e.g. grade improvement from revaluation completed in October 2026)..."
              rows={3}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>

          <FileUploader
            label="Upload Supporting Proof (Marksheet / Grade Card):"
            helperText="PDF up to 5MB"
            onFileSelect={setSupportingDoc}
            selectedFileName={supportingDoc}
          />

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-snug">
            <strong>Notice:</strong> As per institutional policy, academic data modifications require CDC coordinator verification and will automatically recalculate your eligibility for recruitment drives once approved.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
