import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { codingChallengeService } from '../../services/codingChallengeService';
import { studentService } from '../../services/studentService';
import { CodingTrackingStatus } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const RegisterLeetCodePage: React.FC = () => {
  const { showToast } = useNotification();

  const [studentName, setStudentName] = useState('Loading...');
  const [regNumber, setRegNumber] = useState('...');
  const [classSection, setClassSection] = useState('...');
  const [usernameInput, setUsernameInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: CodingTrackingStatus;
    message: string;
    easy?: number;
    medium?: number;
    hard?: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      studentService.getStudentProfile(),
      codingChallengeService.getCodingProfile(),
    ])
      .then(([stu, coding]) => {
        setStudentName(stu.fullName);
        setRegNumber(stu.regNumber);
        setClassSection(coding.classSection || `${stu.academicRecord.branch} · ${stu.academicRecord.graduationYear}`);
        setUsernameInput(coding.username || '');
      })
      .catch(() => {});
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await codingChallengeService.verifyLeetCodeUsername(usernameInput);
      setVerificationResult(res);
      showToast({
        type: res.status === CodingTrackingStatus.OK ? 'success' : 'error',
        title: res.status === CodingTrackingStatus.OK ? 'LeetCode Account Verified' : 'Verification Issue',
        message: res.message,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Verification Error',
        message: err instanceof Error ? err.message : 'Unable to reach verification service.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (!verificationResult || verificationResult.status !== CodingTrackingStatus.OK) {
        const res = await codingChallengeService.verifyLeetCodeUsername(usernameInput);
        setVerificationResult(res);
        if (res.status !== CodingTrackingStatus.OK) {
          setIsSaving(false);
          return;
        }
      }

      const updated = await codingChallengeService.registerLeetCode(usernameInput);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      showToast({
        type: 'success',
        title: 'LeetCode Profile Linked & Synced',
        message: `@${updated.username} linked. Synced ${updated.syncedNewCount ?? 0} recent accepted solves.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: err instanceof Error ? err.message : 'Could not link LeetCode handle.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Register LeetCode Practice Profile</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Link your public LeetCode handle for live GraphQL tracking &amp; Daily Coding Challenge sync
          </p>
        </div>
        {usernameInput && (
          <a
            href={`https://leetcode.com/u/${encodeURIComponent(usernameInput.replace(/^@/, ''))}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#2855A6] hover:bg-[#EAF2FF]"
          >
            <span>Open My LeetCode Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 lg:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSaveRegistration} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Candidate Name</span>
              <span className="font-bold text-[#142B4A] text-sm">{studentName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Registration Number</span>
              <span className="font-bold text-[#142B4A] text-sm">{regNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Class &amp; Batch</span>
              <span className="font-bold text-[#142B4A] text-sm">{classSection}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#142B4A] uppercase tracking-wider text-[11px] mb-1.5">
              LeetCode Profile Link or Handle:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Terminal className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => {
                    setUsernameInput(e.target.value);
                    setVerificationResult(null);
                  }}
                  placeholder="e.g. your_leetcode_id or https://leetcode.com/u/your_id"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !usernameInput.trim()}
                className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-[#2855A6] font-bold rounded-xl transition shrink-0 disabled:opacity-50"
              >
                {isVerifying ? 'Checking Live...' : 'Verify on LeetCode'}
              </button>
            </div>
          </div>

          {verificationResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                verificationResult.status === CodingTrackingStatus.OK
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              {verificationResult.status === CodingTrackingStatus.OK ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{verificationResult.message}</span>
                  <StatusBadge status={verificationResult.status} />
                </div>

                {verificationResult.status !== CodingTrackingStatus.OK && (
                  <div className="mt-2 text-[11px] text-rose-800 space-y-1">
                    <p><strong>How to fix:</strong></p>
                    <ul className="list-disc list-inside">
                      <li>Verify your LeetCode username spelling on leetcode.com.</li>
                      <li>Ensure your LeetCode profile visibility is set to <strong>Public</strong>.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#2855A6] space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Real-Time LeetCode Sync Enabled</span>
            </div>
            <p>
              Once linked, clicking <strong>Sync Live from LeetCode</strong> on your Daily Coding Dashboard pulls your latest accepted LeetCode submissions directly into the college database.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#2855A6] hover:bg-[#142B4A] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>{isSaving ? 'Linking & Syncing...' : 'Confirm & Link LeetCode Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
