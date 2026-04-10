import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRegisterMutation, useVerifyOtpMutation } from '../store/apiSlice';
import { setCredentials } from '../store/authSlice';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon } from '../components/Icons';

type Step = 'form' | 'otp' | 'success';

export default function Register() {
  const dispatch = useDispatch();
  const [register, { isLoading: regLoading }] = useRegisterMutation();
  const [verifyOtp, { isLoading: otpLoading }] = useVerifyOtpMutation();

  const [step, setStep] = useState<Step>('form');
  const [userId,   setUserId]   = useState('');
  const [memberId, setMemberId] = useState('');
  const [otp,   setOtp]   = useState('');

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '', referralCode: '',
  });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await register(form).unwrap();
      setUserId(res.userId);
      setMemberId(res.memberId);
      toast.success(`Member ID assigned: ${res.memberId}`);
      setStep('otp');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await verifyOtp({ userId, otp }).unwrap();
      dispatch(setCredentials({
        accessToken:  res.accessToken,
        refreshToken: res.refreshToken,
        userId:  res.userId,
        memberId: res.memberId,
        role:  res.role,
        name:  res.name,
        status: res.status ?? 'PENDING',
      }));
      toast.success('OTP verified! Welcome to Plan-I');
      setStep('success');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid OTP');
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold t-text mb-1">Join Plan-I</h1>
          <p className="t-text-3 text-sm">₹1,000 network • Earn at d-1, d-4, d-5</p>
        </div>

        <div className="card">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {['form', 'otp'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                  step === s ? 'bg-brand-600 t-text'
                  : (step === 'otp' && s === 'form') || step === 'success'
                    ? 'bg-brand-900/60 text-brand-400 border border-brand-700'
                    : 'bg-slate-800 t-text-4'
                }`}>
                  {((step === 'otp' && s === 'form') || step === 'success') ? <CheckCircleIcon size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === s ? 't-text' : 't-text-4'}`}>
                  {s === 'form' ? 'Details' : 'Verify OTP'}
                </span>
                {i === 0 && <div className="flex-1 h-px bg-slate-700 mx-1 w-8" />}
              </div>
            ))}
          </div>

          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div>
                <label className="input-label">Full Name *</label>
                <input className="input" placeholder="e.g. Ravi Kumar" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Mobile Number *</label>
                <input className="input" type="tel" placeholder="10-digit mobile" required
                  value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Email (optional)</label>
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Password *</label>
                <input className="input" type="password" placeholder="Min 6 characters" required minLength={6}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Referral Member ID</label>
                <input className="input font-mono" placeholder="e.g. IND00501" maxLength={8}
                  value={form.referralCode} onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))} />
                <p className="text-xs text-slate-500 mt-1">Leave blank to join under the company network</p>
              </div>
              <button type="submit" disabled={regLoading} className="btn-primary w-full mt-2">
                {regLoading ? <span className="animate-pulse-soft">Processing...</span> : 'Register & Get Member ID'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in">
              {/* Show assigned member ID prominently */}
              <div className="bg-brand-950 border border-brand-800 rounded-xl p-4 mb-5 text-center">
                <div className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">Your Member ID</div>
                <div className="text-3xl font-mono font-bold t-text">{memberId}</div>
                <div className="text-xs text-slate-500 mt-1">Save this! You'll need it to refer others.</div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="input-label">Enter OTP</label>
                  <input
                    className="input font-mono text-center text-2xl tracking-[0.5em]"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                  <p className="text-xs text-amber-400 mt-1 text-center">Demo: OTP is always <strong>123456</strong></p>
                </div>
                <button type="submit" disabled={otpLoading} className="btn-primary w-full">
                  {otpLoading ? 'Verifying...' : 'Verify OTP & Continue'}
                </button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center animate-fade-in py-4">
              <div className="flex justify-center mb-4"><SparklesIcon size={40} /></div>
              <h2 className="text-xl font-bold t-text mb-2">Welcome to Plan-I!</h2>
              <div className="member-id-chip mx-auto mb-4 text-lg justify-center">{memberId}</div>
              <p className="t-text-3 text-sm mb-6">Your account is pending admin approval. Submit a joining request to get started.</p>
              <a href="/dashboard" className="btn-primary w-full flex items-center justify-center gap-2">Go to Dashboard <ArrowRightIcon size={16} /></a>
            </div>
          )}
        </div>

        <p className="text-center text-sm t-text-4 mt-4">
          Already a member?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
