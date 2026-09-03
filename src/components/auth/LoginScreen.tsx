import React, { useState, useRef, useEffect } from 'react';
import { Lock, Mail, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { api, ApiError, PrincipalUser, PrincipalRole } from '../../api';

interface LoginScreenProps {
  onLogin: (user: PrincipalUser, role: PrincipalRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { user, role } = await api.login(email.trim(), password);
      onLogin(user, role);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'too_many_attempts' && err.retryAfterSec) {
          setRetryAfterSec(err.retryAfterSec);
        } else if (err.code === 'account_disabled') {
          setError('This account has been disabled. Contact your administrator.');
        } else if (err.status === 401) {
          setError('Incorrect email or password.');
        } else {
          setError(err.message || 'Unable to sign in. Please try again.');
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
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              PT
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none">Presales Tracker</h1>
              <p className="text-[11px] text-gray-500 mt-0.5">Enterprise opportunity intelligence</p>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 mb-5">
            Sign in with your corporate credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={emailRef}
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs border border-gray-300 rounded pl-8 pr-2.5 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {retryAfterSec !== null && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                Too many failed attempts. Try again in {retryAfterSec}s.
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
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-gray-400 mt-5 text-center">
            Protected environment · HTTPS · JWT sessions expire after 12 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;