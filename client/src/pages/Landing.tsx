import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useLoginMutation, useRegisterMutation, useVerifyOtpMutation, useCheckReferralQuery } from '../store/apiSlice';
import { setCredentials } from '../store/authSlice';
import {
  ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon,
  ArrowLeftIcon, ArrowRightIcon,
  PhoneIcon, LockIcon, UserIcon, SparklesIcon,
} from '../components/Icons';

type Tab = 'login' | 'register';
type RegStep = 'form' | 'otp' | 'success';

// ── Shared card style ─────────────────────────────────────────────────────────
const fc: React.CSSProperties = {
  background: 'white',
  borderRadius: '18px',
  boxShadow: '0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.05)',
  padding: '18px',
  position: 'absolute',
};

// ── Mini donut chart ──────────────────────────────────────────────────────────
function MiniDonut({ segments }: { segments: { pct: number; color: string }[] }) {
  const r = 26, cx = 32, cy = 32, circ = 2 * Math.PI * r;
  let cumulative = 0;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      {segments.map((seg, i) => {
        const dash = (seg.pct / 100) * circ;
        const offset = -(cumulative / 100) * circ;
        cumulative += seg.pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
          strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`} />;
      })}
    </svg>
  );
}

// ── Slide card mockups ────────────────────────────────────────────────────────
function CardsWallet() {
  return (
    <div style={{ position: 'relative', width: '300px', height: '230px' }}>
      <div style={{ ...fc, top: 0, left: 0, width: '190px', zIndex: 2 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
        </div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '5px' }}>CURRENT BALANCE</div>
        <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1 }}>₹1,000</div>
      </div>
      <div style={{ ...fc, top: '52px', right: 0, width: '130px', zIndex: 3, transform: 'rotate(3deg)', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
          <MiniDonut segments={[{ pct: 40, color: '#ff8a00' }, { pct: 25, color: '#0066ff' }, { pct: 25, color: '#10b981' }, { pct: 10, color: '#8b5cf6' }]} />
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>4 Wallets</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '8px', width: '165px', borderRadius: '14px', padding: '13px 16px', border: '1.5px dashed #a7f3d0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Transfer</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>to Income wallet</div>
        </div>
      </div>
    </div>
  );
}

function CardsNetwork() {
  return (
    <div style={{ position: 'relative', width: '300px', height: '230px' }}>
      <div style={{ ...fc, top: 0, left: 0, width: '192px', zIndex: 2 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '5px' }}>YOUR NETWORK</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1 }}>12 <span style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'system-ui', fontWeight: 600 }}>members</span></div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
          {['A','B','C','D'].map((l, i) => (
            <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: `hsl(${210 + i * 35},75%,85%)`, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: `hsl(${210 + i * 35},55%,40%)` }}>{l}</div>
          ))}
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8' }}>+8</div>
        </div>
      </div>
      <div style={{ ...fc, top: '52px', right: 0, width: '124px', zIndex: 3, transform: 'rotate(-3deg)', padding: '14px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>LAST PAYOUT</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0066ff', fontFamily: 'monospace' }}>₹250</div>
        <div style={{ fontSize: '0.58rem', color: '#10b981', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>▲ Auto-credited</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '8px', width: '165px', borderRadius: '14px', padding: '13px 16px', border: '1.5px dashed #bfdbfe', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0066ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Invite</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Share referral link</div>
        </div>
      </div>
    </div>
  );
}

function CardsPayouts() {
  const txns = [
    { label: 'Referral Payout', amt: '+₹250', color: '#10b981' },
    { label: 'Cycle Level 3',   amt: '+₹250', color: '#10b981' },
    { label: 'GST Deducted',    amt: '-₹180', color: '#f43f5e' },
  ];
  return (
    <div style={{ position: 'relative', width: '300px', height: '230px' }}>
      <div style={{ ...fc, top: 0, left: 0, width: '210px', zIndex: 2 }}>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '12px' }}>RECENT PAYOUTS</div>
        {txns.map((t, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < txns.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ fontSize: '0.74rem', color: '#334155', fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: t.color, fontFamily: 'monospace' }}>{t.amt}</div>
          </div>
        ))}
      </div>
      <div style={{ ...fc, top: '48px', right: 0, width: '116px', zIndex: 3, transform: 'rotate(3deg)', padding: '14px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>TOTAL EARNED</div>
        <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#ff8a00', fontFamily: 'monospace' }}>₹750</div>
        <div style={{ marginTop: '8px', height: '4px', background: '#fed7aa', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '75%', background: '#ff8a00', borderRadius: '4px' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '8px', width: '165px', borderRadius: '14px', padding: '13px 16px', border: '1.5px dashed #fed7aa', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ff8a00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Withdraw</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Income wallet</div>
        </div>
      </div>
    </div>
  );
}

function CardsInvestment() {
  return (
    <div style={{ position: 'relative', width: '300px', height: '230px' }}>
      <div style={{ ...fc, top: 0, left: 0, width: '192px', zIndex: 2 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '5px' }}>JOINING FEE</div>
        <div style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', lineHeight: 1 }}>₹1,000</div>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {['₹1,000 coupon credited', '₹750 paid to network', 'Lifetime membership'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748b' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ede9fe', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...fc, top: '52px', right: 0, width: '124px', zIndex: 3, transform: 'rotate(-3deg)', padding: '14px', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>APPROVED</div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '3px' }}>Active member</div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: '8px', width: '165px', borderRadius: '14px', padding: '13px 16px', border: '1.5px dashed #ddd6fe', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>Join Now</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>One-time fee only</div>
        </div>
      </div>
    </div>
  );
}

const slides = [
  { cards: <CardsWallet />,     title: 'Manage Your Wallets',     subtitle: 'Coupon, Purchase, Income and GST — 4 wallets to track every rupee you earn and spend.' },
  { cards: <CardsNetwork />,    title: 'Grow Your Network',       subtitle: 'Earn ₹250 automatically for every member who joins under your referral tree.' },
  { cards: <CardsPayouts />,    title: 'Transparent Payouts',     subtitle: 'A 9-level rotating cycle distributes earnings fairly across all active members.' },
  { cards: <CardsInvestment />, title: 'One-Time Investment',     subtitle: 'Pay ₹1,000 once. Get ₹1,000 coupon, lifetime membership and network earnings.' },
];

// ── Left carousel panel ────────────────────────────────────────────────────────
function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);

  function goTo(idx: number) {
    if (idx === active || animating) return;
    setAnimating(true);
    setTimeout(() => { setActive(idx); setAnimating(false); }, 350);
  }

  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => { setActive(i => (i + 1) % slides.length); setAnimating(false); }, 350);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const s = slides[active];

  return (
    <div style={{ background: '#eef2f8', padding: '40px 48px 32px', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', userSelect: 'none' }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0066ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.125rem', boxShadow: '0 4px 12px rgba(0,102,255,0.25)' }}>P</div>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Plan-I</div>
          <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.7rem' }}>Network Platform</div>
        </div>
      </div>

      {/* Cards area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(14px) scale(0.97)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {s.cards}
        </div>
      </div>

      {/* Text */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease 0.05s, transform 0.35s ease 0.05s',
        }}>
          <h2 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#0f172a', marginBottom: '8px', lineHeight: 1.2 }}>{s.title}</h2>
          <p style={{ fontSize: '0.9375rem', color: 'rgba(15,23,42,0.5)', lineHeight: 1.65, maxWidth: '360px' }}>{s.subtitle}</p>
        </div>
      </div>

      {/* Dots + arrows */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goTo((active - 1 + slides.length) % slides.length)}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid rgba(15,23,42,0.12)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,23,42,0.5)' }}>
          <ChevronLeftIcon size={16} />
        </button>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === active ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i === active ? '#0066ff' : 'rgba(15,23,42,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
        <button onClick={() => goTo((active + 1) % slides.length)}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid rgba(15,23,42,0.12)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(15,23,42,0.5)' }}>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Main Landing page ──────────────────────────────────────────────────────────
export default function Landing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [loginForm, setLoginForm] = useState({ mobile: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();

  const [regStep, setRegStep] = useState<RegStep>('form');
  const [regForm, setRegForm] = useState({ name: '', mobile: '', email: '', password: '', referralCode: '', leg: '' });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    const leg = searchParams.get('leg')?.toUpperCase();
    if (ref) {
      setActiveTab('register');
      setRegForm(f => ({ ...f, referralCode: ref.toUpperCase(), leg: leg === 'LEFT' || leg === 'RIGHT' ? leg : '' }));
    }
  }, [searchParams]);

  const { data: refData, isLoading: isRefLoading } = useCheckReferralQuery(
    regForm.referralCode, { skip: !regForm.referralCode || regForm.referralCode.length < 8 }
  );
  const [otp, setOtp] = useState('');
  const [regUserId, setRegUserId] = useState('');
  const [regMemberId, setRegMemberId] = useState('');
  const [register, { isLoading: isRegLoading }] = useRegisterMutation();
  const [verifyOtp, { isLoading: isOtpLoading }] = useVerifyOtpMutation();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await login(loginForm).unwrap();
      dispatch(setCredentials({ accessToken: res.accessToken, refreshToken: res.refreshToken, userId: res.userId, memberId: res.memberId, role: res.role, name: res.name, status: res.status }));
      toast.success('Welcome back!');
      navigate(res.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) { toast.error(err?.data?.message || 'Login failed'); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regForm.referralCode && !regForm.leg) { toast.error('Please select Left or Right tree positioning.'); return; }
    if (regForm.referralCode && !refData) { toast.error('Invalid Referral Code.'); return; }
    try {
      const res = await register(regForm).unwrap();
      setRegUserId(res.userId); setRegMemberId(res.memberId);
      toast.success(`Member ID: ${res.memberId}`);
      setRegStep('otp');
    } catch (err: any) { toast.error(err?.data?.message || 'Registration failed'); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await verifyOtp({ userId: regUserId, otp }).unwrap();
      dispatch(setCredentials({ accessToken: res.accessToken, refreshToken: res.refreshToken, userId: res.userId, memberId: res.memberId, role: res.role, name: res.name, status: res.status ?? 'PENDING' }));
      toast.success('Welcome to Plan-I!');
      setRegStep('success');
    } catch (err: any) { toast.error(err?.data?.message || 'Invalid OTP'); }
  }

  const isOtpOrSuccess = activeTab === 'register' && (regStep === 'otp' || regStep === 'success');
  const isLogin = activeTab === 'login';

  return (
    <div className="min-h-dvh flex" style={{ background: '#f0f4ff' }}>

      {/* ── LEFT: Carousel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 shrink-0">
        <FeatureCarousel />
      </div>

      {/* ── RIGHT: Form (no card background) ────────────────────────────── */}
      <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-center p-8 overflow-y-auto">

        {/* Mobile brand */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-lg">P</div>
          <div>
            <div className="font-bold text-slate-800" style={{ fontSize: '1rem' }}>Plan-I</div>
            <div style={{ color: 'rgba(15,23,42,0.4)', fontSize: '0.7rem' }}>Network Platform</div>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Login header */}
          {isLogin && (
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                style={{ background: 'rgba(0,102,255,0.08)', borderColor: 'rgba(0,102,255,0.2)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
                <span className="font-bold uppercase tracking-widest text-brand-600" style={{ fontSize: '0.6875rem' }}>Welcome Back</span>
              </div>
              <h1 className="font-black mb-2" style={{ fontSize: '1.75rem', color: '#0f172a' }}>Login to Plan-I</h1>
              <p style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9375rem' }}>Enter your credentials to access your dashboard</p>
            </div>
          )}

          {/* Register header */}
          {!isLogin && !isOtpOrSuccess && (
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                style={{ background: 'rgba(255,138,0,0.08)', borderColor: 'rgba(255,138,0,0.22)' }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: '#ff8a00' }} />
                <span className="font-bold uppercase tracking-widest" style={{ fontSize: '0.6875rem', color: '#cc6e00' }}>Join Plan-I</span>
              </div>
              <h1 className="font-black mb-2" style={{ fontSize: '1.75rem', color: '#0f172a' }}>Create Account</h1>
              <p style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9375rem' }}>Start your network journey today</p>
            </div>
          )}

          {/* Tab switcher */}
          {!isOtpOrSuccess && (
            <div className="flex gap-1 p-1 rounded-xl mb-6 border"
              style={{ background: 'rgba(15,23,42,0.05)', borderColor: 'rgba(15,23,42,0.09)' }}>
              <button onClick={() => setActiveTab('login')}
                className="flex-1 py-2 px-3 rounded-lg font-bold transition-all duration-200"
                style={{ fontSize: '0.9rem', background: isLogin ? '#ffffff' : 'transparent', color: isLogin ? '#0f172a' : 'rgba(15,23,42,0.38)', boxShadow: isLogin ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
                Sign In
              </button>
              <button onClick={() => setActiveTab('register')}
                className="flex-1 py-2 px-3 rounded-lg font-bold transition-all duration-200"
                style={{ fontSize: '0.9rem', background: !isLogin ? '#ffffff' : 'transparent', color: !isLogin ? '#0f172a' : 'rgba(15,23,42,0.38)', boxShadow: !isLogin ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
                Create Account
              </button>
            </div>
          )}

          {/* ══ LOGIN FORM ══ */}
          {isLogin && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div>
                <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><PhoneIcon size={17} /></div>
                  <input type="tel" className="input" style={{ paddingLeft: '2.75rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    placeholder="10-digit mobile number" value={loginForm.mobile}
                    onChange={e => setLoginForm(f => ({ ...f, mobile: e.target.value }))} required autoFocus />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold" style={{ fontSize: '0.875rem', color: '#334155' }}>Password</label>
                  <Link to="/forgot-password" className="font-bold uppercase tracking-wider hover:text-brand-600 transition-colors" style={{ fontSize: '0.6875rem', color: '#0066ff' }}>Forgot?</Link>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><LockIcon size={17} /></div>
                  <input type={showPass ? 'text' : 'password'} className="input"
                    style={{ paddingLeft: '2.75rem', paddingRight: '3rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    placeholder="••••••••" value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
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
              <div className="rounded-xl p-3 border" style={{ background: 'rgba(0,102,255,0.05)', borderColor: 'rgba(0,102,255,0.13)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <SparklesIcon size={12} className="text-brand-500" />
                  <span className="font-bold text-brand-600" style={{ fontSize: '0.75rem' }}>Demo credentials</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.5)' }}>
                  <p>Admin: <span className="font-mono text-brand-600">9999999999</span> / admin123</p>
                  <p>User: <span className="font-mono text-brand-600">9000000501</span> / member123</p>
                </div>
              </div>
              <button type="submit" disabled={isLoginLoading}
                className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl transition-all"
                style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none', opacity: isLoginLoading ? 0.7 : 1 }}>
                {isLoginLoading ? <span className="animate-pulse-soft">Authenticating…</span> : <>Login to Account <ChevronRightIcon size={17} /></>}
              </button>
              <p className="text-center" style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9rem' }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => setActiveTab('register')} className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Sign Up Now</button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {!isLogin && (
            <div className="animate-fade-in">
              {!isOtpOrSuccess && (
                <div className="flex items-center gap-1.5 mb-5 justify-center">
                  {['Details', 'Verify', 'Done'].map((label, i) => {
                    const stepIdx = ['form', 'otp', 'success'].indexOf(regStep);
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

              {regStep === 'form' && (
                <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Full Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><UserIcon size={17} /></div>
                      <input className="input" style={{ paddingLeft: '2.75rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                        placeholder="Your full name" required value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Mobile</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><PhoneIcon size={15} /></div>
                        <input className="input" style={{ paddingLeft: '2.1rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                          type="tel" placeholder="10 digits" required value={regForm.mobile} onChange={e => setRegForm(f => ({ ...f, mobile: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Email <span style={{ color: 'rgba(15,23,42,0.35)', fontWeight: 400 }}>(opt)</span></label>
                      <input className="input" style={{ background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                        type="email" placeholder="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(15,23,42,0.3)' }}><LockIcon size={17} /></div>
                      <input className="input" style={{ paddingLeft: '2.75rem', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                        type="password" placeholder="Min 6 characters" required minLength={6} value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1.5" style={{ fontSize: '0.875rem', color: '#334155' }}>Referral Code <span style={{ color: 'rgba(15,23,42,0.35)', fontWeight: 400 }}>(opt)</span></label>
                    <input className="input font-mono uppercase" style={{ background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                      placeholder="e.g. IND00501" maxLength={8} value={regForm.referralCode} onChange={e => setRegForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))} />
                  </div>
                  {regForm.referralCode.length >= 8 && (
                    <div className="rounded-xl p-3.5 border animate-fade-in" style={{ background: 'rgba(0,102,255,0.05)', borderColor: 'rgba(0,102,255,0.14)' }}>
                      <div className="mb-3" style={{ fontSize: '0.875rem' }}>
                        <span style={{ color: 'rgba(15,23,42,0.45)' }}>Referred by: </span>
                        <span className={`font-bold ${!refData && !isRefLoading ? 'text-rose-500' : 'text-slate-800'}`}>
                          {isRefLoading ? 'Searching…' : refData ? refData.name : 'Invalid Code'}
                        </span>
                      </div>
                      <label className="block font-semibold mb-2" style={{ fontSize: '0.8rem', color: '#334155' }}>Network Tree Position <span className="text-rose-500">*</span></label>
                      {searchParams.get('leg')?.toUpperCase() === 'LEFT' || searchParams.get('leg')?.toUpperCase() === 'RIGHT' ? (
                        <div className={`flex items-center justify-center gap-3 rounded-xl p-3 border font-semibold ${regForm.leg === 'LEFT' ? 'bg-brand-500/10 border-brand-500/30 text-brand-700' : 'bg-accent-500/10 border-accent-500/30 text-amber-700'}`}>
                          {regForm.leg === 'LEFT' ? <ArrowLeftIcon size={16} /> : <ArrowRightIcon size={16} />}
                          {regForm.leg}
                          <span style={{ fontSize: '0.6rem', opacity: 0.5, marginLeft: 'auto', border: '1px solid currentColor', borderRadius: '4px', padding: '1px 5px' }}>LOCKED</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <label className={`cursor-pointer border rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all font-bold text-sm ${regForm.leg === 'LEFT' ? 'bg-brand-500/10 border-brand-500/40 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <input type="radio" name="leg" value="LEFT" className="hidden" onChange={() => setRegForm(f => ({ ...f, leg: 'LEFT' }))} checked={regForm.leg === 'LEFT'} />
                            <ChevronLeftIcon size={14} /> Left
                          </label>
                          <label className={`cursor-pointer border rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all font-bold text-sm ${regForm.leg === 'RIGHT' ? 'bg-amber-500/10 border-amber-500/40 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <input type="radio" name="leg" value="RIGHT" className="hidden" onChange={() => setRegForm(f => ({ ...f, leg: 'RIGHT' }))} checked={regForm.leg === 'RIGHT'} />
                            Right <ChevronRightIcon size={14} />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                  <button type="submit" disabled={isRegLoading}
                    className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl mt-1"
                    style={{ background: '#ff8a00', minHeight: '50px', fontSize: '1rem', border: 'none', opacity: isRegLoading ? 0.7 : 1 }}>
                    {isRegLoading ? <span className="animate-pulse-soft">Processing…</span> : <>Create Account <ChevronRightIcon size={17} /></>}
                  </button>
                  <p className="text-center" style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9rem' }}>
                    Already a member?{' '}
                    <button type="button" onClick={() => setActiveTab('login')} className="font-bold text-brand-600 hover:text-brand-700 transition-colors">Sign In</button>
                  </p>
                </form>
              )}

              {regStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5 animate-slide-up">
                  <div className="text-center mb-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
                      style={{ background: 'rgba(0,102,255,0.08)', borderColor: 'rgba(0,102,255,0.2)' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
                      <span className="font-bold uppercase tracking-widest text-brand-600" style={{ fontSize: '0.6875rem' }}>Verify Identity</span>
                    </div>
                    <h2 className="font-black mb-1" style={{ fontSize: '1.5rem', color: '#0f172a' }}>Enter OTP</h2>
                    <p style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9rem' }}>Code sent to your mobile number</p>
                  </div>
                  <div className="text-center rounded-2xl p-4 border" style={{ background: 'white', borderColor: 'rgba(15,23,42,0.1)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>Your Member ID</p>
                    <p className="font-mono font-black" style={{ fontSize: '2rem', color: '#0f172a' }}>{regMemberId}</p>
                  </div>
                  <input className="input font-mono text-center tracking-[0.5em]"
                    style={{ fontSize: '1.75rem', height: '64px', background: 'white', borderColor: 'rgba(15,23,42,0.12)', color: '#0f172a' }}
                    placeholder="------" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required autoFocus />
                  <p className="text-center" style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.4)' }}>
                    Demo OTP: <strong className="text-brand-600">123456</strong>
                  </p>
                  <button type="submit" disabled={isOtpLoading}
                    className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl"
                    style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none' }}>
                    {isOtpLoading ? 'Verifying…' : <>Verify & Continue <ChevronRightIcon size={17} /></>}
                  </button>
                </form>
              )}

              {regStep === 'success' && (
                <div className="text-center animate-slide-up py-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 border"
                    style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                    <CheckCircleIcon size={40} />
                  </div>
                  <h2 className="font-black mb-2" style={{ fontSize: '1.5rem', color: '#0f172a' }}>Account Created!</h2>
                  <p className="mb-6" style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                    Your account is active. Submit a joining request to activate your network position.
                  </p>
                  <button onClick={() => window.location.href = '/dashboard'}
                    className="w-full font-bold text-white rounded-xl"
                    style={{ background: '#0066ff', minHeight: '50px', fontSize: '1rem', border: 'none' }}>
                    Continue to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
