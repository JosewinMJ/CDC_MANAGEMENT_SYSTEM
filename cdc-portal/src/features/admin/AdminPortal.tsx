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
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, downloadApiFile } from '../../services/apiClient';

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
    totalApplications: number;
    pendingCorrections: number;
    pendingInternships: number;
  };
  departmentBreakdown: Array<{ branch: string; total: number; placed: number }>;
  recentAudits: Array<{ id: number; actor_name: string; actor_role: string; action: string; entity_type: string; details: string; created_at: string }>;
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
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newStu, setNewStu] = useState({ reg_number: '', name: '', email: '', branch: 'CSE', current_cgpa: '8.20', active_backlogs: '0' });
  const [newFac, setNewFac] = useState({ employee_id: '', name: '', email: '', department: 'CSE', designation: 'Assistant Professor', coordinator_role: 'faculty_guide' });
  const [newComp, setNewComp] = useState({ name: '', industry: 'Cloud & AI', tier: 'dream', role_title: 'Software Engineer', package_lpa: '12.00', min_cgpa: '7.5', application_deadline: '2026-12-20' });
  const [newQ, setNewQ] = useState({ title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '2026-12-05' });
  const [importScope, setImportScope] = useState<'auto' | 'students' | 'faculty' | 'companies'>('auto');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fallbackPass, setFallbackPass] = useState('Portal@1234');
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', priority: 'High', target_portal: 'all' });

  const loadAll = async () => {
    try {
      const [d, s, f, c, a, corr, intern, qs, lb, aud] = await Promise.all([
        apiRequest<AdminDashboardResp>('/admin/dashboard', { portal: 'admin' }),
        apiRequest<any[]>('/admin/students', { portal: 'admin' }),
        apiRequest<any[]>('/admin/faculty', { portal: 'admin' }),
        apiRequest<any[]>('/companies', { portal: 'admin' }),
        apiRequest<any[]>('/admin/applications', { portal: 'admin' }),
        apiRequest<any[]>('/admin/corrections', { portal: 'admin' }),
        apiRequest<any[]>('/guide/internships', { portal: 'admin' }),
        apiRequest<any[]>('/coding-challenge/questions', { portal: 'admin' }),
        apiRequest<any[]>('/coding-challenge/leaderboard', { portal: 'admin' }),
        apiRequest<{ audits: any[]; syncs: any[] }>('/admin/audit-logs', { portal: 'admin' }),
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
    } catch (e) {
      setStatusMsg({ type: 'err', text: e instanceof Error ? e.message : 'Unable to load Admin data.' });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

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
        }),
      });
      setNewStu({ reg_number: '', name: '', email: '', branch: 'CSE', current_cgpa: '8.20', active_backlogs: '0' });
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
      await apiRequest('/admin/companies', {
        method: 'POST',
        portal: 'admin',
        body: JSON.stringify({
          ...newComp,
          package_lpa: parseFloat(newComp.package_lpa),
          min_cgpa: parseFloat(newComp.min_cgpa),
          allowed_branches: ['CSE', 'IT', 'AIML', 'ECE'],
        }),
      });
      setNewComp({ name: '', industry: 'Cloud & AI', tier: 'dream', role_title: 'Software Engineer', package_lpa: '12.00', min_cgpa: '7.5', application_deadline: '2026-12-20' });
      setStatusMsg({ type: 'ok', text: 'Company & Job Role published across all 3 portals.' });
      await loadAll();
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create drive' });
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
      await apiRequest('/admin/notices', { method: 'POST', portal: 'admin', body: JSON.stringify(noticeForm) });
      setNoticeForm({ title: '', content: '', priority: 'High', target_portal: 'all' });
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
            { to: '/admin/internships', label: 'Approvals & Corrections', icon: ClipboardCheck },
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
              </div>
            }
          />

          <Route
            path="students"
            element={
              <div className="space-y-6">
                <form onSubmit={handleCreateStudent} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs">
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
                  <button type="submit" className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">
                    <Plus className="w-3.5 h-3.5" /> Add Student
                  </button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Branch / Year</th>
                        <th className="px-4 py-3">CGPA</th>
                        <th className="px-4 py-3">Guide</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(s => (
                        <tr key={s.id}>
                          <td className="px-4 py-3 font-semibold">{s.user?.name} <span className="font-normal text-slate-500">({s.reg_number})</span><div className="text-[11px] font-normal text-slate-400">{s.user?.email}</div></td>
                          <td className="px-4 py-3">{s.branch} &middot; {s.graduation_year}</td>
                          <td className="px-4 py-3 font-bold">{s.current_cgpa}</td>
                          <td className="px-4 py-3">{s.assigned_guide?.name || 'Unassigned'}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2855A6] font-semibold uppercase">{s.placement_status}</span></td>
                          <td className="px-4 py-3 text-right">
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
                      <tr><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Emp ID</th><th className="px-4 py-3">Dept</th><th className="px-4 py-3">Role</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faculty.map(f => (
                        <tr key={f.id}>
                          <td className="px-4 py-3 font-semibold">{f.user?.name}<div className="text-[11px] font-normal text-slate-400">{f.user?.email}</div></td>
                          <td className="px-4 py-3">{f.employee_id}</td>
                          <td className="px-4 py-3">{f.user?.department}</td>
                          <td className="px-4 py-3 uppercase font-semibold text-purple-700">{f.coordinator_role}</td>
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
                <form onSubmit={handleCreateCompany} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs">
                  <input required placeholder="Company Name" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input required placeholder="Job Role Title" value={newComp.role_title} onChange={e => setNewComp({ ...newComp, role_title: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="number" step="0.01" required placeholder="CTC LPA" value={newComp.package_lpa} onChange={e => setNewComp({ ...newComp, package_lpa: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="number" step="0.01" required placeholder="Min CGPA" value={newComp.min_cgpa} onChange={e => setNewComp({ ...newComp, min_cgpa: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="date" required value={newComp.application_deadline} onChange={e => setNewComp({ ...newComp, application_deadline: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Publish Drive</button>
                </form>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-[#142B4A]">Active Companies &amp; Roles ({companies.length})</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    {companies.map(c => (
                      <div key={c.id} className="border border-slate-200 rounded-xl p-4">
                        <div className="font-bold text-sm text-[#142B4A]">{c.name} <span className="text-[11px] font-semibold uppercase text-purple-700 ml-1">({c.tier})</span></div>
                        <div className="text-slate-500">{c.industry} &middot; Deadline: {c.application_deadline}</div>
                        <div className="mt-2 space-y-1">
                          {(c.roles || []).map((r: any) => (
                            <div key={r.id} className="bg-slate-50 px-2.5 py-1.5 rounded flex justify-between">
                              <span className="font-semibold">{r.role_title}</span>
                              <span className="text-[#2855A6] font-bold">{r.package_ctc}</span>
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

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                  <h2 className="text-sm font-bold text-[#142B4A]">CDC Coordinator Final Internship Approvals</h2>
                  {internships.filter(it => ['GUIDE_APPROVED', 'PENDING_CDC_APPROVAL'].includes(it.status)).map(it => (
                    <div key={it.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-[#142B4A]">{it.company_name} — {it.job_role} ({it.track})</div>
                        <div className="text-slate-600">{it.student_profile?.user?.name} &middot; Guide: {it.faculty_guide?.name} &middot; Status: <strong>{it.status}</strong></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleFinalInternship(it.id, 'APPROVED')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold">Final Approve</button>
                        <button onClick={() => handleFinalInternship(it.id, 'REJECTED')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
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

                <form onSubmit={handlePublishNotice} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 text-xs">
                  <div className="font-bold text-sm text-[#142B4A]">Broadcast Institutional Notice</div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input required placeholder="Notice Title" value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300" />
                    <select value={noticeForm.target_portal} onChange={e => setNoticeForm({ ...noticeForm, target_portal: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                      <option value="all">All 3 Portals</option>
                      <option value="student">Student Portal</option>
                      <option value="guide">Guide Portal</option>
                    </select>
                  </div>
                  <textarea rows={2} required placeholder="Notice message..." value={noticeForm.content} onChange={e => setNoticeForm({ ...noticeForm, content: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#2855A6] text-white font-semibold">Publish Notice</button>
                </form>
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
    </div>
  );
};
