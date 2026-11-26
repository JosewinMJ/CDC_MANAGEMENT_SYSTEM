import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Info,
  ShieldCheck,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { codingChallengeService } from '../../services/codingChallengeService';
import { db } from '../../services/storage';
import { CodingTrackingStatus, Student } from '../../shared/types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useNotification } from '../../context/NotificationContext';

export const RegisterLeetCodePage: React.FC = () => {
  const student = db.getStudent();
  const currentCoding = db.getCodingProfile();
  const { showToast } = useNotification();

  const [usernameInput, setUsernameInput] = useState(currentCoding.username || 'sneha_dev');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: CodingTrackingStatus;
    message: string;
    easy?: number;
    medium?: number;
    hard?: number;
  } | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    setTimeout(async () => {
      const res = await codingChallengeService.verifyLeetCodeUsername(usernameInput);
      setVerificationResult(res);
      setIsVerifying(false);

      if (res.status === CodingTrackingStatus.OK) {
        showToast({
          type: 'success',
          title: 'LeetCode Account Verified',
          message: res.message,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Account Verification Issue',
          message: res.message,
        });
      }
    }, 600);
  };

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationResult || verificationResult.status !== CodingTrackingStatus.OK) {
      await handleVerify();
    }

    await codingChallengeService.registerLeetCode(usernameInput);

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    showToast({
      type: 'success',
      title: 'LeetCode Profile Synchronized',
      message: `Account @${usernameInput} successfully linked to your CDC profile.`,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#142B4A]">Register LeetCode Practice Profile</h1>
        <p className="text-xs text-[#78869A] mt-0.5">
          Link your public LeetCode handle to enable automated nightly sync for Daily Coding Challenge
        </p>
      </div>

      {/* Main Registration Form Card (UI Spec Section B) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 lg:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSaveRegistration} className="space-y-4 text-xs">
          {/* Pre-filled Student Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Candidate Name</span>
              <span className="font-bold text-[#142B4A] text-sm">{student.fullName}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Registration Number</span>
              <span className="font-bold text-[#142B4A] text-sm">{student.regNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Class & Section</span>
              <span className="font-bold text-[#142B4A] text-sm">{currentCoding.classSection}</span>
            </div>
          </div>

          {/* LeetCode Input & Verification Action */}
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
                  placeholder="e.g. sneha_dev or leetcode.com/u/sneha_dev"
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-[#2855A6] font-bold rounded-xl transition shrink-0 disabled:opacity-50"
              >
                {isVerifying ? 'Checking...' : 'Verify Username'}
              </button>
            </div>
          </div>

          {/* Verification Feedback Banner */}
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
                    <p>
                      <strong>How to fix:</strong>
                    </p>
                    <ul className="list-disc list-inside">
                      <li>Log in to LeetCode and verify your profile URL spelling.</li>
                      <li>
                        Ensure your account privacy is set to <strong>Public</strong>.
                      </li>
                      <li>
                        Under Account Settings, enable "Recent AC Problems and Submission Details".
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy & Instructions Helper Notes (UI Spec Section B) */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[#2855A6] space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Mandatory Privacy Configuration</span>
              </div>
              <p>
                Your LeetCode profile must be public. Turn on <strong>'Recent AC Problems and Submission Details'</strong> in your LeetCode privacy settings so your solved problems can be tracked by the institutional nightly crawler.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <strong>Account Switch Notice:</strong> Resubmitting with a different LeetCode account resets your tracked problem counts to that account's verified figures.
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>Confirm & Link LeetCode Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
