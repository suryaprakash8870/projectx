import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useForgotPasswordRequestMutation, useForgotPasswordSubmitMutation } from '../store/apiSlice';
import { LockIcon, ChevronLeftIcon } from '../components/Icons';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [requestOtp, { isLoading: isRequesting }] = useForgotPasswordRequestMutation();
  const [submitReset, { isLoading: isSubmitting }] = useForgotPasswordSubmitMutation();

  const [step, setStep] = useState<1 | 2>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    try {
      await requestOtp({ mobile }).unwrap();
      toast.success('OTP sent to your mobile number!');
      setStep(2);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send OTP');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitReset({ mobile, otp, newPassword }).unwrap();
      toast.success('Password successfully reset! Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reset password');
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold mx-auto mb-4">
            <LockIcon size={24} />
          </div>
          <h1 className="text-2xl font-bold t-text mb-1">Reset Password</h1>
          <p className="t-text-3 text-sm">
            {step === 1 ? "Enter your mobile to get an OTP" : "Enter OTP and your new password"}
          </p>
        </div>

        <div className="card">
          {step === 1 ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="input-label">Mobile Number</label>
                <input
                  id="mobile"
                  className="input"
                  type="tel"
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" disabled={isRequesting} className="btn-primary w-full">
                {isRequesting ? <span className="animate-pulse-soft">Sending...</span> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">OTP</label>
                <input
                  id="otp"
                  className="input"
                  type="text"
                  placeholder="6-digit verification code"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-brand-600/80 mt-2 font-medium">Demo OTP: <strong className="t-text-1">123456</strong></p>
              </div>
              
              <div>
                <label className="input-label">New Password</label>
                <input
                  id="newPassword"
                  className="input"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? <span className="animate-pulse-soft">Verifying...</span> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Link to="/login" className="text-sm font-medium t-text-3 hover:t-text transition-colors flex items-center gap-1">
            <ChevronLeftIcon size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}