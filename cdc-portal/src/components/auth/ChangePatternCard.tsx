import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { apiRequest, PortalScope } from '../../services/apiClient';
import { PatternLockInput } from './PatternLockInput';

interface ChangePatternCardProps {
  portal: PortalScope;
}

export const ChangePatternCard: React.FC<ChangePatternCardProps> = ({ portal }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPattern.split('-').filter(Boolean).length < 4) {
      setMessage({ type: 'err', text: 'Draw at least 4 unique dots for your new pattern.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiRequest<{ message: string }>('/auth/change-pattern', {
        method: 'POST',
        portal,
        body: JSON.stringify({
          current_password: currentPassword,
          new_pattern: newPattern,
        }),
      });
      setMessage({ type: 'ok', text: res.message });
      setCurrentPassword('');
      setNewPattern('');
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Unable to update pattern.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#2855A6]" />
        <div>
          <h2 className="text-sm font-bold text-[#142B4A]">Update 3x3 Login Pattern Lock</h2>
          <p className="text-xs text-slate-500">
            Verify your password and draw a new pattern for unified portal login.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]"
          />
        </div>
      </div>

      <PatternLockInput
        value={newPattern}
        onChange={setNewPattern}
        disabled={saving}
        label="New 3x3 Pattern"
      />

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 rounded-xl bg-[#142B4A] hover:bg-[#2855A6] disabled:opacity-60 text-white text-xs font-semibold transition"
      >
        {saving ? 'Updating Pattern...' : 'Save New Login Pattern'}
      </button>
    </form>
  );
};
