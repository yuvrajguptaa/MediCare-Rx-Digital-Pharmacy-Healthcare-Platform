import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Mail, Lock, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useNotifications } from '../context/NotificationContext';
import BackButton from '../components/common/BackButton';

export default function ForgotPasswordPage() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password/', { email: email.trim() });
      showToast('OTP sent! (Demo OTP: 123456)', 'info');
      setOtp(res.data?.demo_otp || '123456');
      setStep(2);
    } catch (err) {
      showToast('Error requesting password reset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      showToast('Please enter the verification OTP.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/reset-password/', {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword
      });
      showToast('Password reset successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl animate-fade-in relative">
        
        {/* Top bar with Back Button */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/login" label="Back to Login" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Step {step} of 2
          </span>
        </div>

        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Pill className="w-6 h-6 rotate-45" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-500">
            {step === 1 ? 'Enter your email to receive recovery instructions' : 'Enter the OTP and your new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Navigation buttons for Step 1 */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={true}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 cursor-not-allowed opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Sending...' : 'Next: Send OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Account Email</label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-emerald-700 hover:underline font-bold text-[11px]"
                >
                  Change Email
                </button>
              </div>
              <input
                type="text"
                value={email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Verification OTP *</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">New Password (min 6 chars) *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Navigation buttons for Step 2 */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="submit"
                disabled={loading || !otp.trim() || newPassword.length < 6}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Resetting...' : 'Set Password'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
