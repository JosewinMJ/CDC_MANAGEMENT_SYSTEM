import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { db } from '../../services/storage';
import { studentService } from '../../services/studentService';
import { parentAlertService } from '../../services/parentAlertService';
import { Student, ParentContact, NotificationChannel } from '../../shared/types';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { maskPhoneNumber } from '../../shared/utils';

export const PersonalTab: React.FC = () => {
  const [student, setStudent] = useState<Student>(db.getStudent());
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [phone, setPhone] = useState(student.phone);
  const [address, setAddress] = useState(student.address);

  // Parent Contact Modal States
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [parentName, setParentName] = useState(student.parentContact.name);
  const [relationship, setRelationship] = useState(student.parentContact.relationship);
  const [parentPhone, setParentPhone] = useState(student.parentContact.phone);
  const [parentEmail, setParentEmail] = useState(student.parentContact.email || '');
  const [preferredChannel, setPreferredChannel] = useState<NotificationChannel>(
    student.parentContact.preferredChannel
  );
  const [consentGiven, setConsentGiven] = useState(student.parentContact.consentGiven);

  // OTP flow simulation
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const { showToast } = useNotification();

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await studentService.updatePersonalProfile({ phone, address });
    setStudent(updated);
    setIsEditingPersonal(false);
    showToast({ type: 'success', title: 'Personal Info Updated', message: 'Contact details saved successfully.' });
  };

  const handleSendOtp = () => {
    if (!parentPhone || parentPhone.length < 10) {
      setOtpError('Please provide a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    setOtpError(null);
    showToast({
      type: 'info',
      title: 'Verification OTP Sent',
      message: `A 6-digit verification code was sent to ${maskPhoneNumber(parentPhone)}. (Use demo code: 123456)`,
    });
  };

  const handleVerifyAndSaveParent = async () => {
    if (!consentGiven) {
      setOtpError('You must grant consent for parent placement notifications.');
      return;
    }

    if (otpSent) {
      const verifyRes = await parentAlertService.verifyParentPhoneOtp(enteredOtp);
      if (!verifyRes.success) {
        setOtpError(verifyRes.message);
        return;
      }
    }

    const updatedContact = await parentAlertService.updateParentContact({
      name: parentName,
      relationship,
      phone: parentPhone,
      email: parentEmail,
      preferredChannel,
      consentGiven,
    });

    setStudent(db.getStudent());
    setIsParentModalOpen(false);
    setOtpSent(false);
    setEnteredOtp('');
    setOtpError(null);

    showToast({
      type: 'success',
      title: 'Parent Details Saved',
      message: 'Parent contact and alert preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Personal Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#142B4A]">Student Personal Details</h3>
            <p className="text-xs text-[#78869A] mt-0.5">
              Official institutional records and editable student contact information
            </p>
          </div>

          {!isEditingPersonal && (
            <button
              onClick={() => setIsEditingPersonal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2855A6] bg-[#EAF2FF] hover:bg-blue-100 rounded-lg transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Contact
            </button>
          )}
        </div>

        {isEditingPersonal ? (
          <form onSubmit={handleSavePersonal} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#142B4A] mb-1">
                  Primary Mobile Number:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142B4A] mb-1">
                  Institutional Email (Read-only):
                </label>
                <input
                  type="text"
                  value={student.email}
                  disabled
                  className="w-full p-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#142B4A] mb-1">
                  Residential Address:
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingPersonal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5 text-xs">
            <div>
              <span className="text-[#78869A] block mb-1">Full Name</span>
              <p className="font-semibold text-slate-800 text-sm">{student.fullName}</p>
            </div>

            <div>
              <span className="text-[#78869A] block mb-1">Registration Number</span>
              <p className="font-semibold text-slate-800 text-sm">{student.regNumber}</p>
            </div>

            <div>
              <span className="text-[#78869A] block mb-1">Institutional Email</span>
              <p className="font-semibold text-slate-800 text-sm">{student.email}</p>
            </div>

            <div>
              <span className="text-[#78869A] block mb-1">Mobile Phone</span>
              <p className="font-semibold text-slate-800 text-sm">{student.phone}</p>
            </div>

            <div>
              <span className="text-[#78869A] block mb-1">Date of Birth</span>
              <p className="font-semibold text-slate-800 text-sm">{student.dob}</p>
            </div>

            <div>
              <span className="text-[#78869A] block mb-1">Gender</span>
              <p className="font-semibold text-slate-800 text-sm">{student.gender}</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-[#78869A] block mb-1">Current Residential Address</span>
              <p className="font-semibold text-slate-800 text-sm">{student.address}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Parent / Guardian Alert System Card (UI Spec Section B) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2855A6] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#142B4A]">Parent / Guardian Notification Contact</h3>
                {student.parentContact.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified via OTP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Verification Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-[#78869A] mt-0.5">
                Designated contact for placement eligibility updates and impending application deadline reminders
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsParentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2855A6] hover:bg-[#142B4A] rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Parent Details
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-5 text-xs">
          <div>
            <span className="text-[#78869A] block mb-1">Parent / Guardian Name</span>
            <p className="font-bold text-slate-800 text-sm">{student.parentContact.name}</p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Relationship</span>
            <p className="font-semibold text-slate-800 text-sm">{student.parentContact.relationship}</p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Contact Number</span>
            <p className="font-semibold text-slate-800 text-sm">{student.parentContact.phone}</p>
          </div>

          <div>
            <span className="text-[#78869A] block mb-1">Preferred Channel</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              {student.parentContact.preferredChannel}
            </span>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[#78869A] block mb-1">Email Address (Optional)</span>
            <p className="font-semibold text-slate-800 text-sm">
              {student.parentContact.email || 'None Provided'}
            </p>
          </div>

          <div className="sm:col-span-2">
            <span className="text-[#78869A] block mb-1">Parent Notification Consent Status</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Consent Granted by Student for Automated Reminders
            </span>
          </div>
        </div>

        {/* Small Privacy Note (UI Spec Section D) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-[#78869A]">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong>Institutional Privacy Notice:</strong> Parent notifications are strictly restricted to placement opportunities, eligibility deadlines, and internship updates. Academic mentoring remarks remain confidential.
          </span>
        </div>
      </div>

      {/* Edit Parent Modal with OTP Verification */}
      <Modal
        isOpen={isParentModalOpen}
        onClose={() => {
          setIsParentModalOpen(false);
          setOtpSent(false);
          setOtpError(null);
        }}
        title="Edit Parent / Guardian Details & Verification"
        subtitle="Update notification contact and authenticate via mobile OTP"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Parent / Guardian Full Name:</label>
            <input
              type="text"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#142B4A] mb-1">Relationship:</label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#142B4A] mb-1">Preferred Channel:</label>
              <select
                value={preferredChannel}
                onChange={e => setPreferredChannel(e.target.value as any)}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value={NotificationChannel.WHATSAPP}>WhatsApp (Recommended)</option>
                <option value={NotificationChannel.SMS}>SMS</option>
                <option value={NotificationChannel.EMAIL}>Email</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Parent Mobile Number:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
                placeholder="+91 98401 23456"
                className="flex-1 p-2.5 border border-slate-300 rounded-xl font-mono"
                required
              />
              <button
                type="button"
                onClick={handleSendOtp}
                className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-[#2855A6] font-bold rounded-xl transition"
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <span className="block font-bold text-[#142B4A]">
                Enter 6-Digit OTP sent to {maskPhoneNumber(parentPhone)}:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value)}
                  placeholder="123456"
                  className="w-36 p-2 text-center text-sm font-mono tracking-widest border border-blue-300 rounded-lg bg-white"
                />
                <span className="text-[11px] text-[#78869A]">(Demo test code: 123456)</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#142B4A] mb-1">Parent Email (Optional):</label>
            <input
              type="email"
              value={parentEmail}
              onChange={e => setParentEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded text-[#2855A6] focus:ring-[#2855A6]"
              />
              <span className="text-slate-700 leading-snug">
                I agree that my parent/guardian may be notified about placement opportunities, eligibility deadlines, and missed applications in accordance with CDC guidelines.
              </span>
            </label>
          </div>

          {otpError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsParentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleVerifyAndSaveParent}
              className="px-5 py-2 text-xs font-bold bg-[#2855A6] hover:bg-[#142B4A] text-white rounded-xl shadow-xs transition"
            >
              Verify & Save Details
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
