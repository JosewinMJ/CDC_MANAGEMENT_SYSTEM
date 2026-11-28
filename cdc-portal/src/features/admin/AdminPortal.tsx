import React, { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardCheck,
  DatabaseBackup,
  Terminal,
  LogOut,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, downloadApiFile } from '../../services/apiClient';
import { DocumentDownload } from '../../components/common/DocumentDownload';
import {
  AdminEligibilityModal,
  AdminFacultyRosterModal,
  AdminGovernanceTab,
  AdminReportsPanel,
  AdminStudentEditModal,
} from './AdminGovernancePanels';

interface AdminDashboardResp {
  kpis: {
    totalStudents: number;
    placedStudents: number;
    shortlistedStudents: number;
    placementRate: number;
    avgLpa: number;
    maxLpa: number;
    totalFaculty: number;
    totalCompanies: number;
    upcomingDrives?: number;
    totalApplications: number;
    pendingCorrections: number;
    pendingInternships: number;
    pendingDocuments?: number;
    incompleteProfiles?: number;
    completedInternships?: number;
    ppoConversions?: number;
  };
  departmentBreakdown: Array<{ branch: string; total: number; placed: number }>;
  recentAudits: Array<{ id: number; actor_name: string; actor_role: string; action: string; entity_type: string; details: string; created_at: string }>;
  academicYears?: string[];
}

