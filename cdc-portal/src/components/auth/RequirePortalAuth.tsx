import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, PortalScope } from '../../services/apiClient';

interface RequirePortalAuthProps {
  portal: PortalScope;
  children: React.ReactNode;
}

export const RequirePortalAuth: React.FC<RequirePortalAuthProps> = ({ portal, children }) => {
  const { isPortalAuthenticated, getPortalUser, clearMustChangePassword } = useAuth();
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isPortalAuthenticated(portal)) {
    return <Navigate to="/login" replace />;
  }

  const user = getPortalUser(portal);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (newPass.length < 8 || newPass !== confPass) {
      setErr('New password must be at least 8 characters and match confirmation.');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        portal,
        body: JSON.stringify({
          current_password: currPass,
          new_password: newPass,
          new_password_confirmation: confPass,
        }),
      });
      clearMustChangePassword(portal);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {user?.mustChangePassword && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handlePasswordUpdate} className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#142B4A] font-bold text-base">
              <Lock className="w-5 h-5 text-[#2855A6]" />
              Update Your Temporary Password
            </div>
            <p className="text-xs text-slate-600">
              For security, please replace your temporary/imported password before continuing.
            </p>
            {err && <div className="rounded-lg bg-rose-50 text-rose-700 px-3 py-2 text-xs font-semibold">{err}</div>}
            <input type="password" required placeholder="Current temporary password" value={currPass} onChange={e => setCurrPass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <input type="password" required minLength={8} placeholder="New password (min 8 chars)" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <input type="password" required minLength={8} placeholder="Confirm new password" value={confPass} onChange={e => setConfPass(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-[#2855A6] text-white text-xs font-semibold">
              {saving ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}
      {children}
    </>
  );
};

