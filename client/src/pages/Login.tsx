import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useLoginMutation } from '../store/apiSlice';
import { setCredentials } from '../store/authSlice';
import {
  SparklesIcon, WalletIcon, UsersIcon, ShieldCheckIcon,
  BanknotesIcon, PhoneIcon, LockIcon, ChevronRightIcon,
} from '../components/Icons';

// ── Carousel slides ────────────────────────────────────────────────────────────
const slides = [
  {
    icon: <UsersIcon size={48} />,
    accent: '#0066ff',
    title: 'Grow Your Network',
    subtitle: 'Earn ₹250 for every member who joins under your referral tree — automatically, with no manual tracking.',
    stat: '₹250', statLabel: 'per referral payout',
  },
  {
    icon: <WalletIcon size={48} />,
    accent: '#10b981',
    title: '4 Powerful Wallets',
    subtitle: 'Coupon, Purchase, Income, and GST wallets keep your earnings organized and ready to use or withdraw.',
    stat: '4', statLabel: 'wallet types',
  },
  {
    icon: <BanknotesIcon size={48} />,
    accent: '#ff8a00',
    title: 'Transparent Payouts',
    subtitle: 'The 9-level rotating cycle ensures fair distribution. Every active member earns over time — no exceptions.',
    stat: '9', statLabel: 'payout cycle levels',
  },
  {
    icon: <ShieldCheckIcon size={48} />,
    accent: '#8b5cf6',
    title: 'One-Time Investment',
    subtitle: 'Pay just ₹1,000 once to activate your membership. No hidden fees, no subscriptions — ever.',
    stat: '₹1,000', statLabel: 'one-time joining fee',
  },
];

// ── Left panel carousel ────────────────────────────────────────────────────────
function FeatureCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const s = slides[active];

  return (
    <div className="relative flex flex-col justify-between h-full p-10 overflow-hidden select-none"
      style={{ background: '#080808' }}>

      {/* Ambient glow behind slide icon */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ background: s.accent, opacity: 0.08 }} />

      {/* Brand */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
          P
        </div>
        <div>
          <div className="font-bold text-white" style={{ fontSize: '1.0625rem' }}>Plan-I</div>
          <div className="text-white/40" style={{ fontSize: '0.75rem' }}>Network Platform</div>
        </div>
      </div>

      {/* Slide content */}
      <div className="relative z-10 space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center border transition-colors duration-500"
          style={{ background: `${s.accent}18`, borderColor: `${s.accent}30`, color: s.accent }}>
          {s.icon}
        </div>

        {/* Text */}
        <div>
          <h2 className="font-black text-white mb-3" style={{ fontSize: '1.875rem', lineHeight: 1.15 }}>
            {s.title}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.65 }}>
            {s.subtitle}
          </p>
        </div>

        {/* Stat chip */}
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ background: `${s.accent}10`, borderColor: `${s.accent}25` }}>
          <span className="font-black font-mono" style={{ fontSize: '1.5rem', color: s.accent }}>{s.stat}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{s.statLabel}</span>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-2 relative z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? '28px' : '8px',
              height: '8px',
              background: i === active ? s.accent : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Login page ────────────────────────────────────────────────────────────
export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ mobile: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await login(form).unwrap();
      dispatch(setCredentials({
        accessToken:  res.accessToken,
        refreshToken: res.refreshToken,
        userId:  res.userId,
        memberId: res.memberId,
        role:  res.role,
        name:  res.name,
        status: res.status,
      }));
      toast.success('Welcome back!');
      navigate(res.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-dvh flex" style={{ background: '#000000' }}>

      {/* ── Left carousel panel (desktop only) ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] shrink-0 border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <FeatureCarousel />
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">

        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(0,102,255,0.06)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(0,102,255,0.04)' }} />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo (hidden on desktop where left panel shows) */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/20">
              P
            </div>
            <div>
              <div className="font-bold text-white" style={{ fontSize: '1.0625rem' }}>Plan-I</div>
              <div className="text-white/40" style={{ fontSize: '0.75rem' }}>Network Platform</div>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-black text-white mb-1.5" style={{ fontSize: '1.75rem' }}>Welcome back</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9375rem' }}>
              Sign in to your Plan-I account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Mobile field */}
            <div>
              <label className="input-label">Mobile Number</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <PhoneIcon size={18} />
                </div>
                <input
                  id="mobile"
                  className="input"
                  style={{ paddingLeft: '2.75rem' }}
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="input-label mb-0">Password</label>
                <Link to="/forgot-password"
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  style={{ fontSize: '0.8125rem' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <LockIcon size={18} />
                </div>
                <input
                  id="password"
                  className="input"
                  style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: showPass ? '#0066ff' : 'rgba(255,255,255,0.3)' }}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Demo credentials */}
            <div className="rounded-xl p-3.5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon size={14} />
                <span className="font-semibold" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>Demo credentials</span>
              </div>
              <div className="space-y-1" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)' }}>
                <p>Admin: <span className="font-mono text-brand-400">9999999999</span> / admin123</p>
                <p>Member: <span className="font-mono text-brand-400">9000000501</span> / member123</p>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              style={{ minHeight: '52px', fontSize: '1rem' }}
            >
              {isLoading ? (
                <span className="animate-pulse-soft">Signing in…</span>
              ) : (
                <>Sign In <ChevronRightIcon size={18} /></>
              )}
            </button>
          </form>

          {/* Divider + register link */}
          <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9375rem' }}>
              New member?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>

          {/* Feature pills (mobile only — desktop shows carousel) */}
          <div className="mt-6 flex flex-wrap gap-2 justify-center lg:hidden">
            {['₹250/referral', '4 Wallets', '9-Level Cycle', 'One-time ₹1,000'].map(f => (
              <span key={f} className="px-3 py-1 rounded-full border font-medium"
                style={{ background: 'rgba(0,102,255,0.08)', borderColor: 'rgba(0,102,255,0.2)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                {f}
              </span>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
