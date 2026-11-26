import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  User,
  GraduationCap,
  Code2,
  FileText,
  Briefcase,
  History,
  Building2,
  CheckCircle,
  FileCheck2,
  Clock,
  Compass,
  FilePlus2,
  Layers,
  Terminal,
  BarChart3,
  ListCheck,
  CheckSquare2,
  CalendarDays,
  UserCheck,
  Bell,
  AlertTriangle,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Calendar', path: '/student/calendar', icon: Calendar },
      ],
    },
    {
      title: 'MY PROFILE',
      items: [
        { label: 'Personal Information', path: '/student/profile/personal', icon: User },
        { label: 'Academic Details', path: '/student/profile/academic', icon: GraduationCap },
        { label: 'Skills & Projects', path: '/student/profile/skills', icon: Code2 },
        { label: 'Resume & Documents', path: '/student/profile/documents', icon: FileText },
        { label: 'Internship History', path: '/student/profile/internships', icon: Briefcase },
        { label: 'Placement History', path: '/student/profile/placements', icon: History },
      ],
    },
    {
      title: 'PLACEMENTS',
      items: [
        { label: 'Upcoming Companies', path: '/student/companies', icon: Building2 },
        { label: 'Company Eligibility', path: '/student/eligibility', icon: CheckCircle },
        { label: 'My Applications', path: '/student/applications', icon: FileCheck2 },
        { label: 'Interview Schedules', path: '/student/interviews', icon: Clock },
      ],
    },
    {
      title: 'INTERNSHIPS',
      items: [
        { label: 'Internship Opportunities', path: '/student/internships/opportunities', icon: Compass },
        { label: 'Register Internship', path: '/student/internships/register', icon: FilePlus2 },
        { label: 'My Internships', path: '/student/internships/my-internships', icon: Layers },
      ],
    },
    {
      title: 'SKILL DEVELOPMENT',
      items: [
        { label: 'Daily Coding Challenge', path: '/student/daily-coding/dashboard', icon: Terminal, highlight: true },
        { label: 'Topic Progress', path: '/student/daily-coding/topics', icon: BarChart3 },
        { label: 'Solved Problems', path: '/student/daily-coding/solved', icon: ListCheck },
        { label: 'Posted Questions', path: '/student/daily-coding/posted', icon: CheckSquare2 },
        { label: 'Weekly Reports', path: '/student/daily-coding/weekly', icon: CalendarDays },
        { label: 'Register LeetCode', path: '/student/daily-coding/register', icon: UserCheck },
      ],
    },
    {
      title: 'COMMUNICATION',
      items: [
        { label: 'Notices & Announcements', path: '/student/notices', icon: Bell },
        { label: 'Parent Alerts', path: '/student/parent-alerts', icon: AlertTriangle },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#142B4A]/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Institutional Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-[#142B4A] text-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2855A6] to-blue-400 flex items-center justify-center font-bold text-white shadow-xs">
            CDC
          </div>
          <div className="leading-tight">
            <h1 className="text-xs font-bold tracking-wider uppercase text-blue-200">
              Career Development Centre
            </h1>
            <p className="text-[13px] font-semibold text-white">Student Portal</p>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map(section => (
            <div key={section.title}>
              <h3 className="px-3 text-[10px] font-bold text-[#78869A] tracking-wider uppercase mb-1.5">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                          isActive
                            ? 'bg-[#EAF2FF] text-[#2855A6] font-semibold shadow-2xs'
                            : 'text-[#263445] hover:bg-slate-100/80 hover:text-[#142B4A]'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-[#2855A6]'
                                  : 'text-[#78869A] group-hover:text-[#142B4A]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.highlight && (
                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#2855A6]">
                              <Sparkles className="w-2.5 h-2.5" />
                              NEW
                            </span>
                          )}

                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2855A6] shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Utility Bar */}
        <div className="p-3 border-t border-slate-100 bg-[#F5F7FA]/70 space-y-1">
          <NavLink
            to="/student/help"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#78869A] hover:bg-white hover:text-[#142B4A] transition"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & Support</span>
          </NavLink>
          <NavLink
            to="/student/settings"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#78869A] hover:bg-white hover:text-[#142B4A] transition"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
