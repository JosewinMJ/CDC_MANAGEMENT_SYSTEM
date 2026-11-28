import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { internshipService } from '../../services/internshipService';
import { studentService } from '../../services/studentService';
import {
  InternshipTrack,
  InternshipMode,
  Student,
} from '../../shared/types';
import { FileUploader } from '../../components/common/FileUploader';
import { calculateDuration } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const RegisterInternshipPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useNotification();

  // Track selection
  const initialTrack = searchParams.get('track') === '1'
    ? InternshipTrack.TRACK_1_SUMMER
    : searchParams.get('track') === '3'
    ? InternshipTrack.TRACK_3_SEMESTER
    : InternshipTrack.TRACK_2_HYBRID;

  const [selectedTrack, setSelectedTrack] = useState<InternshipTrack>(initialTrack);
  const [selectedSemester, setSelectedSemester] = useState<'7th Semester (Odd)' | '8th Semester (Even)'>('7th Semester (Odd)');

  // Step Wizard State (1 to 5)
  const [step, setStep] = useState(1);

  // Form Fields
  // Step 1: Company Info
  const [companyName, setCompanyName] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Step 2: Internship Details
  const roleOptions = [
    'Software Developer Intern',
    'Web Developer Intern',
    'Data Analyst Intern',
    'ML/AI Engineer Intern',
    'UI/UX Designer Intern',
    'Cybersecurity Intern',
    'Testing/QA Intern',
    'Cloud Solutions Intern',
    'Business Analyst Intern',
    'Research Intern',
    'Other',
  ];
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [customRole, setCustomRole] = useState('');
  const [mode, setMode] = useState<InternshipMode>(InternshipMode.HYBRID);
  const [isStipend, setIsStipend] = useState(true);
  const [stipendAmount, setStipendAmount] = useState<number>(15000);
  const [stipendCurrency, setStipendCurrency] = useState('₹');
  const [startDate, setStartDate] = useState('2026-12-15');
  const [endDate, setEndDate] = useState('2027-03-15');
  const [workProfile, setWorkProfile] = useState('');

  // Step 3: Guide Details
  const [facultyGuideId, setFacultyGuideId] = useState('');
  const [facultyGuideName, setFacultyGuideName] = useState('Assigned Faculty Guide');

  useEffect(() => {
    studentService.getStudentProfile().then(s => {
      setFacultyGuideId(s.assignedGuideId);
      setFacultyGuideName(s.assignedGuideName || 'Assigned Faculty Guide');
    }).catch(() => {});
  }, []);

  // Step 4: Documents Upload
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [offerLetterDoc, setOfferLetterDoc] = useState('');
  const [joiningLetterDoc, setJoiningLetterDoc] = useState('');
  const [supportingDoc, setSupportingDoc] = useState('');

  const duration = calculateDuration(startDate, endDate);

  const handleNext = () => {
    if (step === 1) {
      if (!companyName.trim() || !companyContact.trim() || !companyAddress.trim()) {
        showToast({ type: 'error', title: 'Required Fields Missing', message: 'Please complete all company contact fields.' });
        return;
      }
    } else if (step === 2) {
      if (selectedRole === 'Other' && !customRole.trim()) {
        showToast({ type: 'error', title: 'Specify Custom Role', message: 'Please type your custom internship role.' });
        return;
      }
      if (!workProfile.trim()) {
        showToast({ type: 'error', title: 'Work Profile Missing', message: 'Please describe your work responsibilities.' });
        return;
      }
    } else if (step === 4) {
      if (!offerLetterDoc) {
        showToast({ type: 'error', title: 'Offer Letter Required', message: 'Please upload official offer letter PDF.' });
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const finalRole = selectedRole === 'Other' ? customRole : selectedRole;
      const supportingDocs = [joiningLetterDoc, supportingDoc].filter(Boolean);

      await internshipService.registerInternship({
        track: selectedTrack,
        semester: selectedTrack === InternshipTrack.TRACK_3_SEMESTER ? selectedSemester : undefined,
        companyName,
        companyContactNumber: companyContact,
        companyAddress,
        jobRole: finalRole,
        customRole: selectedRole === 'Other' ? customRole : undefined,
        isStipend,
        stipendAmount: isStipend ? Number(stipendAmount) : undefined,
        stipendCurrency,
        mode: selectedTrack === InternshipTrack.TRACK_2_HYBRID ? mode : undefined,
        startDate,
        endDate,
        durationWeeks: duration.weeks || 12,
        workProfile,
        facultyGuideId,
        facultyGuideName,
        offerLetterDocName: offerLetterDoc || 'Internship_Offer_Letter.pdf',
        supportingDocNames: supportingDocs,
        files,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      showToast({
        type: 'success',
        title: 'Internship Submitted for Guide Review',
        message: `Registered ${selectedTrack} with ${companyName}. Transmitted to ${facultyGuideName}.`,
      });

      navigate('/student/internships/my-internships');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Track Selector Segmented Tabs (UI Spec Section A) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <label className="block text-xs font-bold text-[#142B4A] uppercase tracking-wider mb-2">
          Select Internship Track to Register:
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedTrack(InternshipTrack.TRACK_1_SUMMER);
              setStep(1);
            }}
            className={`p-3 rounded-lg text-left transition ${
              selectedTrack === InternshipTrack.TRACK_1_SUMMER
                ? 'bg-white shadow-xs border border-slate-200'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Track 1
            </span>
            <span className="text-xs font-bold text-[#142B4A] block">Summer Internship</span>
            <span className="text-[11px] text-slate-500">After 2nd Year (6–8 weeks)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTrack(InternshipTrack.TRACK_2_HYBRID);
              setStep(1);
            }}
            className={`p-3 rounded-lg text-left transition ${
              selectedTrack === InternshipTrack.TRACK_2_HYBRID
                ? 'bg-white shadow-xs border border-slate-200'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <span className="text-[10px] font-bold text-[#2855A6] uppercase tracking-wider block">
              Track 2
            </span>
            <span className="text-xs font-bold text-[#142B4A] block">Hybrid Internship</span>
            <span className="text-[11px] text-slate-500">After 3rd Year (Online/Offline/Hybrid)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTrack(InternshipTrack.TRACK_3_SEMESTER);
              setStep(1);
            }}
            className={`p-3 rounded-lg text-left transition ${
              selectedTrack === InternshipTrack.TRACK_3_SEMESTER
                ? 'bg-white shadow-xs border border-slate-200'
                : 'hover:bg-slate-200/60'
            }`}
          >
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Track 3
            </span>
            <span className="text-xs font-bold text-[#142B4A] block">4th Year Internship</span>
            <span className="text-[11px] text-slate-500">7th & 8th Semesters</span>
          </button>
        </div>

        {/* If Track 3 is chosen, show Semester Sub-Tabs */}
        {selectedTrack === InternshipTrack.TRACK_3_SEMESTER && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#142B4A]">Select Applicable Semester:</span>
              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Note: Odd and even semester internships are recorded separately.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedSemester('7th Semester (Odd)')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition border ${
                  selectedSemester === '7th Semester (Odd)'
                    ? 'bg-[#EAF2FF] text-[#2855A6] border-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                7th Semester (Odd Semester)
              </button>
              <button
                type="button"
                onClick={() => setSelectedSemester('8th Semester (Even)')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition border ${
                  selectedSemester === '8th Semester (Even)'
                    ? 'bg-[#EAF2FF] text-[#2855A6] border-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                8th Semester (Even Semester)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Step Progress Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-[#142B4A]">
          <span>
            Step {step} of 5:{' '}
            {step === 1 && 'Company Information'}
            {step === 2 && 'Internship Details & Role'}
            {step === 3 && 'Faculty Guide Assignment'}
            {step === 4 && 'Document Upload (Offer Letter)'}
            {step === 5 && 'Review & Submit'}
          </span>
          <span className="text-[#2855A6]">{Math.round((step / 5) * 100)}% Complete</span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2855A6] to-blue-400 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Step Forms */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 lg:p-8 shadow-xs">
        {/* Step 1: Company Information */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142B4A] pb-3 border-b border-slate-100">
              Step 1: Organization / Corporate Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">Company / Organization Name:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Cisco Systems, Microsoft, TCS..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">Company Contact / HR Phone:</label>
                <input
                  type="text"
                  value={companyContact}
                  onChange={e => setCompanyContact(e.target.value)}
                  placeholder="+91 80 4400 1234"
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#142B4A] mb-1">Corporate Office / Work Location Address:</label>
                <textarea
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  placeholder="Street, City, State, PIN..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Internship Details */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142B4A] pb-3 border-b border-slate-100">
              Step 2: Role, Mode & Duration Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Role Dropdown with 'Other' option */}
              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">Job Role / Designation:</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                >
                  {roleOptions.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* If 'Other' chosen, show custom text input */}
              {selectedRole === 'Other' && (
                <div>
                  <label className="block font-semibold text-[#142B4A] mb-1">Specify Custom Role Title:</label>
                  <input
                    type="text"
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    placeholder="e.g. Embedded Firmware Engineering Intern"
                    className="w-full p-2.5 border border-blue-400 bg-blue-50/30 rounded-xl"
                    required
                  />
                </div>
              )}

              {/* Track 2 Mode Selector */}
              {selectedTrack === InternshipTrack.TRACK_2_HYBRID && (
                <div>
                  <label className="block font-semibold text-[#142B4A] mb-1">Internship Mode:</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={InternshipMode.HYBRID}>Hybrid (Recommended)</option>
                    <option value={InternshipMode.ONLINE}>Online / Remote</option>
                    <option value={InternshipMode.OFFLINE}>Offline / On-Premise</option>
                  </select>
                </div>
              )}

              {/* Stipend Yes/No Toggle */}
              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">Stipend Provided?</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsStipend(true)}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      isStipend ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Yes (Stipend Paid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStipend(false)}
                    className={`flex-1 py-2 rounded-xl font-bold transition border ${
                      !isStipend ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    No (Unpaid)
                  </button>
                </div>
              </div>

              {/* Stipend Amount (Visible only if Yes) */}
              {isStipend && (
                <div>
                  <label className="block font-semibold text-[#142B4A] mb-1">Monthly Stipend Amount (₹):</label>
                  <input
                    type="number"
                    value={stipendAmount}
                    onChange={e => setStipendAmount(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                    required
                  />
                </div>
              )}

              {/* Dates & Auto-Calculated Duration */}
              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#142B4A] mb-1">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              {/* Auto Duration calculation display */}
              <div className="md:col-span-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Auto-Calculated Total Duration:</span>
                <strong className="text-[#2855A6] font-bold">{duration.text}</strong>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-[#142B4A] mb-1">Work Profile / Description of Deliverables:</label>
                <textarea
                  value={workProfile}
                  onChange={e => setWorkProfile(e.target.value)}
                  placeholder="Detail your expected technical contributions, tech stacks, and team projects..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Faculty Guide Details */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142B4A] pb-3 border-b border-slate-100">
              Step 3: Designated Faculty Mentor
            </h3>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2855A6] flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#142B4A]">{facultyGuideName}</h4>
                  <p className="text-[11px] text-slate-500">
                    Assigned Faculty Mentor · School of Computer Science and Engineering
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                Your submitted registration and uploaded offer letter will be automatically forwarded to <strong>{facultyGuideName}</strong> for academic syllabus review and initial endorsement.
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Documents Upload */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142B4A] pb-3 border-b border-slate-100">
              Step 4: Upload Required Verification Documents
            </h3>

            <FileUploader
              label="1. Official Internship Offer Letter (Mandatory):"
              helperText="PDF up to 5MB with company letterhead and HR signature"
              onFileSelect={(name, file) => { setOfferLetterDoc(name); setFiles(previous => ({ ...previous, offer: file })); }}
              selectedFileName={offerLetterDoc}
            />

            <FileUploader
              label="2. Joining Letter / Confirmation Slip (Optional):"
              helperText="PDF up to 5MB"
              onFileSelect={(name, file) => { setJoiningLetterDoc(name); setFiles(previous => ({ ...previous, joining: file })); }}
              selectedFileName={joiningLetterDoc}
            />

            <FileUploader
              label="3. Supporting Evidence / Industry Mentor Brief (Optional):"
              helperText="PDF up to 5MB"
              onFileSelect={(name, file) => { setSupportingDoc(name); setFiles(previous => ({ ...previous, supporting: file })); }}
              selectedFileName={supportingDoc}
            />
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-base font-bold text-[#142B4A] pb-3 border-b border-slate-100">
              Step 5: Review Submission & Confirm Registration
            </h3>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Track:</span>
                  <span className="font-bold text-[#142B4A]">{selectedTrack}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Company:</span>
                  <span className="font-bold text-slate-800">{companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Designation:</span>
                  <span className="font-bold text-slate-800">
                    {selectedRole === 'Other' ? customRole : selectedRole}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Stipend:</span>
                  <span className="font-bold text-emerald-700">
                    {isStipend ? `₹${stipendAmount?.toLocaleString()}/month` : 'Unpaid'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Duration:</span>
                  <span className="font-bold text-slate-800">{duration.text}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Guide Mentor:</span>
                  <span className="font-bold text-slate-800">{facultyGuideName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[10px]">Work Profile:</span>
                <p className="text-slate-700 mt-0.5">{workProfile}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[10px]">Offer Letter Document:</span>
                <span className="font-bold text-[#2855A6]">{offerLetterDoc || 'Attached'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-snug">
              <strong>Workflow Handshake:</strong> Upon submission, this record enters <code>Pending Guide Review</code>. Once your guide approves with remarks, it is transmitted to the CDC coordinator for final verification.
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Step
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit for Guide Review</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
