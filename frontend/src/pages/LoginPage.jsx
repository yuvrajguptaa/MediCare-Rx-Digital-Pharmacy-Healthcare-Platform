import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import BackButton from '../components/common/BackButton';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }
    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.first_name || 'User'}!`, 'success');
      
      const from = location.state?.from?.pathname || (
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'DELIVERY_PARTNER' ? '/delivery' :
        '/'
      );
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.response?.data?.error || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    showToast(`Filled demo credentials for ${demoRole}`, 'info');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl animate-fade-in relative">
        
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/" label="Back to Store" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to MediCare</h2>
          <p className="text-xs text-slate-500">Access your digital pharmacy vault, orders & logistics portal</p>
        </div>

        {/* Demo Quick Logins Box */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 text-xs">
          <span className="font-bold text-emerald-950 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Demo 1-Click Login:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('user@medicare.com', 'Customer')}
              className="px-2 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-emerald-800 text-[11px] hover:bg-emerald-100 transition-colors text-center"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('pharmacist@medicare.com', 'Pharmacist')}
              className="px-2 py-1.5 bg-white border border-sky-300 rounded-lg font-bold text-sky-800 text-[11px] hover:bg-sky-100 transition-colors text-center"
            >
              Pharmacist
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('delivery@medicare.com', 'Delivery Partner')}
              className="px-2 py-1.5 bg-white border border-indigo-300 rounded-lg font-bold text-indigo-800 text-[11px] hover:bg-indigo-100 transition-colors text-center"
            >
              Delivery Rider
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin@medicare.com', 'Admin')}
              className="px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-amber-800 text-[11px] hover:bg-amber-100 transition-colors text-center"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-emerald-700 hover:underline font-bold text-[11px]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Register for free
          </Link>
        </div>

      </div>
    </div>
  );
}
