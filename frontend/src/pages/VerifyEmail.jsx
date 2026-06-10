import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { MailCheck, ShieldAlert, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setError('Verification token is missing.');
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setSuccess(data.message);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification token is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    triggerVerification();
  }, [token]);

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border shadow-2xl text-center" style={{ borderColor: 'var(--border-medium)' }}>
        {loading ? (
          <div className="py-12 space-y-4 flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            <h3 className="text-xl font-bold theme-text-heading">Verifying Email Address...</h3>
            <p className="text-xs theme-text-muted">Please wait while we validate your credentials.</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold theme-text-heading">Verification Failed</h3>
            <p className="text-xs theme-text-muted max-w-sm mx-auto leading-relaxed">{error}</p>
            <div className="pt-4">
              <Link to="/register" className="glass-btn px-6 py-3 rounded-lg text-xs">
                Create new account
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <MailCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold theme-text-heading">Email Verified!</h3>
            <p className="text-xs theme-text-muted max-w-sm mx-auto leading-relaxed">{success}</p>
            <div className="pt-4">
              <Link to="/login" className="glass-btn px-6 py-3 rounded-lg text-xs">
                Login now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
