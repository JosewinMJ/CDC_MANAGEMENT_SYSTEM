import React, { useState, useEffect } from 'react';
import {
  Wrench,
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
  FileCheck,
  RefreshCw,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/storage';
import { internshipService } from '../../services/internshipService';
import { applicationService } from '../../services/applicationService';
import { documentService } from '../../services/documentService';
import { noticeService } from '../../services/noticeService';
import { parentAlertService } from '../../services/parentAlertService';
import {
  Internship,
  Application,
  Document,
  UserRole,
  ApplicationStatus,
  DocumentVerificationStatus,
  NoticeCategory,
  NoticePriority,
  ParentAlert,
} from '../../shared/types';
import { useNotification } from '../../context/NotificationContext';

export const DemoControlsDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);

  // Form states
  const [selectedInternshipId, setSelectedInternshipId] = useState('');
  const [internshipAction, setInternshipAction] = useState<'GUIDE_APPROVE' | 'GUIDE_REJECT' | 'CDC_APPROVE' | 'CDC_REJECT'>('GUIDE_APPROVE');
  const [internshipRemarks, setInternshipRemarks] = useState('Excellent project profile aligned with department curriculum. Approved.');

  const [selectedAppId, setSelectedAppId] = useState('');
  const [nextAppStatus, setNextAppStatus] = useState<ApplicationStatus>(ApplicationStatus.SHORTLISTED);
  const [appRemarks, setAppRemarks] = useState('Cleared technical assessment round with top marks.');

  const [selectedDocId, setSelectedDocId] = useState('');
  const [docStatus, setDocStatus] = useState<DocumentVerificationStatus>(DocumentVerificationStatus.VERIFIED);
  const [docRemarks, setDocRemarks] = useState('Verified against official institutional records.');

  const [noticeTitle, setNoticeTitle] = useState('Important: Mock Technical Interview Sessions This Saturday');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>(NoticeCategory.INTERVIEW);
  const [noticePriority, setNoticePriority] = useState<NoticePriority>(NoticePriority.HIGH);

  const { showToast } = useNotification();

  const loadData = () => {
    const ints = db.getInternships();
    const apps = db.getApplications();
    const docs = db.getStudent().documents;
    const alrts = db.getParentAlerts();

    setInternships(ints);
    setApplications(apps);
    setDocuments(docs);
    setAlerts(alrts);

    if (ints.length && !selectedInternshipId) setSelectedInternshipId(ints[0].id);
    if (apps.length && !selectedAppId) setSelectedAppId(apps[0].id);
    if (docs.length && !selectedDocId) setSelectedDocId(docs[0].id);
  };

  useEffect(() => {
    loadData();
  }, [isOpen]);

  const handleInternshipSubmit = async () => {
    if (!selectedInternshipId) return;

    if (internshipAction === 'GUIDE_APPROVE') {
      await internshipService.reviewInternshipMock(
        selectedInternshipId,
        UserRole.GUIDE,
        'APPROVED',
        internshipRemarks,
        'Dr. K. Ramanathan (Faculty Guide)'
      );
      showToast({ type: 'success', title: 'Guide Approved Internship', message: 'Status updated to Pending CDC Approval' });
    } else if (internshipAction === 'GUIDE_REJECT') {
      await internshipService.reviewInternshipMock(
        selectedInternshipId,
        UserRole.GUIDE,
        'REJECTED',
        internshipRemarks,
        'Dr. K. Ramanathan (Faculty Guide)'
      );
      showToast({ type: 'error', title: 'Guide Rejected Internship', message: 'Rejection remarks recorded.' });
    } else if (internshipAction === 'CDC_APPROVE') {
      await internshipService.reviewInternshipMock(
        selectedInternshipId,
        UserRole.ADMIN_INTERNSHIP,
        'APPROVED',
        internshipRemarks,
        'Prof. Anitha Roy (CDC Internship Coordinator)'
      );
      showToast({ type: 'success', title: 'CDC Coordinator Approved', message: 'Internship fully APPROVED!' });
    } else if (internshipAction === 'CDC_REJECT') {
      await internshipService.reviewInternshipMock(
        selectedInternshipId,
        UserRole.ADMIN_INTERNSHIP,
        'REJECTED',
        internshipRemarks,
        'Prof. Anitha Roy (CDC Internship Coordinator)'
      );
      showToast({ type: 'error', title: 'CDC Coordinator Rejected', message: 'Rejection recorded.' });
    }

    loadData();
  };

  const handleApplicationSubmit = async () => {
    if (!selectedAppId) return;
    await applicationService.advanceApplicationStageMock(selectedAppId, nextAppStatus, appRemarks);
    showToast({
      type: 'success',
      title: 'Application Stage Advanced',
      message: `Status transitioned to ${nextAppStatus}`,
    });
    loadData();
  };

  const handleDocumentSubmit = async () => {
    if (!selectedDocId) return;
    await documentService.verifyDocumentMock(selectedDocId, docStatus, docRemarks);
    showToast({
      type: 'info',
      title: 'Document Verification Updated',
      message: `Document status marked as ${docStatus}`,
    });
    loadData();
  };

  const handlePublishNotice = async () => {
    if (!noticeTitle.trim()) return;
    await noticeService.publishNoticeMock({
      title: noticeTitle,
      content: `Notice published via CDC Simulation Controls on ${new Date().toLocaleTimeString()} for testing cross-portal notification flow.`,
      category: noticeCategory,
      priority: noticePriority,
      isImportant: noticePriority === NoticePriority.HIGH || noticePriority === NoticePriority.URGENT,
      publisherName: 'Dr. S. Varma (Placement Director)',
      publisherRole: 'CDC Administrator',
    });
    showToast({
      type: 'success',
      title: 'Notice Published',
      message: 'New announcement broadcasted to student portal.',
    });
    loadData();
  };

  const handleTriggerAlert = async (alertId: string) => {
    await parentAlertService.triggerParentAlertMock(alertId);
    showToast({
      type: 'warning',
      title: 'Parent Alert Dispatched',
      message: 'Automated notification sent to parent phone via WhatsApp.',
    });
    loadData();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all portal mock data back to initial seed state?')) {
      db.resetAll();
      showToast({ type: 'info', title: 'Data Reset', message: 'Portal reloaded with default state.' });
      loadData();
      window.location.reload();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-[#142B4A] hover:bg-[#2855A6] text-white text-xs font-bold rounded-full shadow-xl transition-all hover:scale-105 border border-blue-400/40"
        title="Open Guide and Admin Simulator"
      >
        <Wrench className="w-4 h-4 text-amber-400" />
        <span>Demo Controls</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-[#142B4A]/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-[#142B4A] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold tracking-tight">Cross-Portal Demo Simulator</h3>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  Simulate Guide & Admin workflow actions in real-time
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Simulator Panels */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#263445]">
              {/* Simulator 1: Internship Review */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#142B4A] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2855A6]" />
                    1. Internship Approval Workflow
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    Report §6.2
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Select Internship:
                  </label>
                  <select
                    value={selectedInternshipId}
                    onChange={e => setSelectedInternshipId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {internships.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.track}: {i.companyName} ({i.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Simulate Role Action:
                  </label>
                  <select
                    value={internshipAction}
                    onChange={e => setInternshipAction(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="GUIDE_APPROVE">Guide (Dr. Ramanathan) → APPROVE</option>
                    <option value="GUIDE_REJECT">Guide (Dr. Ramanathan) → REJECT</option>
                    <option value="CDC_APPROVE">CDC Coordinator (Prof. Anitha) → APPROVE</option>
                    <option value="CDC_REJECT">CDC Coordinator (Prof. Anitha) → REJECT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mentor / Coordinator Remarks:
                  </label>
                  <input
                    type="text"
                    value={internshipRemarks}
                    onChange={e => setInternshipRemarks(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <button
                  onClick={handleInternshipSubmit}
                  className="w-full py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white font-bold rounded-lg transition"
                >
                  Execute Internship Review
                </button>
              </div>

              {/* Simulator 2: Application Stage Progress */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#142B4A] flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-[#2855A6]" />
                    2. Advance Placement Application
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    Report §6.1
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Select Application:
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={e => setSelectedAppId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {applications.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.companyName} - {a.roleTitle} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    New Recruitment Stage:
                  </label>
                  <select
                    value={nextAppStatus}
                    onChange={e => setNextAppStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value={ApplicationStatus.ASSESSMENT_SCHEDULED}>ASSESSMENT SCHEDULED</option>
                    <option value={ApplicationStatus.SHORTLISTED}>SHORTLISTED</option>
                    <option value={ApplicationStatus.INTERVIEW_SCHEDULED}>INTERVIEW SCHEDULED</option>
                    <option value={ApplicationStatus.SELECTED}>SELECTED (Offer Given)</option>
                    <option value={ApplicationStatus.NOT_SELECTED}>NOT SELECTED</option>
                    <option value={ApplicationStatus.WAITLISTED}>WAITLISTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Stage Remarks:
                  </label>
                  <input
                    type="text"
                    value={appRemarks}
                    onChange={e => setAppRemarks(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <button
                  onClick={handleApplicationSubmit}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                >
                  Update Recruitment Stage
                </button>
              </div>

              {/* Simulator 3: Document Verification */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#142B4A] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-[#2855A6]" />
                    3. Document Verification
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    Report §3.2
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Document:
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={e => setSelectedDocId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {documents.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.category}: {d.name} ({d.verificationStatus})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Verification Decision:
                  </label>
                  <select
                    value={docStatus}
                    onChange={e => setDocStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value={DocumentVerificationStatus.VERIFIED}>VERIFIED</option>
                    <option value={DocumentVerificationStatus.PENDING_VERIFICATION}>PENDING VERIFICATION</option>
                    <option value={DocumentVerificationStatus.REJECTED}>REJECTED</option>
                  </select>
                </div>

                <button
                  onClick={handleDocumentSubmit}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
                >
                  Confirm Document Status
                </button>
              </div>

              {/* Simulator 4: Notice Distribution */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#142B4A] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#2855A6]" />
                    4. Broadcast Official Notice
                  </h4>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    Report §6.4
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Notice Headline:
                  </label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={e => setNoticeTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Category:
                    </label>
                    <select
                      value={noticeCategory}
                      onChange={e => setNoticeCategory(e.target.value as any)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value={NoticeCategory.PLACEMENT}>Placement</option>
                      <option value={NoticeCategory.INTERVIEW}>Interview</option>
                      <option value={NoticeCategory.DEADLINE}>Deadline</option>
                      <option value={NoticeCategory.GUIDE}>Guide Instructions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Priority:
                    </label>
                    <select
                      value={noticePriority}
                      onChange={e => setNoticePriority(e.target.value as any)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value={NoticePriority.HIGH}>High</option>
                      <option value={NoticePriority.URGENT}>Urgent</option>
                      <option value={NoticePriority.NORMAL}>Normal</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handlePublishNotice}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                >
                  Publish Notice to Student Portal
                </button>
              </div>

              {/* Simulator 5: Parent Alert Trigger */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#142B4A] flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5 text-amber-600" />
                    5. Dispatch Scheduled Parent Alert
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Force automated deadline reminder to parent phone:
                </p>

                {alerts.filter(a => a.deliveryStatus === 'SCHEDULED').map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-semibold">{a.companyName}</p>
                      <p className="text-[10px] text-slate-400">{a.alertType}</p>
                    </div>
                    <button
                      onClick={() => handleTriggerAlert(a.id)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[11px]"
                    >
                      Dispatch Now
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Reset button */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Local demo state active</span>
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset All Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
