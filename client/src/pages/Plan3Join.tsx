import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  usePlan2CheckReferralQuery,
  usePlan2RegisterMutation,
  usePlan2VerifyOtpMutation,
} from '../store/apiSlice';
import {
  ChevronRightIcon, CheckCircleIcon,
  PhoneIcon, LockIcon, UserIcon, SparklesIcon,
} from '../components/Icons';
import { FeatureCarousel } from './Landing';

type Step = 'form' | 'otp' | 'success';

export default function Plan3Join() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = (searchParams.get('ref') || '').toUpperCase();

  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    referralCode: refCode,
  });
  const [showPass, setShowPass] = useState(false);
  const [userId, setUserId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (refCode) setForm(f => ({ ...f, referralCode: refCode }));
  }, [refCode]);

  const { data: refData, isLoading: isRefLoading } = usePlan2CheckReferralQuery(
    form.referralCode,
    { skip: !form.referralCode || form.referralCode.length < 4 },
  );

  const [registerMutation, { isLoading: registering }] = usePlan2RegisterMutation();
  const [verifyMutation, { isLoading: verifying }] = usePlan2VerifyOtpMutation();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.referralCode) { toast.error('A referral code is required.'); return; }
    if (!refData) { toast.error('Invalid referral code.'); return; }
    try {
      const res: any = await registerMutation(form).unwrap();
      setUserId(res.userId);
      setMemberId(res.memberId);
      toast.success(`Member ID: ${res.memberId}`);
      setStep('otp');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Registration failed');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await verifyMutation({ userId, otp }).unwrap();
      toast.success('OTP verified. Please log in to continue.');
      setStep('success');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Invalid OTP');
    }
  }

  const isOtpOrSuccess = step === 'otp' || step === 'success';

  return (
    <div className="min-h-dvh flex" style={{ background: '#f0f4ff' }}>

      {/* ── LEFT: Carousel (same as Plan 1 Landing) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0">
        <FeatureCarousel />
      </div>

      {/* ── RIGHT: Plan 2 signup form ──────────────────────────────────── */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center p-8 overflow-y-auto">

        {/* Mobile brand */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-lg">P</div>
          <div>
            <div className="font-bold text-slate-800" style={{ fontSize: '1rem' }}>Plan-III</div>
            <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.7rem' }}>Plan 3 Investment</div>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Header */}
          {!isOtpOrSuccess && (
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                style={{ background: 'rgba(0,102,255,0.08)', borderColor: 'rgba(0,102,255,0.2)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
                <span className="font-bold uppercase tracking-widest text-brand-600" style={{ fontSize: '0.6875rem' }}>Plan 3 · Investment</span>
              </div>
              <h1 className="font-black mb-2" style={{ fontSize: '1.75rem', color: '#0f172a' }}>Join Plan 3</h1>
              <p style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9375rem' }}>Earn 5% monthly returns on your investment</p>
            </div>
          )}

          {/* Step indicator */}
          {!isOtpOrSuccess && (
            <div className="flex items-center gap-1.5 mb-5 justify-center">
              {['Details', 'Verify', 'Done'].map((label, i) => {
                const stepIdx = ['form', 'otp', 'success'].indexOf(step);
                const done = stepIdx > i; const isActive = stepIdx === i;
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold border transition-all"
                        style={{ fontSize: '0.7rem', background: done ? '#0066ff' : isActive ? 'rgba(0,102,255,0.1)' : 'rgba(15,23,42,0.05)', borderColor: done || isActive ? '#0066ff' : 'rgba(15,23,42,0.15)', color: done ? '#fff' : isActive ? '#0066ff' : 'rgba(15,23,42,0.35)' }}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: isActive ? 'rgba(15,23,42,0.65)' : 'rgba(15,23,42,0.28)' }}>{label}</span>
                    </div>
                    {i < 2 && <div className="w-5 h-px" style={{ background: done ? '#0066ff' : 'rgba(15,23,42,0.12)' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ REGISTER FORM ══ */}
          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
              {/* Referral code */}
              <div>
                <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Referral Code</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><SparklesIcon size={15} /></div>
                  <input className="input font-mono uppercase"
                    style={{ paddingLeft: '2.75rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    placeholder="Enter referral code" required maxLength={20}
                    value={form.referralCode}
                    onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                    readOnly={!!refCode} />
                </div>
                {form.referralCode.length >= 4 && (
                  <div className="mt-1.5" style={{ fontSize: '0.75rem' }}>
                    {isRefLoading ? (
                      <span style={{ color: 'rgba(15,23,42,0.5)' }}>Checking…</span>
                    ) : refData ? (
                      <span className="font-semibold text-emerald-600">✓ Referred by {refData.name} ({refData.kind === 'ADMIN' ? 'Admin' : 'Plan 2 Member'})</span>
                    ) : (
                      <span className="font-semibold text-rose-600">✗ Invalid referral code</span>
                    )}
                  </div>
                )}
              </div>

              {/* Full name */}
              <div>
                <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Full Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><UserIcon size={17} /></div>
                  <input className="input"
                    style={{ paddingLeft: '2.75rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    placeholder="Your full name" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>

              {/* Mobile + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Mobile</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><PhoneIcon size={15} /></div>
                    <input className="input"
                      style={{ paddingLeft: '2.1rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                      type="tel" placeholder="10 digits" required
                      value={form.mobile}
                      onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Email <span style={{ color: 'rgba(15,23,42,0.4)', fontWeight: 400 }}>(opt)</span></label>
                  <input className="input"
                    style={{ background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    type="email" placeholder="you@mail.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><LockIcon size={17} /></div>
                  <input className="input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '3rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters" required minLength={6}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: showPass ? '#0066ff' : 'rgba(15,23,42,0.3)' }}>
                    {showPass
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Info card */}
              <div className="rounded-xl p-3 border" style={{ background: 'rgba(0,102,255,0.05)', borderColor: 'rgba(0,102,255,0.13)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <SparklesIcon size={12} className="text-brand-500" />
                  <span className="font-bold text-brand-600" style={{ fontSize: '0.75rem' }}>What happens next?</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.5)' }}>
                  <p>You'll get a Plan 2 member ID, verify OTP, then submit an investment request of ₹50,000 or ₹1,00,000.</p>
                </div>
              </div>

              <button type="submit" disabled={registering}
                className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl transition-all"
                style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none', opacity: registering ? 0.7 : 1 }}>
                {registering ? <span className="animate-pulse-soft">Processing…</span> : <>Create Plan 2 Account <ChevronRightIcon size={17} /></>}
              </button>

              <p className="text-center" style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9rem' }}>
                Already a member? <Link to="/" className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Login</Link>
              </p>
            </form>
          )}

          {/* ══ OTP STEP ══ */}
          {step === 'otp' && (
            <div className="animate-fade-in">
              <div className="text-center mb-5 p-5 rounded-2xl border"
                style={{ background: 'rgba(0,102,255,0.05)', borderColor: 'rgba(0,102,255,0.18)' }}>
                <div className="font-bold uppercase tracking-widest text-brand-600 mb-2" style={{ fontSize: '0.6875rem' }}>Your Member ID</div>
                <div className="font-mono font-black t-text" style={{ fontSize: '1.625rem', color: '#0f172a' }}>{memberId}</div>
                <div className="mt-1" style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.45)' }}>Save this — you'll use it to login.</div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1.5 text-center" style={{ fontSize: '0.875rem', color: '#334155' }}>Enter Verification Code</label>
                  <input className="input font-mono text-center"
                    style={{ background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a', fontSize: '1.5rem', letterSpacing: '0.5em', padding: '0.75rem 1rem' }}
                    placeholder="------" maxLength={6} required autoFocus
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                  <p className="text-center mt-2" style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>Demo OTP: <strong className="text-brand-600">123456</strong></p>
                </div>
                <button type="submit" disabled={verifying}
                  className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl transition-all"
                  style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none', opacity: verifying ? 0.7 : 1 }}>
                  {verifying ? <span className="animate-pulse-soft">Verifying…</span> : <>Verify OTP <ChevronRightIcon size={17} /></>}
                </button>
              </form>
            </div>
          )}

          {/* ══ SUCCESS STEP ══ */}
          {step === 'success' && (
            <div className="text-center py-6 animate-fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <CheckCircleIcon size={32} />
                </div>
              </div>
              <h2 className="font-black mb-2" style={{ fontSize: '1.5rem', color: '#0f172a' }}>Account activated!</h2>
              <div className="font-mono text-brand-600 font-black mb-3" style={{ fontSize: '1.125rem' }}>{memberId}</div>
              <p className="mb-5" style={{ color: 'rgba(15,23,42,0.5)', fontSize: '0.9rem' }}>
                Your Plan 2 account is active. Log in and submit an investment request to start earning.
              </p>
              <button onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl transition-all"
                style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none' }}>
                Go to Login <ChevronRightIcon size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
