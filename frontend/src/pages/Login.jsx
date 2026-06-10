import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../redux/slices/authSlice';
import api from '../utils/api';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      setValidationError('Please fill in all fields');
      return;
    }

    dispatch(authStart());
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe });
      dispatch(authSuccess(data));
      // Success redirection is handled in useEffect
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      dispatch(authFailure(msg));
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 py-16 relative">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative z-10 border shadow-2xl" style={{ borderColor: 'var(--border-medium)' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Welcome Back</h2>
          <p className="text-xs theme-text-muted mt-2">Sign in to design your 3D pizza and checkout</p>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
            {validationError}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
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

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider theme-text-muted">Password</label>
              <Link to="/forgot-password" className="text-xs text-orange-500 hover:underline">Forgot password?</Link>
            </div>
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

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500/20 accent-orange-500"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs theme-text-muted select-none">Remember my details</label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="glass-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t text-center text-xs theme-text-muted" style={{ borderColor: 'var(--border-subtle)' }}>
          New to Slice & Spark?{' '}
          <Link to="/register" className="text-orange-500 font-semibold hover:underline inline-flex items-center space-x-0.5">
            <span>Create account</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
