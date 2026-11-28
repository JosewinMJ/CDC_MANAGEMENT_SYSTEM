import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, UserCheck, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalScope } from '../../services/apiClient';

interface PortalLoginPageProps {
  portal: PortalScope;
}

const PORTAL_META: Record<
  PortalScope,
  {
    title: string;
    subtitle: string;
    badge: string;
    redirectTo: string;
    accent: string;
    placeholderEmail: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  student: {
    title: 'Student Portal',
    subtitle: 'Daily Coding Challenge, Placement Drives, Internships & Profile',
    badge: 'Student Access',
    redirectTo: '/student/dashboard',
    accent: 'from-[#142B4A] to-[#2855A6]',
    placeholderEmail: 'student@vitstudent.ac.in',
    icon: GraduationCap,
  },
  guide: {
    title: 'Faculty Guide Portal',
    subtitle: 'Mentee Progress, Internship Reviews & Document Verification',
    badge: 'Faculty / Guide Access',
    redirectTo: '/guide/dashboard',
    accent: 'from-[#142B4A] to-emerald-700',
    placeholderEmail: 'faculty@vit.ac.in',
    icon: UserCheck,
  },
  admin: {
    title: 'CDC Admin Portal',
    subtitle: 'Restricted Institutional Administration & Master Database Control',
    badge: 'Admin-Only Access',
    redirectTo: '/admin/dashboard',
    accent: 'from-slate-900 to-[#142B4A]',
    placeholderEmail: 'cdc.admin@vit.ac.in',
    icon: ShieldCheck,
  },
};

export const PortalLoginPage: React.FC<PortalLoginPageProps> = ({ portal }) => {
  const { isPortalAuthenticated, loginToPortal } = useAuth();
  const navigate = useNavigate();
  const meta = PORTAL_META[portal];
  const Icon = meta.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPortalAuthenticated(portal)) {
    return <Navigate to={meta.redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginToPortal(portal, email.trim(), password);
      navigate(meta.redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className={`bg-gradient-to-r ${meta.accent} px-6 py-6 text-white`}>
          <div className="flex items-center gap-3.5">
            <img
              src="/christ-logo.png"
              alt="Christ University Logo"
              className="w-14 h-14 rounded-xl bg-white p-1 object-contain shadow-sm shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15">
                <Icon className="w-3 h-3" />
                {meta.badge}
              </span>
              <h1 className="text-lg font-bold mt-1">{meta.title}</h1>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-3">{meta.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={meta.placeholderEmail}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Password
            </label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#142B4A] hover:bg-[#2855A6] disabled:opacity-60 text-white font-semibold text-sm transition"
          >
            {loading ? 'Signing in...' : `Sign In to ${meta.title}`}
          </button>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-center">
            <div className="flex items-center justify-center gap-3 text-xs font-semibold">
              {portal !== 'student' && <a href="/student/login" className="text-[#2855A6] hover:underline">Student Login</a>}
              {portal !== 'guide' && <a href="/guide/login" className="text-[#2855A6] hover:underline">Guide Login</a>}
              {portal !== 'admin' && <a href="/admin/login" className="text-[#2855A6] hover:underline">Admin Login</a>}
            </div>
            <div className="text-[11px] text-slate-400">
              Career Development Centre &middot; Role-Protected Sanctum Authentication
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

