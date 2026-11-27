import React, { useEffect, useState } from 'react';
import { NavLink, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  Bell,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Terminal,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/apiClient';

interface GuideDashboardData {
  menteeCount: number;
  pendingInternshipReviews: number;
  pendingDocumentReviews: number;
  mentees: Array<{
    id: number;
    reg_number: string;
    branch: string;
    current_cgpa: number;
    placement_status: string;
    verification_status: string;
    user: { id: number; name: string; email: string; phone?: string };
  }>;
  internships: Array<{
    id: number;
    track: string;
    company_name: string;
    job_role: string;
    mode: string;
    start_date: string;
    end_date: string;
    status: string;
    student_profile?: { reg_number: string; user?: { name: string; email: string } };
  }>;
  documents: Array<{
    id: number;
    name: string;
    category: string;
    verification_status: string;
    student_profile?: { reg_number: string; user?: { name: string } };
  }>;
}

export const GuidePortal: React.FC = () => {
  const { currentUser, logoutFromPortal } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<GuideDashboardData | null>(null);
  const [internships, setInternships] = useState<GuideDashboardData['internships']>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticeSuccess, setNoticeSuccess] = useState<string | null>(null);
  const [newQ, setNewQ] = useState({ title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '2026-12-05' });

  const loadGuideData = async () => {
    try {
      setError(null);
      const [dash, list, qs, lb] = await Promise.all([
        apiRequest<GuideDashboardData>('/guide/dashboard', { portal: 'guide' }),
        apiRequest<GuideDashboardData['internships']>('/guide/internships', { portal: 'guide' }),
        apiRequest<any[]>('/coding-challenge/questions', { portal: 'guide' }),
        apiRequest<any[]>('/coding-challenge/leaderboard', { portal: 'guide' }),
      ]);
      setData(dash);
      setInternships(list);
      setQuestions(qs);
      setLeaderboard(lb);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Guide Portal.');
    }
  };

  useEffect(() => {
    loadGuideData();
  }, []);

  const handleReview = async (id: number, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/internships/${id}/review`, {
        method: 'POST',
        portal: 'guide',
        body: JSON.stringify({
          role: 'GUIDE',
          decision,
          remarks: remarks[id] || (decision === 'APPROVED' ? 'Verified and approved by Faculty Guide.' : 'Needs revision.'),
        }),
      });
      await loadGuideData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review action failed');
    }
  };

  const handleVerifyDoc = async (docId: number, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await apiRequest(`/documents/${docId}/verification`, {
        method: 'PATCH',
        portal: 'guide',
        body: JSON.stringify({ status, remarks: status === 'VERIFIED' ? 'Verified by Guide' : 'Re-upload clear copy' }),
      });
      await loadGuideData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document verification failed');
    }
  };

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/guide/notices', {
        method: 'POST',
        portal: 'guide',
        body: JSON.stringify({ title: noticeTitle, content: noticeBody, priority: 'High' }),
      });
      setNoticeTitle('');
      setNoticeBody('');
      setNoticeSuccess('Guide notice published to Student Portal feed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish notice');
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/coding-challenge/questions', {
        method: 'POST',
        portal: 'guide',
        body: JSON.stringify({ ...newQ, topics: ['DSA'] }),
      });
      setNewQ({ title: '', leetcodeUrl: '', difficulty: 'Easy', dueDate: '2026-12-05' });
      await loadGuideData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post coding question');
    }
  };

  const handleLogout = async () => {
    await logoutFromPortal('guide');
    navigate('/guide/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      <aside className="w-64 bg-[#142B4A] text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img src="/christ-logo.png" alt="Christ University" className="w-10 h-10 rounded-xl bg-white p-0.5 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 truncate">Faculty Mentoring</div>
            <div className="text-sm font-bold mt-0.5">CDC Guide Portal</div>
            <div className="text-[11px] text-blue-200 mt-0.5 truncate">{currentUser.name}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-xs font-medium">
          <NavLink to="/guide/dashboard" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard &amp; Mentees
          </NavLink>
          <NavLink to="/guide/internships" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <ClipboardCheck className="w-4 h-4" /> Internship Reviews
          </NavLink>
          <NavLink to="/guide/coding" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <Terminal className="w-4 h-4" /> Daily Coding Challenge
          </NavLink>
          <NavLink to="/guide/notices" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${isActive ? 'bg-[#2855A6] text-white' : 'text-blue-100 hover:bg-white/10'}`}>
            <Bell className="w-4 h-4" /> Publish Guide Notice
          </NavLink>
        </nav>
        <div className="p-3 border-t border-white/10 text-xs">
          <button onClick={handleLogout} className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 font-semibold">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        {error && <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-xs font-medium">{error}</div>}

        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Assigned Mentees</div>
                    <div className="text-2xl font-bold text-[#142B4A] mt-1">{data?.menteeCount ?? 0}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Pending Internship Reviews</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{data?.pendingInternshipReviews ?? 0}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase">Pending Document Checks</div>
                    <div className="text-2xl font-bold text-[#2855A6] mt-1">{data?.pendingDocumentReviews ?? 0}</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2 font-bold text-sm text-[#142B4A]">
                    <Users className="w-4 h-4 text-[#2855A6]" /> Assigned Students Roster (Read-Only Academic View)
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Branch</th>
                        <th className="px-4 py-3">CGPA</th>
                        <th className="px-4 py-3">Verification</th>
                        <th className="px-4 py-3">Placement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(data?.mentees || []).map(m => (
                        <tr key={m.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{m.user.name} <span className="text-slate-400 font-normal">({m.reg_number})</span></td>
                          <td className="px-4 py-3">{m.branch}</td>
                          <td className="px-4 py-3 font-bold">{m.current_cgpa}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{m.verification_status}</span></td>
                          <td className="px-4 py-3 uppercase font-medium text-slate-700">{m.placement_status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(data?.documents?.length ?? 0) > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-[#142B4A]">Pending Student Document Verifications</h3>
                    {data?.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 text-xs">
                        <div>
                          <div className="font-semibold">{doc.name} ({doc.category})</div>
                          <div className="text-slate-500">{doc.student_profile?.user?.name} &middot; {doc.student_profile?.reg_number}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleVerifyDoc(doc.id, 'VERIFIED')} className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold">Verify</button>
                          <button onClick={() => handleVerifyDoc(doc.id, 'REJECTED')} className="px-3 py-1 rounded bg-rose-50 text-rose-700 font-semibold">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          />
          <Route
            path="internships"
            element={
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                <h2 className="text-base font-bold text-[#142B4A]">3-Track Internship Faculty Guide Reviews</h2>
                <div className="space-y-3">
                  {internships.map(it => (
                    <div key={it.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-sm text-[#142B4A]">{it.company_name} — {it.job_role}</div>
                        <div className="text-slate-600">
                          Student: <strong>{it.student_profile?.user?.name}</strong> ({it.student_profile?.reg_number}) &middot; {it.track} &middot; {it.mode}
                        </div>
                        <div className="text-slate-500">Duration: {it.start_date} to {it.end_date} &middot; Status: <strong>{it.status}</strong></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="Guide remarks..."
                          value={remarks[it.id] || ''}
                          onChange={e => setRemarks(prev => ({ ...prev, [it.id]: e.target.value }))}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                        <button onClick={() => handleReview(it.id, 'APPROVED')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button onClick={() => handleReview(it.id, 'REJECTED')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                  {internships.length === 0 && <p className="text-xs text-slate-400">No internship submissions assigned yet.</p>}
                </div>
              </div>
            }
          />
          <Route
            path="coding"
            element={
              <div className="space-y-6">
                <form onSubmit={handlePostQuestion} className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
                  <input required placeholder="Problem Title (e.g. 200. Number of Islands)" value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300" />
                  <input type="url" required placeholder="LeetCode Problem URL" value={newQ.leetcodeUrl} onChange={e => setNewQ({ ...newQ, leetcodeUrl: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300" />
                  <select value={newQ.difficulty} onChange={e => setNewQ({ ...newQ, difficulty: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-300 bg-white">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <button type="submit" className="py-2 px-3 rounded-lg bg-[#2855A6] text-white font-semibold">+ Post Daily Question</button>
                </form>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
                    <h3 className="font-bold text-sm text-[#142B4A]">Posted Batch Questions ({questions.length})</h3>
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
                    <h3 className="font-bold text-sm text-[#142B4A]">Student Coding Leaderboard</h3>
                    {leaderboard.map(s => (
                      <div key={s.id} className="flex justify-between items-center border-b border-slate-100 py-2">
                        <div>
                          <div className="font-semibold">{s.name} ({s.regNumber})</div>
                          <div className="text-slate-400">{s.branch} &middot; @{s.leetcodeUsername || 'not-linked'}</div>
                        </div>
                        <span className="font-bold text-emerald-700">{s.postedSolved} posted solved</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="notices"
            element={
              <form onSubmit={handleNoticeSubmit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl space-y-4">
                <h2 className="text-base font-bold text-[#142B4A]">Publish Mentoring Notice to Mentees</h2>
                {noticeSuccess && <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-xs font-semibold">{noticeSuccess}</div>}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Title</label>
                  <input type="text" required value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Instructions</label>
                  <textarea rows={4} required value={noticeBody} onChange={e => setNoticeBody(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
                </div>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#2855A6] text-white text-xs font-semibold">Publish Notice</button>
              </form>
            }
          />
        </Routes>
      </main>
    </div>
  );
};
