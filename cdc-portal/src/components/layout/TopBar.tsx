import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationPanel } from './NotificationPanel';
import { noticeService } from '../../services/noticeService';
import { studentService } from '../../services/studentService';
import { subscribeToStore } from '../../services/storeEvents';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { currentUser, logoutFromPortal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUnread();
    return subscribeToStore('cdc_notices', loadUnread);
  }, [location.pathname]);

  const loadUnread = async () => {
    try {
      const [notices, profile] = await Promise.all([
        noticeService.getNotices(),
        studentService.getStudentProfile(),
      ]);
      const unread = notices.filter(n => !(n.readByStudentIds || []).includes(profile.id)).length;
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbLabels: Record<string, string> = {
    student: 'Student Portal',
    dashboard: 'Dashboard',
    calendar: 'Unified Calendar',
    profile: 'Profile Management',
    personal: 'Personal Information',
    academic: 'Academic Details',
    skills: 'Skills & Projects',
    documents: 'Resume & Documents',
    internships: 'Internship History',
    placements: 'Placement History',
    companies: 'Upcoming Companies',
    eligibility: 'Company Eligibility',
    applications: 'My Applications',
    interviews: 'Interview Schedules',
    opportunities: 'Internship Opportunities',
    register: 'Register Internship',
    'my-internships': 'My Internships',
    'daily-coding': 'Daily Coding Challenge',
    topics: 'Topic Progress',
    solved: 'Solved Problems',
    posted: 'Posted Questions',
    weekly: 'Weekly Reports',
    notices: 'Notices & Announcements',
    chat: 'Mentor Chat',
    'parent-alerts': 'Parent Alerts',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logoutFromPortal('student');
    navigate('/student/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[#78869A]">
          <Link to="/student/dashboard" className="hover:text-[#142B4A] transition">
            Home
          </Link>
          {pathParts.map((part, index) => {
            const isLast = index === pathParts.length - 1;
            const label = breadcrumbLabels[part] || part;
            return (
              <React.Fragment key={`${part}-${index}`}>
                <span className="text-slate-300">/</span>
                <span className={isLast ? 'font-semibold text-[#142B4A]' : 'hover:text-[#142B4A]'}>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search companies, drives, topics, notices..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F5F7FA] border border-slate-200 rounded-lg text-[#263445] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] transition"
        />
      </form>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#142B4A] transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <NotificationPanel
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        <Link
          to="/student/help"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#142B4A] transition hidden sm:block"
          title="CDC Help & Placement FAQs"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
            alt={currentUser.name}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
          />
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-bold text-[#142B4A]">{currentUser.name}</div>
            <p className="text-[11px] text-[#78869A]">{currentUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