export const AdminPortal: React.FC = () => {
  const { currentUser, logoutFromPortal } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState<AdminDashboardResp | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [audits, setAudits] = useState<{ audits: any[]; syncs: any[] }>({ audits: [], syncs: [] });
  const [adminNotices, setAdminNotices] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Filter & Modal States
  const [studentQuery, setStudentQuery] = useState('');
  const [studentBranchFilter, setStudentBranchFilter] = useState('ALL');
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [rosterFaculty, setRosterFaculty] = useState<any | null>(null);
  const [eligibilityCompanyId, setEligibilityCompanyId] = useState<number | null>(null);
  const [internshipTab, setInternshipTab] = useState('PENDING_CDC_APPROVAL');
  const [addingRoleForCompanyId, setAddingRoleForCompanyId] = useState<number | null>(null);
  const [extraRole, setExtraRole] = useState({ role_title: '', job_type: 'Full-time', package_lpa: '10.0', stipend: '', min_cgpa: '7.5' });

  const [newStu, setNewStu] = useState({ reg_number: '', name: '', email: '', branch: 'CSE', current_cgpa: '8.20', active_backlogs: '0', assigned_guide_id: '' });
  const [newFac, setNewFac] = useState({ employee_id: '', name: '', email: '', department: 'CSE', designation: 'Assistant Professor', coordinator_role: 'faculty_guide' });
  const [newComp, setNewComp] = useState({ name: '', industry: 'Cloud & AI', tier: 'dream', role_title: 'Software Engineer', job_type: 'Full-time', package_lpa: '12.00', stipend: '', min_cgpa: '7.5', min_tenth: '70', min_twelfth: '70', max_backlogs: '0', branches: 'CSE,IT,AIML,ECE', application_deadline: '2026-12-20' });
  const [newQ, setNewQ] = useState({ title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '2026-12-05' });
  const [importScope, setImportScope] = useState<'auto' | 'students' | 'faculty' | 'companies'>('auto');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fallbackPass, setFallbackPass] = useState('Portal@1234');
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', priority: 'High', category: 'Placement', target_portal: 'all', target_academic_year: '', target_student_profile_id: '', expiry_date: '', attachment_name: '' });

  const loadAll = async (yearParam = academicYear, stuSearch = studentQuery, stuBranch = studentBranchFilter) => {
    try {
      const qsStudents = new URLSearchParams();
      if (stuSearch.trim()) qsStudents.set('q', stuSearch.trim());
      if (stuBranch !== 'ALL') qsStudents.set('branch', stuBranch);
      if (yearParam !== 'ALL') qsStudents.set('academic_year', yearParam);

      const [d, s, f, c, a, corr, intern, qs, lb, aud, nts] = await Promise.all([
        apiRequest<AdminDashboardResp>(`/admin/dashboard?academic_year=${encodeURIComponent(yearParam)}`, { portal: 'admin' }),
        apiRequest<any[]>(`/admin/students?${qsStudents.toString()}`, { portal: 'admin' }),
        apiRequest<any[]>('/admin/faculty', { portal: 'admin' }),
        apiRequest<any[]>('/companies', { portal: 'admin' }),
        apiRequest<any[]>('/admin/applications', { portal: 'admin' }),
        apiRequest<any[]>('/admin/corrections', { portal: 'admin' }),
        apiRequest<any[]>('/guide/internships', { portal: 'admin' }),
        apiRequest<any[]>('/coding-challenge/questions', { portal: 'admin' }),
        apiRequest<any[]>('/coding-challenge/leaderboard', { portal: 'admin' }),
        apiRequest<{ audits: any[]; syncs: any[] }>('/admin/audit-logs', { portal: 'admin' }),
        apiRequest<any[]>('/admin/notices', { portal: 'admin' }),
      ]);
      setDash(d);
      setStudents(s);
      setFaculty(f);
      setCompanies(c);
      setApplications(a);
      setCorrections(corr);
      setInternships(intern);
      setQuestions(qs);
      setLeaderboard(lb);
      setAudits(aud);
      setAdminNotices(nts);
    } catch (e) {
      setStatusMsg({ type: 'err', text: e instanceof Error ? e.message : 'Unable to load Admin data.' });
    }
  };

  useEffect(() => {
    loadAll(academicYear, studentQuery, studentBranchFilter);
  }, [academicYear, studentBranchFilter]);

  const handleLogout = async () => {
    await logoutFromPortal('admin');
    navigate('/admin/login', { replace: true });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/students', {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({
          ...newStu,
          current_cgpa: parseFloat(newStu.current_cgpa),
          active_backlogs: parseInt(newStu.active_backlogs, 10),
          assigned_guide_id: newStu.assigned_guide_id ? Number(newStu.assigned_guide_id) : null,
        }),
      });
      setNewStu({ reg_number: '', name: '', email: '', branch: 'CSE', current_cgpa: '8.20', active_backlogs: '0', assigned_guide_id: '' });
      setStatusMsg({ type: 'ok', text: 'Student added to MySQL Student DB.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add student' });
    }
  };

  const handleDeleteStudent = async (id: number) => {
    try {
      await apiRequest(`/admin/students/${id}`, { method: 'DELETE', portal: 'admin' });
      setStatusMsg({ type: 'ok', text: 'Student archived safely (soft delete).' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/faculty', { method: 'POST', portal: 'admin', body: JSON.stringify(newFac) });
      setNewFac({ employee_id: '', name: '', email: '', department: 'CSE', designation: 'Assistant Professor', coordinator_role: 'faculty_guide' });
      setStatusMsg({ type: 'ok', text: 'Faculty/Guide added to Faculty DB.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add faculty' });
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const branches = newComp.branches.split(',').map(b => b.trim().toUpperCase()).filter(Boolean);
      await apiRequest('/admin/companies', {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({
          name: newComp.name,
          industry: newComp.industry,
          tier: newComp.tier,
          role_title: newComp.role_title,
          job_type: newComp.job_type,
          package_lpa: parseFloat(newComp.package_lpa),
          stipend: newComp.stipend || null,
          min_cgpa: parseFloat(newComp.min_cgpa),
          min_tenth: parseFloat(newComp.min_tenth),
          min_twelfth: parseFloat(newComp.min_twelfth),
          max_backlogs: parseInt(newComp.max_backlogs, 10),
          allowed_branches: branches.length ? branches : ['CSE', 'IT'],
          application_deadline: newComp.application_deadline,
          academic_year: academicYear === 'ALL' ? '2026-2027' : academicYear,
        }),
      });
      setNewComp({ name: '', industry: 'Cloud & AI', tier: 'dream', role_title: 'Software Engineer', job_type: 'Full-time', package_lpa: '12.00', stipend: '', min_cgpa: '7.5', min_tenth: '70', min_twelfth: '70', max_backlogs: '0', branches: 'CSE,IT,AIML,ECE', application_deadline: '2026-12-20' });
      setStatusMsg({ type: 'ok', text: 'Company & Job Role published across all 3 portals.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create drive' });
    }
  };

  const handleAddRoleToCompany = async (companyId: number) => {
    try {
      await apiRequest(`/admin/companies/${companyId}/roles`, {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({
          role_title: extraRole.role_title,
          job_type: extraRole.job_type,
          package_lpa: parseFloat(extraRole.package_lpa),
          stipend: extraRole.stipend || null,
          min_cgpa: parseFloat(extraRole.min_cgpa),
        }),
      });
      setAddingRoleForCompanyId(null);
      setExtraRole({ role_title: '', job_type: 'Full-time', package_lpa: '10.0', stipend: '', min_cgpa: '7.5' });
      setStatusMsg({ type: 'ok', text: 'Additional job role added to company drive.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add role' });
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/coding-challenge/questions', {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({ ...newQ, topics: ['DSA'] }),
      });
      setNewQ({ title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '2026-12-05' });
      setStatusMsg({ type: 'ok', text: 'Daily Coding Challenge question posted for students.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to post coding question' });
    }
  };

  const handleAdvanceApp = async (appId: number, status: string) => {
    try {
      await apiRequest(`/admin/applications/${appId}/stage`, {
        method: 'PATCH',
        portal: 'admin',
        body: JSON.stringify({ status, remarks: `Updated to ${status} by CDC Admin` }),
      });
      setStatusMsg({ type: 'ok', text: `Application #${appId} moved to ${status}.` });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to update stage' });
    }
  };

  const handleReviewCorrection = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/admin/corrections/${id}`, {
        method: 'PATCH',
        portal: 'admin',
        body: JSON.stringify({ status, remarks: status === 'APPROVED' ? 'Verified against official grade sheet' : 'Rejected by CDC Admin' }),
      });
      setStatusMsg({ type: 'ok', text: `Academic correction #${id} ${status}.` });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to review correction' });
    }
  };

  const handleFinalInternship = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/internships/${id}/review`, {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({ role: 'ADMIN_INTERNSHIP', decision, remarks: `Coordinator final decision: ${decision}` }),
      });
      setStatusMsg({ type: 'ok', text: `Internship #${id} ${decision}.` });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Review failed' });
    }
  };

  const handleImportSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      fd.append('scope', importScope);
      fd.append('default_password', fallbackPass);
      const res = await apiRequest<{ detected_scope: string; inserted: number; updated: number; errors: string[] }>('/admin/data-exchange/import', {
        method: 'POST',
        portal: 'admin',
        body: fd,
      });
      setStatusMsg({
        type: res.errors.length ? 'err' : 'ok',
        text: `Auto-imported into ${res.detected_scope.toUpperCase()}: Inserted ${res.inserted}, Updated ${res.updated}, Errors ${res.errors.length}.`,
      });
      setImportFile(null);
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Sheet import failed' });
    }
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/notices', {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({
          title: noticeForm.title,
          content: noticeForm.content,
          priority: noticeForm.priority,
          category: noticeForm.category,
          target_portal: noticeForm.target_portal,
          target_academic_year: noticeForm.target_academic_year || null,
          target_student_profile_id: noticeForm.target_student_profile_id ? Number(noticeForm.target_student_profile_id) : null,
          expiry_date: noticeForm.expiry_date || null,
          attachment_name: noticeForm.attachment_name || null,
        }),
      });
      setNoticeForm({ title: '', content: '', priority: 'High', category: 'Placement', target_portal: 'all', target_academic_year: '', target_student_profile_id: '', expiry_date: '', attachment_name: '' });
      setStatusMsg({ type: 'ok', text: 'Institutional notice broadcasted.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Notice publish failed' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <aside className="w-64 bg-[#142B4A] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img src="/christ-logo.png" alt="Christ University" className="w-10 h-10 rounded-xl bg-white p-0.5 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 truncate">Christ University</div>
            <div className="text-sm font-bold mt-0.5">CDC Admin Portal</div>
            <div className="text-[11px] text-blue-200 mt-0.5 truncate">{currentUser.name}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-xs font-medium">
          {[
            { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
            { to: '/admin/students', label: 'Student Master DB', icon: GraduationCap },
            { to: '/admin/faculty', label: 'Faculty & Guides DB', icon: Users },
            { to: '/admin/drives', label: 'Companies & Drives', icon: Building2 },
            { to: '/admin/coding', label: 'Daily Coding Challenge', icon: Terminal },
            { to: '/admin/internships', label: 'Approvals & Notices', icon: ClipboardCheck },
            { to: '/admin/governance', label: 'MOU, Consultancy & Roles', icon: Briefcase },
            { to: '/admin/data-exchange', label: 'Excel / CSV Auto-Sync', icon: FileSpreadsheet },
            { to: '/admin/audit', label: 'Audit Logs & Backup', icon: ShieldCheck },
          ].map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1.5 text-xs">
          <a href="http://localhost/phpmyadmin/" target="_blank" rel="noreferrer" className="block text-center py-2 rounded-lg bg-white/10 hover:bg-white/20">
            Open phpMyAdmin
          </a>
          <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 font-semibold">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-4 py-2.5 text-xs">
          <div className="font-semibold text-slate-600">
            Session Scope: <strong className="text-[#142B4A]">{academicYear === 'ALL' ? 'All Historical Sessions' : academicYear}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Academic Year:</span>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-bold text-[#142B4A]"
            >
              {(dash?.academicYears || ['ALL', '2024-2025', '2025-2026', '2026-2027']).map(y => (
                <option key={y} value={y}>{y === 'ALL' ? 'All Academic Years' : y}</option>
              ))}
            </select>
          </div>
        </div>

        {statusMsg && (
          <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${statusMsg.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {statusMsg.text}
          </div>
        )}

        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Students Registered</div>
                    <div className="text-3xl font-bold text-[#142B4A] mt-1">{dash?.kpis.totalStudents ?? 0}</div>
                    <div className="text-xs text-emerald-600 mt-1">{dash?.kpis.placementRate ?? 0}% Placed ({dash?.kpis.placedStudents ?? 0})</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Highest / Avg CTC</div>
                    <div className="text-3xl font-bold text-[#2855A6] mt-1">{dash?.kpis.maxLpa ?? 0} LPA</div>
                    <div className="text-xs text-slate-500 mt-1">Average: {dash?.kpis.avgLpa ?? 0} LPA</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Faculty &amp; Companies</div>
                    <div className="text-3xl font-bold text-[#142B4A] mt-1">{dash?.kpis.totalCompanies ?? 0}</div>
                    <div className="text-xs text-slate-500 mt-1">{dash?.kpis.totalFaculty ?? 0} Active Faculty Guides</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Pending Approvals</div>
                    <div className="text-3xl font-bold text-amber-600 mt-1">{(dash?.kpis.pendingCorrections ?? 0) + (dash?.kpis.pendingInternships ?? 0)}</div>
                    <div className="text-xs text-slate-500 mt-1">{dash?.kpis.pendingCorrections ?? 0} Academic &middot; {dash?.kpis.pendingInternships ?? 0} Internships</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Upcoming Recruitment Drives</span>
                    <strong className="text-lg text-[#2855A6]">{dash?.kpis.upcomingDrives ?? 0}</strong>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Incomplete Profiles / Missing Resume</span>
                    <strong className="text-lg text-amber-600">{dash?.kpis.incompleteProfiles ?? 0}</strong>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Pending Document Verifications</span>
                    <strong className="text-lg text-rose-600">{dash?.kpis.pendingDocuments ?? 0}</strong>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h2 className="text-sm font-bold text-[#142B4A] mb-4">Department-wise Placement Analytics</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dash?.departmentBreakdown || []}>
                        <XAxis dataKey="branch" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" name="Total Students" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="placed" name="Placed Students" fill="#2855A6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <AdminReportsPanel year={academicYear} />
              </div>
            }
          />

          <Route
            path="students"
            element={
              <div className="space-y-6">
                <form onSubmit={handleCreateStudent} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-7 gap-3 items-end text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Reg Number *</label>
                    <input required value={newStu.reg_number} onChange={e => setNewStu({ ...newStu, reg_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" placeholder="21BCE1099" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Full Name *</label>
                    <input required value={newStu.name} onChange={e => setNewStu({ ...newStu, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Email *</label>
                    <input type="email" required value={newStu.email} onChange={e => setNewStu({ ...newStu, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Branch</label>
                    <input value={newStu.branch} onChange={e => setNewStu({ ...newStu, branch: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">CGPA</label>
                    <input type="number" step="0.01" value={newStu.current_cgpa} onChange={e => setNewStu({ ...newStu, current_cgpa: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Assign Guide</label>
                    <select value={newStu.assigned_guide_id} onChange={e => setNewStu({ ...newStu, assigned_guide_id: e.target.value })} className="w-full px-2 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="">-- Optional --</option>
                      {faculty.map(f => <option key={f.user_id} value={f.user_id}>{f.user?.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">
                    <Plus className="w-3.5 h-3.5" /> Add Student
                  </button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center text-xs">
                  <input
                    value={studentQuery}
                    onChange={e => setStudentQuery(e.target.value)}
                    placeholder="Search reg number, name, or email..."
                    className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-slate-300"
                  />
                  <select value={studentBranchFilter} onChange={e => setStudentBranchFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold">
                    <option value="ALL">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="AIML">AIML</option>
                    <option value="ECE">ECE</option>
                  </select>
                  <button type="button" onClick={() => loadAll(academicYear, studentQuery, studentBranchFilter)} className="px-4 py-2 rounded-lg bg-[#142B4A] text-white font-semibold">
                    Search
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Branch / Year</th>
                        <th className="px-4 py-3">CGPA</th>
                        <th className="px-4 py-3">Guide</th>
                        <th className="px-4 py-3">Status / Docs</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(s => (
                        <tr key={s.id}>
                          <td className="px-4 py-3 font-semibold">{s.user?.name} <span className="font-normal text-slate-500">({s.reg_number})</span><div className="text-[11px] font-normal text-slate-400">{s.user?.email}</div></td>
                          <td className="px-4 py-3">{s.branch} &middot; {s.academic_year || s.graduation_year}</td>
                          <td className="px-4 py-3 font-bold">{s.current_cgpa}</td>
                          <td className="px-4 py-3">{s.assigned_guide?.name || <span className="text-amber-600 font-semibold">Unassigned</span>}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2855A6] font-semibold uppercase">{s.placement_status}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{s.verification_status} &middot; {(s.documents || []).length} doc(s)</div>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5">
                            <button onClick={() => setEditingStudent(s)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EAF2FF] text-[#2855A6] font-semibold">
                              <Edit2 className="w-3 h-3" /> Edit / Guide
                            </button>
                            <button onClick={() => handleDeleteStudent(s.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-700 font-semibold">
                              <Trash2 className="w-3 h-3" /> Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            }
          />

          <Route
            path="faculty"
            element={
              <div className="space-y-6">
                <form onSubmit={handleCreateFaculty} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs">
                  <input required placeholder="Employee ID (FAC-301)" value={newFac.employee_id} onChange={e => setNewFac({ ...newFac, employee_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input required placeholder="Full Name" value={newFac.name} onChange={e => setNewFac({ ...newFac, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="email" required placeholder="Email" value={newFac.email} onChange={e => setNewFac({ ...newFac, email: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input required placeholder="Department" value={newFac.department} onChange={e => setNewFac({ ...newFac, department: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <select value={newFac.coordinator_role} onChange={e => setNewFac({ ...newFac, coordinator_role: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="faculty_guide">Faculty Guide</option>
                    <option value="dept_coordinator">Dept Coordinator</option>
                    <option value="tpo_head">TPO Head</option>
                  </select>
                  <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Add Faculty</button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Emp ID / Dept</th><th className="px-4 py-3">Assigned Mentees</th><th className="px-4 py-3">Permissions</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faculty.map(f => (
                        <tr key={f.id}>
                          <td className="px-4 py-3 font-semibold">{f.user?.name}<div className="text-[11px] font-normal text-slate-400">{f.user?.email}</div></td>
                          <td className="px-4 py-3">{f.employee_id} &middot; {f.user?.department}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setRosterFaculty(f)} className="px-2.5 py-1 rounded bg-[#EAF2FF] text-[#2855A6] font-bold">
                              {(f.user?.mentored_students || []).length} Students
                            </button>
                          </td>
                          <td className="px-4 py-3 space-x-3">
                            <label className="inline-flex items-center gap-1">
                              <input type="checkbox" checked={Boolean(f.can_manage_drives)} onChange={async e => {
                                await apiRequest(`/admin/faculty/${f.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ can_manage_drives: e.target.checked }) });
                                loadAll();
                              }} /> Drives
                            </label>
                            <label className="inline-flex items-center gap-1">
                              <input type="checkbox" checked={Boolean(f.can_verify_students)} onChange={async e => {
                                await apiRequest(`/admin/faculty/${f.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ can_verify_students: e.target.checked }) });
                                loadAll();
                              }} /> Verify Docs
                            </label>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={async () => {
                              await apiRequest(`/admin/faculty/${f.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ portal_active: !f.portal_active }) });
                              loadAll();
                            }} className={`px-2 py-0.5 rounded font-semibold ${f.portal_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {f.portal_active ? 'Active' : 'Disabled'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            }
          />

          <Route
            path="drives"
            element={
              <div className="space-y-6">
                <form onSubmit={handleCreateCompany} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
                  <div className="font-bold text-sm text-[#142B4A]">Publish Company &amp; Eligibility Criteria</div>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                    <input required placeholder="Company Name" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input required placeholder="Job Role Title" value={newComp.role_title} onChange={e => setNewComp({ ...newComp, role_title: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <select value={newComp.job_type} onChange={e => setNewComp({ ...newComp, job_type: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Internship + Full-time">Internship + Full-time</option>
                    </select>
                    <input type="number" step="0.01" required placeholder="CTC LPA" value={newComp.package_lpa} onChange={e => setNewComp({ ...newComp, package_lpa: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input placeholder="Stipend (optional)" value={newComp.stipend} onChange={e => setNewComp({ ...newComp, stipend: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input type="date" required value={newComp.application_deadline} onChange={e => setNewComp({ ...newComp, application_deadline: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-center">
                    <input type="number" step="0.01" required placeholder="Min CGPA" value={newComp.min_cgpa} onChange={e => setNewComp({ ...newComp, min_cgpa: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input type="number" placeholder="Min 10th %" value={newComp.min_tenth} onChange={e => setNewComp({ ...newComp, min_tenth: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input type="number" placeholder="Min 12th %" value={newComp.min_twelfth} onChange={e => setNewComp({ ...newComp, min_twelfth: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input type="number" placeholder="Max Backlogs" value={newComp.max_backlogs} onChange={e => setNewComp({ ...newComp, max_backlogs: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <input placeholder="Branches (CSE,IT,ECE)" value={newComp.branches} onChange={e => setNewComp({ ...newComp, branches: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Publish Drive</button>
                  </div>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-[#142B4A]">Active Companies &amp; Roles ({companies.length})</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    {companies.map(c => (
                      <div key={c.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-sm text-[#142B4A]">{c.name} <span className="text-[11px] font-semibold uppercase text-purple-700 ml-1">({c.tier})</span></div>
                            <div className="text-slate-500">{c.industry} &middot; Deadline: {c.application_deadline}</div>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => setEligibilityCompanyId(c.id)} className="px-2 py-1 rounded bg-[#EAF2FF] text-[#2855A6] font-semibold">Eligibility</button>
                            <button onClick={() => setAddingRoleForCompanyId(addingRoleForCompanyId === c.id ? null : c.id)} className="px-2 py-1 rounded bg-slate-100 font-semibold">+ Role</button>
                          </div>
                        </div>

                        {addingRoleForCompanyId === c.id && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2">
                            <input placeholder="Role Title" value={extraRole.role_title} onChange={e => setExtraRole({ ...extraRole, role_title: e.target.value })} className="px-2 py-1.5 rounded border border-slate-300 bg-white" />
                            <input type="number" step="0.1" placeholder="LPA" value={extraRole.package_lpa} onChange={e => setExtraRole({ ...extraRole, package_lpa: e.target.value })} className="px-2 py-1.5 rounded border border-slate-300 bg-white" />
                            <select value={extraRole.job_type} onChange={e => setExtraRole({ ...extraRole, job_type: e.target.value })} className="px-2 py-1.5 rounded border border-slate-300 bg-white">
                              <option value="Full-time">Full-time</option>
                              <option value="Internship">Internship</option>
                              <option value="Internship + Full-time">Internship + Full-time</option>
                            </select>
                            <button onClick={() => handleAddRoleToCompany(c.id)} className="px-2 py-1.5 rounded bg-[#2855A6] text-white font-semibold">Save Role</button>
                          </div>
                        )}

                        <div className="space-y-1">
                          {(c.roles || []).map((r: any) => (
                            <div key={r.id} className="bg-slate-50 px-2.5 py-1.5 rounded flex justify-between items-center gap-2">
                              <div>
                                <span className="font-semibold">{r.role_title}</span>{' '}
                                <span className="text-[10px] text-slate-500">({r.job_type})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[#2855A6] font-bold">{r.stipend || r.package_ctc}</span>
                                <button
                                  onClick={async () => {
                                    const nextStatus = r.status === 'open' ? 'closed' : 'open';
                                    await apiRequest(`/admin/job-roles/${r.id}`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ status: nextStatus }) });
                                    loadAll();
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                                >
                                  {r.status}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-[#142B4A]">Student Applications Stage Control</div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Company / Role</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Advance Stage</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map(a => (
                        <tr key={a.id}>
                          <td className="px-4 py-3 font-semibold">{a.student_profile?.user?.name} ({a.student_profile?.reg_number})</td>
                          <td className="px-4 py-3">{a.company?.name} — {a.job_role?.role_title}</td>
                          <td className="px-4 py-3 font-bold text-[#2855A6]">{a.status}</td>
                          <td className="px-4 py-3 flex gap-1.5">
                            {['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'NOT_SELECTED'].map(st => (
                              <button key={st} onClick={() => handleAdvanceApp(a.id, st)} className="px-2 py-1 rounded bg-slate-100 hover:bg-[#EAF2FF] hover:text-[#2855A6] font-semibold text-[11px]">{st}</button>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            }
          />

          <Route
            path="coding"
            element={
              <div className="space-y-6">
                <form onSubmit={handlePostQuestion} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs">
                  <input required placeholder="Problem Title (e.g. 200. Number of Islands)" value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="url" required placeholder="LeetCode Problem URL" value={newQ.leetcodeUrl} onChange={e => setNewQ({ ...newQ, leetcodeUrl: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300" />
                  <select value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Post Question</button>
                </form>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
                    <h3 className="font-bold text-sm text-[#142B4A]">Active Daily Coding Questions ({questions.length})</h3>
                    {questions.map(q => (
                      <div key={q.id} className="flex justify-between items-center border-b border-slate-100 py-2">
                        <div>
                          <div className="font-semibold text-[#142B4A]">{q.title}</div>
                          <div className="text-slate-400">{q.difficulty} &middot; Due {q.dueDate}</div>
                        </div>
                        <span className="font-bold text-[#2855A6]">{q.solvedByCount}/{q.totalStudents} solved</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
                    <h3 className="font-bold text-sm text-[#142B4A]">Batch Coding Leaderboard</h3>
                    {leaderboard.map(s => (
                      <div key={s.id} className="flex justify-between items-center border-b border-slate-100 py-2">
                        <div>
                          <div className="font-semibold">{s.name} ({s.regNumber})</div>
                          <div className="text-slate-400">{s.branch} &middot; @{s.leetcodeUsername || 'not-linked'}</div>
                        </div>
                        <span className="font-bold text-emerald-700">{s.postedSolved} solved</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />

          <Route
            path="internships"
            element={
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-[#142B4A]">Academic Correction Tickets (Student Requests)</h2>
                  {corrections.map(c => (
                    <div key={c.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#142B4A]">{c.student_profile?.user?.name} ({c.student_profile?.reg_number}) — {c.field}</div>
                        <div className="text-slate-600">Current: <strong>{c.current_value}</strong> &rarr; Requested: <strong className="text-[#2855A6]">{c.requested_value}</strong></div>
                        <div className="text-slate-500 mt-0.5">Reason: {c.reason} &middot; Status: <strong>{c.status}</strong></div>
                      </div>
                      {c.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewCorrection(c.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold">Approve &amp; Update CGPA</button>
                          <button onClick={() => handleReviewCorrection(c.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {corrections.length === 0 && <p className="text-xs text-slate-400">No academic correction tickets.</p>}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[#142B4A]">CDC Internship Coordination &amp; Approvals</h2>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {[
                        { id: 'PENDING_CDC_APPROVAL', label: 'Awaiting Coordinator' },
                        { id: 'PENDING_GUIDE_REVIEW', label: 'Awaiting Guide' },
                        { id: 'APPROVED', label: 'Approved' },
                        { id: 'COMPLETED', label: 'Completed' },
                        { id: 'REJECTED', label: 'Rejected' },
                        { id: 'ALL', label: 'All' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setInternshipTab(tab.id)}
                          className={`px-2.5 py-1 rounded-full font-semibold ${internshipTab === tab.id ? 'bg-[#142B4A] text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {internships
                    .filter(it => internshipTab === 'ALL' || it.status === internshipTab || (internshipTab === 'PENDING_CDC_APPROVAL' && it.status === 'GUIDE_APPROVED'))
                    .map(it => {
                      const guideStep = (it.steps || []).find((st: any) => Number(st.stepNumber) === 2);
                      return (
                        <div key={it.id} className="border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-[#142B4A]">{it.company_name} — {it.job_role} ({it.track})</div>
                              <div className="text-slate-600">
                                {it.student_profile?.user?.name} ({it.student_profile?.reg_number}) &middot; Guide: {it.faculty_guide?.name || 'Unassigned'} &middot; Status: <strong>{it.status}</strong>
                              </div>
                              {guideStep?.remarks && (
                                <div className="text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-200">
                                  <strong>Guide Remarks:</strong> {guideStep.remarks}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {['GUIDE_APPROVED', 'PENDING_CDC_APPROVAL'].includes(it.status) && (
                                <>
                                  <button onClick={() => handleFinalInternship(it.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold">Final Approve</button>
                                  <button onClick={() => handleFinalInternship(it.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold">Reject</button>
                                </>
                              )}
                              {['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(it.status) && (
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-800 font-semibold cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(it.ppo_converted)}
                                    onChange={async e => {
                                      await apiRequest(`/admin/internships/${it.id}/ppo`, { method: 'PATCH', portal: 'admin', body: JSON.stringify({ ppo_converted: e.target.checked }) });
                                      loadAll();
                                    }}
                                  />
                                  PPO Converted
                                </label>
                              )}
                            </div>
                          </div>
                          {(it.documents || []).length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-semibold text-slate-500">Documents:</span>
                              {it.documents.map((doc: any, idx: number) => (
                                doc.fileUrl ? (
                                  <DocumentDownload key={doc.id ?? idx} path={doc.fileUrl} name={`${doc.category}: ${doc.name}`} portal="admin" />
                                ) : (
                                  <span key={idx} className="text-[11px] text-slate-500">{doc.name}</span>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                  <form onSubmit={handlePublishNotice} className="space-y-3 text-xs">
                    <div className="font-bold text-sm text-[#142B4A]">Targeted Notice Broadcast</div>
                    <div className="grid sm:grid-cols-4 gap-3">
                      <input required placeholder="Notice Title" value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300" />
                      <select value={noticeForm.target_portal} onChange={e => setNoticeForm({ ...noticeForm, target_portal: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="all">All 3 Portals</option>
                        <option value="student">Student Portal</option>
                        <option value="guide">Guide Portal</option>
                      </select>
                      <select value={noticeForm.priority} onChange={e => setNoticeForm({ ...noticeForm, priority: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="Normal">Normal Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Urgent">Urgent Priority</option>
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-4 gap-3">
                      <select value={noticeForm.category} onChange={e => setNoticeForm({ ...noticeForm, category: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="Placement">Placement</option>
                        <option value="Internship">Internship</option>
                        <option value="Deadline">Deadline</option>
                        <option value="Interview">Interview Schedules</option>
                        <option value="General">General</option>
                      </select>
                      <select value={noticeForm.target_student_profile_id} onChange={e => setNoticeForm({ ...noticeForm, target_student_profile_id: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                        <option value="">All Students / Broadcast</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.reg_number})</option>)}
                      </select>
                      <input type="date" value={noticeForm.expiry_date} onChange={e => setNoticeForm({ ...noticeForm, expiry_date: e.target.value })} title="Expiry Date" className="px-3 py-2 rounded-lg border border-slate-300" />
                      <input placeholder="Attachment Name (optional)" value={noticeForm.attachment_name} onChange={e => setNoticeForm({ ...noticeForm, attachment_name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                    </div>
                    <textarea rows={2} required placeholder="Notice message..." value={noticeForm.content} onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                    <button type="submit" className="px-4 py-2 rounded-lg bg-[#2855A6] text-white font-semibold">Publish Notice</button>
                  </form>

                  <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-sm text-[#142B4A]">Notice History &amp; Read Status ({adminNotices.length})</div>
                    {adminNotices.map(n => (
                      <div key={n.id} className="p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#142B4A]">{n.title}</span>{' '}
                          <span className="text-slate-500">({n.target_portal}{n.expiry_date ? ` · Expires ${n.expiry_date}` : ''})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#EAF2FF] text-[#2855A6] font-bold">Read by {n.read_count ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />

          <Route
            path="governance"
            element={<AdminGovernanceTab onStatus={(type, text) => setStatusMsg({ type, text })} />}
          />

          <Route
            path="data-exchange"
            element={
              <div className="space-y-6">
                <form onSubmit={handleImportSheet} className="bg-white rounded-2xl border-2 border-dashed border-[#2855A6]/40 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#142B4A]">
                    <Upload className="w-4 h-4 text-[#2855A6]" /> Universal Excel / CSV Sheet Auto-Importer (.XLSX / .XLS / .CSV)
                  </div>
                  <p className="text-xs text-slate-500">Upload any Student, Faculty, or Company sheet. Laravel auto-detects the target MySQL table, hashes optional <code>initial_password</code> rows, and enforces password reset on first login.</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end text-xs">
                    <select value={importScope} onChange={e => setImportScope(e.target.value as any)} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="auto">Auto-Detect from Columns</option>
                      <option value="students">Student DB</option>
                      <option value="faculty">Faculty / Guide DB</option>
                      <option value="companies">Companies Registry</option>
                    </select>
                    <input type="file" accept=".csv,.xlsx,.xls" required onChange={e => setImportFile(e.target.files?.[0] || null)} className="md:col-span-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50" />
                    <div className="flex gap-2">
                      <input type="text" value={fallbackPass} onChange={e => setFallbackPass(e.target.value)} className="w-28 px-3 py-2 rounded-lg border border-slate-300" placeholder="Fallback Pass" />
                      <button type="submit" className="px-4 py-2 rounded-lg bg-[#2855A6] text-white font-semibold">Upload &amp; Import</button>
                    </div>
                  </div>
                </form>

                <div className="grid md:grid-cols-3 gap-4 text-xs">
                  {[
                    { scope: 'students', title: 'Student Portal DB' },
                    { scope: 'faculty', title: 'Faculty / Guide DB' },
                    { scope: 'companies', title: 'Companies Registry' },
                  ].map(card => (
                    <div key={card.scope} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                      <div className="font-bold text-sm text-[#142B4A]">{card.title}</div>
                      <div className="flex gap-2">
                        <button onClick={() => downloadApiFile(`/admin/data-exchange/export?scope=${card.scope}&format=csv`, `${card.scope}.csv`, 'admin')} className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold">
                          <Download className="w-3.5 h-3.5" /> .CSV
                        </button>
                        <button onClick={() => downloadApiFile(`/admin/data-exchange/export?scope=${card.scope}&format=excel`, `${card.scope}.xls`, 'admin')} className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-[#142B4A] text-white font-semibold">
                          <Download className="w-3.5 h-3.5" /> Excel .XLS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          />

          <Route
            path="audit"
            element={
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#142B4A]">Full MySQL Backup (.SQL)</div>
                    <p className="text-xs text-slate-500">Download the entire <code>cdc_industrial</code> database for safe archival or phpMyAdmin restore.</p>
                  </div>
                  <button onClick={() => downloadApiFile('/admin/backup-sql', 'cdc_industrial_backup.sql', 'admin')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                    <DatabaseBackup className="w-4 h-4" /> Download .SQL Backup
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 font-bold text-sm text-[#142B4A]">Immutable Governance Audit Trail</div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr><th className="px-4 py-2.5">Actor</th><th className="px-4 py-2.5">Action</th><th className="px-4 py-2.5">Entity</th><th className="px-4 py-2.5">Details</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audits.audits.map(a => (
                        <tr key={a.id}>
                          <td className="px-4 py-2.5 font-semibold">{a.actor_name} <span className="text-slate-400">({a.actor_role})</span></td>
                          <td className="px-4 py-2.5 text-[#2855A6] font-semibold">{a.action}</td>
                          <td className="px-4 py-2.5">{a.entity_type} #{a.entity_id}</td>
                          <td className="px-4 py-2.5 text-slate-600">{a.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            }
          />

        </Routes>
      </main>

      <AdminStudentEditModal
        student={editingStudent}
        faculty={faculty}
        onClose={() => setEditingStudent(null)}
        onSaved={() => {
          setStatusMsg({ type: 'ok', text: 'Student record & guide assignment updated in MySQL.' });
          loadAll();
        }}
        onError={msg => setStatusMsg({ type: 'err', text: msg })}
      />
      <AdminEligibilityModal companyId={eligibilityCompanyId} onClose={() => setEligibilityCompanyId(null)} />
      <AdminFacultyRosterModal faculty={rosterFaculty} onClose={() => setRosterFaculty(null)} />
    </div>
  );
};
