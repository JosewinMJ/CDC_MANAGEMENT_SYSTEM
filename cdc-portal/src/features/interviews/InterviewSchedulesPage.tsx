import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ExternalLink,
  AlertCircle,
  FileText,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { interviewService } from '../../services/interviewService';
import { Interview } from '../../shared/types';
import { formatDate } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const InterviewSchedulesPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const { showToast } = useNotification();

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    const list = await interviewService.getInterviews();
    setInterviews(list);
  };

  const handleJoinMeeting = (link: string, company: string) => {
    showToast({
      type: 'info',
      title: 'Connecting to Meeting Room',
      message: `Opening proctored meeting room for ${company}.`,
    });
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#142B4A]">Interview & Assessment Schedules</h1>
          <p className="text-xs text-[#78869A] mt-0.5">
            Upcoming technical evaluations, coding assessments, and campus recruitment panels
          </p>
        </div>
      </div>

      {/* Important Alert Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3 text-xs text-[#2855A6]">
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Campus Interview Protocol:</strong> For online rounds, ensure a quiet space, clean desk, functioning webcam, and verified institutional photo ID. For in-person rounds, formal attire and two printed copies of your CDC-verified resume are mandatory.
        </div>
      </div>

      {/* Interview Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interviews.map(interview => (
          <div
            key={interview.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              {/* Top: Company Logo, Name and Round Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={interview.companyLogo}
                    alt={interview.companyName}
                    className="w-10 h-10 object-contain p-1 border border-slate-200 rounded-xl bg-white shadow-2xs"
                  />
                  <div>
                    <h3 className="text-base font-bold text-[#142B4A]">{interview.companyName}</h3>
                    <p className="text-xs text-[#78869A] font-semibold">{interview.roleTitle}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#2855A6]">
                  {interview.status}
                </span>
              </div>

              {/* Round Name */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block">
                  Evaluation Stage
                </span>
                <span className="text-xs font-bold text-[#142B4A]">{interview.roundName}</span>
              </div>

              {/* Time & Venue / Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#2855A6] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Date & Time</span>
                    <span className="font-bold text-slate-800">{formatDate(interview.scheduledDate)}</span>
                    <span className="block text-[11px] text-slate-500">{interview.scheduledTime}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                  {interview.isOnline ? (
                    <Video className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <MapPin className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  )}
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px]">Mode & Location</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {interview.isOnline ? 'Online Meeting Link' : 'In-Person Campus Block'}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {interview.venueOrLink}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <span className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider block mb-1">
                  Candidate Instructions
                </span>
                <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed">
                  {interview.instructions}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">CDC Admit Card Verified</span>

              {interview.isOnline ? (
                <button
                  onClick={() => handleJoinMeeting(interview.venueOrLink, interview.companyName)}
                  className="px-4 py-2 bg-[#2855A6] hover:bg-[#142B4A] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Online Interview</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              ) : (
                <div className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Room 304 (In-Person)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
