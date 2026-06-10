import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Phone, Lock, UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      setError('Phone number must be a valid 10-digit number');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        phone,
        password,
        confirmPassword
      });
      setSuccessMsg(data.message);
      // Clear forms
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-lg p-8 rounded-2xl relative z-10 border shadow-2xl" style={{ borderColor: 'var(--border-medium)' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Join Slice & Spark</h2>
          <p className="text-xs theme-text-muted mt-2">Build your account to customize and track orders live</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-6 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
            <h3 className="text-xl font-bold theme-text-heading">Check Your Email</h3>
            <p className="text-sm theme-text-muted max-w-sm mx-auto leading-relaxed">
              {successMsg}
            </p>
            <div className="pt-4">
              <Link to="/login" className="glass-btn px-6 py-3 rounded-lg text-xs inline-flex items-center space-x-1">
                <span>Go to login</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Address */}
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

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  placeholder="9876543210"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 theme-text-muted" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="glass-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {!successMsg && (
          <div className="mt-8 pt-6 border-t text-center text-xs theme-text-muted" style={{ borderColor: 'var(--border-subtle)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline inline-flex items-center space-x-0.5">
              <ArrowLeft className="h-3 w-3 mr-0.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
