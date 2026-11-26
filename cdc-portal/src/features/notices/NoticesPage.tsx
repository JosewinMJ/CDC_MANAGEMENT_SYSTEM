import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Filter,
  CheckCheck,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { noticeService } from '../../services/noticeService';
import { db, subscribeToStore } from '../../services/storage';
import { Notice, NoticeCategory, NoticePriority } from '../../shared/types';
import { formatDateTime } from '../../shared/utils';
import { useNotification } from '../../context/NotificationContext';

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory>(NoticeCategory.ALL);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const { showToast } = useNotification();
  const currentStudentId = 'stud-21bce1042';

  const loadNotices = async () => {
    const list = await noticeService.getNotices();
    setNotices(list);
    if (!selectedNotice && list.length > 0) {
      setSelectedNotice(list[0]);
    }
  };

  useEffect(() => {
    loadNotices();
    const unsub = subscribeToStore('cdc_notices', loadNotices);
    return () => unsub();
  }, []);

  const handleMarkAllRead = async () => {
    await noticeService.markAllAsRead();
    await loadNotices();
    showToast({ type: 'success', title: 'All Notices Marked Read', message: 'Unread indicators cleared.' });
  };

  const handleSelectNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    if (!notice.readByStudentIds.includes(currentStudentId)) {
      noticeService.markAsRead(notice.id);
      loadNotices();
    }
  };

  const filteredNotices = notices.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.publisherName.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === NoticeCategory.ALL || n.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const unreadCount = notices.filter(n => !n.readByStudentIds.includes(currentStudentId)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#142B4A]">Official Notices & Announcements</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2855A6] text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#78869A] mt-0.5">
            Institutional broadcasts from the Career Development Centre and your assigned faculty mentor
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-[#2855A6] hover:bg-slate-50 text-xs font-bold rounded-xl transition self-start sm:self-auto shadow-2xs"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements by title, keywords, or faculty name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as any)}
          className="w-full md:w-auto p-2 text-xs bg-[#F5F7FA] border border-slate-200 rounded-xl text-slate-700 font-semibold"
        >
          <option value={NoticeCategory.ALL}>All Announcement Categories</option>
          <option value={NoticeCategory.PLACEMENT}>Placement Drives</option>
          <option value={NoticeCategory.INTERNSHIP}>Internships</option>
          <option value={NoticeCategory.DEADLINE}>Deadlines & Submissions</option>
          <option value={NoticeCategory.INTERVIEW}>Interview Schedules</option>
          <option value={NoticeCategory.GUIDE}>Faculty Guide Instructions</option>
          <option value={NoticeCategory.GENERAL}>General Notices</option>
        </select>
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Notices Roster (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
          {filteredNotices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No notices match your selected search or filter.
            </div>
          ) : (
            filteredNotices.map(notice => {
              const isUnread = !notice.readByStudentIds.includes(currentStudentId);
              const isSelected = selectedNotice?.id === notice.id;

              return (
                <div
                  key={notice.id}
                  onClick={() => handleSelectNotice(notice)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-[#2855A6] bg-[#EAF2FF]/60 shadow-xs ring-1 ring-[#2855A6]/20'
                      : isUnread
                      ? 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/80'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#2855A6]">
                      {notice.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {notice.isImportant && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                          HIGH PRIORITY
                        </span>
                      )}
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#2855A6]" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-[#142B4A] line-clamp-1">{notice.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{notice.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-400">
                    <span>{notice.publisherName}</span>
                    <span>{formatDateTime(notice.publishedDate)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Notice Inspection Pane (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          {selectedNotice ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#2855A6] uppercase tracking-wider">
                    {selectedNotice.category}
                  </span>

                  {selectedNotice.isImportant && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                      High Priority Broadcast
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-[#142B4A] leading-snug">
                  {selectedNotice.title}
                </h2>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 pt-1">
                  <span>
                    Publisher: <strong className="text-slate-800">{selectedNotice.publisherName}</strong> ({selectedNotice.publisherRole})
                  </span>
                  <span>
                    Published: <strong className="text-slate-800">{formatDateTime(selectedNotice.publishedDate)}</strong>
                  </span>
                </div>
              </div>

              {/* Content Body */}
              <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-sans">
                {selectedNotice.content}
              </div>

              {/* Attachments Section */}
              {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider">
                    Attached Documents & Guidelines:
                  </h4>

                  <div className="space-y-2">
                    {selectedNotice.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-[#2855A6] shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 truncate">{att.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                        </div>

                        <button
                          onClick={() => showToast({ type: 'info', title: 'Attachment Download', message: `Downloading ${att.name}` })}
                          className="flex items-center gap-1 text-xs font-bold text-[#2855A6] hover:underline shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400">
              Select an announcement to read full details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
