import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalScope } from '../../services/apiClient';
import { PatternLockInput } from '../../components/auth/PatternLockInput';

const detectEmailHint = (email: string): string => {
  const lower = email.trim().toLowerCase();
  if (!lower) return 'Auto-routed by email + 3x3 pattern';
  if (lower.includes('@vitstudent.')) return 'Matched email pattern: Student Portal';
  if (lower.startsWith('cdc.admin@')) return 'Matched email pattern: CDC Admin Portal';
  if (lower.includes('@')) return 'Matched email pattern: Faculty Guide / Staff Portal';
  return 'Auto-routed by email + 3x3 pattern';
};

export const PortalLoginPage: React.FC = () => {
  const { isPortalAuthenticated, loginUnified } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pattern, setPattern] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePortals: { scope: PortalScope; label: string; to: string }[] = [
    ...(isPortalAuthenticated('student') ? [{ scope: 'student' as const, label: 'Resume Student', to: '/student/dashboard' }] : []),
    ...(isPortalAuthenticated('guide') ? [{ scope: 'guide' as const, label: 'Resume Guide', to: '/guide/dashboard' }] : []),
    ...(isPortalAuthenticated('admin') ? [{ scope: 'admin' as const, label: 'Resume Admin', to: '/admin/dashboard' }] : []),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pattern.split('-').filter(Boolean).length < 4) {
      setError('Please draw or tap at least 4 dots on the 3x3 pattern lock.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUnified(email.trim(), password, pattern);
      navigate(result.redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#142B4A] via-[#1E3F73] to-[#2855A6] px-6 py-5 text-white">
          <div className="flex items-center gap-3.5">
            <img
              src="/christ-logo.png"
              alt="Christ University Logo"
              className="w-13 h-13 rounded-xl bg-white p-1 object-contain shadow-sm shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
                <ShieldCheck className="w-3 h-3" />
                Unified Portal Access
              </span>
              <h1 className="text-lg font-bold mt-1">Career Development Centre</h1>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-2.5">
            Sign in once with your institutional email, password, and 3x3 security pattern to enter your Student, Guide, or Admin portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activePortals.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-xl bg-blue-50/70 border border-blue-200 px-3 py-2">
              {activePortals.map(item => (
                <Link
                  key={item.scope}
                  to={item.to}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#142B4A] bg-white border border-blue-200 hover:border-[#2855A6] rounded-lg px-2.5 py-1 transition"
                >
                  {item.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-600">Institutional Email</label>
              <span className="text-[10px] font-medium text-[#2855A6]">{detectEmailHint(email)}</span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@vitstudent.ac.in or faculty@vit.ac.in"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]"
              />
            </div>
          </div>

          <PatternLockInput
            value={pattern}
            onChange={setPattern}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#142B4A] hover:bg-[#2855A6] disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {loading ? 'Verifying Credentials & Pattern...' : 'Unlock & Sign In'}
          </button>

          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="font-semibold text-slate-600 text-center">Default Portal Patterns (dots 0–8)</div>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-1.5 py-1">
                <div className="font-bold text-[#142B4A]">Student</div>
                <div className="font-mono text-[10px]">0-1-2-5-8</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-1.5 py-1">
                <div className="font-bold text-emerald-700">Guide</div>
                <div className="font-mono text-[10px]">0-3-6-7-8</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-1.5 py-1">
                <div className="font-bold text-indigo-700">Admin</div>
                <div className="font-mono text-[10px]">0-4-8-5-2</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
