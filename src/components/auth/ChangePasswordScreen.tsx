import React, { useState } from 'react';
import { KeyRound, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../api';

interface ChangePasswordScreenProps {
  userName: string;
  onChanged: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ userName, onChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('The two password fields do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      onChanged();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'invalid_current_password') {
          setError('Current password is incorrect.');
        } else if (err.code === 'weak_password' && err.message) {
          setError(`Password must include ${err.message}.`);
        } else if (err.code === 'password_same_as_current') {
          setError('New password must be different from the current one.');
        } else {
          setError(err.message || 'Unable to update the password. Please try again.');
        }
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              PT
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">Set a new password</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">{userName}</p>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.25" />
            <span>
              For your security, you must set a personal password before using the platform. Your temporary password
              is still active until you complete this step.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current (temporary) password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs border border-gray-300 rounded pl-8 pr-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">New password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 10 characters, letters + numbers"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs border border-gray-300 rounded pl-8 pr-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">At least 10 characters with at least one letter and one number.</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Confirm new password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs border border-gray-300 rounded pl-8 pr-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Update Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;