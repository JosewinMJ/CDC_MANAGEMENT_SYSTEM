import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, AlertTriangle, Briefcase, FileText, ChevronRight } from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { parentAlertService } from '../../services/parentAlertService';
import { studentService } from '../../services/studentService';
import { Notice, ParentAlert } from '../../shared/types';
import { formatDateTime } from '../../shared/utils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [alerts, setAlerts] = useState<ParentAlert[]>([]);
  const [studentId, setStudentId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    const [allNotices, allAlerts, profile] = await Promise.all([
      noticeService.getNotices(),
      parentAlertService.getParentAlerts(),
      studentService.getStudentProfile(),
    ]);
    setNotices(allNotices);
    setAlerts(allAlerts);
    setStudentId(profile.id);
  };

  const handleMarkAllRead = async () => {
    await noticeService.markAllAsRead();
    loadData();
  };

  const handleNoticeClick = async (notice: Notice) => {
    await noticeService.markAsRead(notice.id);
    onClose();
    navigate('/student/notices');
  };

  if (!isOpen) return null;

  const unreadNotices = notices.filter(n => !studentId || !n.readByStudentIds.includes(studentId));

  return (
    <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#F5F7FA]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#2855A6]" />
          <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">Notifications</h4>
          {unreadNotices.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2855A6] text-white">
              {unreadNotices.length} new
            </span>
          )}
        </div>

        {unreadNotices.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#2855A6] hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {unreadNotices.length === 0 && (
          <div className="p-6 text-center text-xs text-[#78869A]">
            No unread notifications at this time.
          </div>
        )}

        {unreadNotices.map(notice => (
          <div
            key={notice.id}
            onClick={() => handleNoticeClick(notice)}
            className="p-3.5 hover:bg-blue-50/40 cursor-pointer transition flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2855A6] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  {notice.category}
                </span>
                <span className="text-[10px] text-slate-400">{formatDateTime(notice.publishedDate)}</span>
              </div>
              <h5 className="text-xs font-semibold text-[#142B4A] mt-1 truncate">{notice.title}</h5>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{notice.content}</p>
            </div>
          </div>
        ))}

        {/* Parent alert trigger highlight */}
        {alerts.length > 0 && (
          <div
            onClick={() => {
              onClose();
              navigate('/student/parent-alerts');
            }}
            className="p-3.5 bg-amber-50/70 hover:bg-amber-100/60 cursor-pointer transition flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                Parent Notification Update
              </span>
              <p className="text-xs font-medium text-amber-950 mt-0.5">
                Automated reminder scheduled for eligible companies pending your application.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 mt-1">
                View alert rules & log <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <button
          onClick={() => {
            onClose();
            navigate('/student/notices');
          }}
          className="text-xs font-semibold text-[#2855A6] hover:underline"
        >
          View all notices & announcements →
        </button>
      </div>
    </div>
  );
};
