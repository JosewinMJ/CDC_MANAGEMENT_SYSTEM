import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../shared/types';
import { NotificationPanel } from './NotificationPanel';
import { noticeService } from '../../services/noticeService';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { currentUser, currentRole, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUnread();
  }, [location.pathname]);

  const loadUnread = async () => {
    const notices = await noticeService.getNotices();
    const unread = notices.filter(n => !n.readByStudentIds.includes('stud-21bce1042')).length;
    setUnreadCount(unread);
  };

  // Build breadcrumbs from path
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
    'parent-alerts': 'Parent Alerts',
    guide: 'Guide Portal',
    admin: 'Admin Portal',
  };

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleMenuOpen(false);
    if (role === UserRole.STUDENT) {
      navigate('/student/dashboard');
    } else if (role === UserRole.GUIDE) {
      navigate('/guide');
    } else {
      navigate('/admin');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/student/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile hamburger + Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb path */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-[#78869A]">
          <Link to="/student/dashboard" className="hover:text-[#142B4A] transition">
            Home
          </Link>
          {pathParts.map((part, index) => {
            const isLast = index === pathParts.length - 1;
            const label = breadcrumbLabels[part] || part;
            return (
              <React.Fragment key={part}>
                <span className="text-slate-300">/</span>
                <span className={isLast ? 'font-semibold text-[#142B4A]' : 'hover:text-[#142B4A]'}>
                  {label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Middle: Global Search */}
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

      {/* Right: Notifications, Help, User Profile & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
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

        {/* Help icon */}
        <Link
          to="/student/help"
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#142B4A] transition hidden sm:block"
          title="CDC Help & Placement FAQs"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Card & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition text-left"
          >
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
            />
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#142B4A]">{currentUser.name}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-[#2855A6]">
                  {currentRole === UserRole.STUDENT
                    ? 'Student'
                    : currentRole === UserRole.GUIDE
                    ? 'Guide'
                    : 'Admin'}
                </span>
              </div>
              <p className="text-[11px] text-[#78869A]">
                {currentRole === UserRole.STUDENT ? '21BCE1042 · CSE' : currentUser.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role selector dropdown */}
          {isRoleMenuOpen && (
            <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] font-bold text-[#78869A] uppercase tracking-wider">
                  Select Portal & Role
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Switch active perspective</p>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => handleRoleSelect(UserRole.STUDENT)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                    currentRole === UserRole.STUDENT
                      ? 'bg-[#EAF2FF] text-[#2855A6] font-semibold'
                      : 'text-[#263445] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#2855A6]" />
                    <span>Student Portal</span>
                  </div>
                  {currentRole === UserRole.STUDENT && <span className="w-1.5 h-1.5 rounded-full bg-[#2855A6]" />}
                </button>

                <button
                  onClick={() => handleRoleSelect(UserRole.GUIDE)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                    currentRole === UserRole.GUIDE
                      ? 'bg-[#EAF2FF] text-[#2855A6] font-semibold'
                      : 'text-[#263445] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <div className="text-left">
                      <span>Guide Portal (Faculty)</span>
                      <p className="text-[10px] text-slate-400">Sections 4 of report</p>
                    </div>
                  </div>
                  {currentRole === UserRole.GUIDE && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>

                <button
                  onClick={() => handleRoleSelect(UserRole.ADMIN_SUPER)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition ${
                    currentRole.startsWith('ADMIN')
                      ? 'bg-[#EAF2FF] text-[#2855A6] font-semibold'
                      : 'text-[#263445] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div className="text-left">
                      <span>Admin Portal (CDC)</span>
                      <p className="text-[10px] text-slate-400">Sections 5 of report</p>
                    </div>
                  </div>
                  {currentRole.startsWith('ADMIN') && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                </button>
              </div>

              <div className="mt-1 pt-1 border-t border-slate-100 px-3 py-1">
                <p className="text-[10px] text-slate-400">
                  Current Session: <strong>Academic Year 2026–2027</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
