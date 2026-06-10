import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl border shadow-2xl" style={{ borderColor: 'var(--border-medium)' }}>
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold font-heading theme-text-heading">Forgot Password?</h2>
          <p className="text-xs theme-text-muted mt-2">Enter your email and we'll send password reset directions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-sm theme-text-secondary leading-relaxed">{success}</p>
            <Link to="/login" className="glass-btn px-6 py-3 rounded-lg text-xs inline-flex items-center space-x-1">
              <span>Return to Login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link to="/login" className="text-xs theme-text-muted hover:text-orange-500 inline-flex items-center space-x-1 transition-colors">
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
