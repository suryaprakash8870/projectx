import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState } from '../store/store';
import {
  useGetMeQuery,
  useGetWalletQuery,
  useGetNetworkStatsQuery,
  useGetPayoutSlotsQuery,
  useGetTransactionsQuery,
} from '../store/apiSlice';
import {
  RefreshIcon, UserIcon, UsersIcon,
  InboxIcon, ArrowRightIcon, ChevronRightIcon, WalletIcon,
  TagIcon, ShoppingBagIcon, BanknotesIcon, ReceiptIcon,
  GlobeIcon, ShoppingCartIcon, ChartBarIcon,
} from '../components/Icons';

function SkeletonCard({ height = 'h-32' }: { height?: string }) {
  return <div className={`skeleton ${height} rounded-3xl`} />;
}

// ── Stat Card — label + big value + optional icon ─────────────────────────────
function StatCard({
  label, value, sub, icon, iconBg, iconColor, fullBg, fullBgText,
}: {
  label: string; value: string | number; sub?: string;
  icon?: React.ReactNode; iconBg?: string; iconColor?: string;
  fullBg?: string; fullBgText?: boolean;
}) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        padding: '1.5rem',
        background: fullBg || 'var(--color-surface)',
        border: fullBg ? 'none' : '1px solid var(--color-border)',
        boxShadow: fullBg ? `0 8px 32px ${fullBg}55` : 'var(--shadow-card)',
      }}
    >
      {/* Decorative circles — only on colored cards */}
      {fullBg && (
        <>
          <div className="absolute pointer-events-none" style={{
            width: '120px', height: '120px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.15)',
            top: '-30px', right: '-20px',
          }} />
          <div className="absolute pointer-events-none" style={{
            width: '80px', height: '80px', borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.10)',
            top: '10px', right: '30px',
          }} />
          <div className="absolute pointer-events-none" style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
            bottom: '-15px', left: '-10px',
          }} />
        </>
      )}

      <div className="relative flex items-start justify-between mb-4">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: fullBgText ? 'rgba(255,255,255,0.7)' : 'var(--color-text-4)' }}
        >
          {label}
        </span>
        {icon && (
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: fullBgText ? 'rgba(255,255,255,0.2)' : (iconBg || 'var(--color-overlay)'),
              color: fullBgText ? '#fff' : (iconColor || 'var(--color-text-3)'),
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className="relative font-black tabular-nums"
        style={{
          fontSize: '2rem',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: fullBgText ? '#ffffff' : 'var(--color-text)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="relative mt-2 text-sm font-medium"
          style={{ color: fullBgText ? 'rgba(255,255,255,0.65)' : 'var(--color-text-4)' }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Wallet summary card ───────────────────────────────────────────────────────
function WalletCard({
  label, amount, subtitle, accentColor, icon,
}: {
  label: string; amount: number; subtitle: string; accentColor: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        padding: '1.5rem',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        borderRight: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Decorative rings */}
      <div className="absolute pointer-events-none" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-35px', right: '-25px' }} />
      <div className="absolute pointer-events-none" style={{ width: '70px', height: '70px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '5px', right: '20px' }} />
      <div className="absolute pointer-events-none" style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-10px', left: '-10px' }} />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-xl"
          style={{ background: 'var(--color-overlay)', color: 'var(--color-text-4)' }}
        >
          Wallet
        </span>
      </div>
      <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-4)' }}>
        {label}
      </div>
      <div
        className="font-black tabular-nums"
        style={{ fontSize: '2rem', letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--color-text)' }}
      >
        ₹{amount.toLocaleString('en-IN')}
      </div>
      <div className="text-sm mt-2" style={{ color: 'var(--color-text-4)' }}>{subtitle}</div>
    </div>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ icon, label, description, to, accentColor }: {
  icon: React.ReactNode; label: string; description: string; to: string; accentColor: string;
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-3xl overflow-hidden flex items-center gap-4 transition-all duration-200"
      style={{
        padding: '1.25rem 1.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Decorative rings */}
      <div className="absolute pointer-events-none" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-30px', right: '-20px' }} />
      <div className="absolute pointer-events-none" style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-15px', right: '30px' }} />
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
        style={{ background: `${accentColor}18`, color: accentColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold t-text" style={{ fontSize: '0.9375rem' }}>{label}</div>
        <div className="text-sm mt-0.5" style={{ color: 'var(--color-text-4)' }}>{description}</div>
      </div>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
        style={{ background: `${accentColor}18`, color: accentColor }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  );
}

// ── Payout slot widget ────────────────────────────────────────────────────────
function PayoutSlotWidget({ slots }: { slots: any[] }) {
  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        padding: '1.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Decorative rings */}
      <div className="absolute pointer-events-none" style={{ width: '130px', height: '130px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-40px', right: '-30px' }} />
      <div className="absolute pointer-events-none" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '5px', right: '30px' }} />
      <div className="absolute pointer-events-none" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-15px', left: '-15px' }} />
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold t-text" style={{ fontSize: '1.125rem' }}>Referral Payout Slots</div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-xl"
          style={{ background: 'rgba(0,102,255,0.1)', color: '#3385ff' }}
        >
          {slots.length} slot{slots.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-4)' }}>
        Each member earns <strong className="text-emerald-400">₹250</strong> when someone joins under you.
      </p>
      {slots.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-4)' }}>
          <UserIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium" style={{ fontSize: '0.9375rem' }}>No payout slots yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-4)' }}>Join the network first to see your slots</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {slots.map((slot: any) => (
            <div
              key={slot.levelDiff}
              className="flex items-center justify-between rounded-2xl p-3.5"
              style={{ background: 'var(--color-overlay)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,102,255,0.1)', color: '#3385ff' }}
                >
                  <UserIcon size={18} />
                </div>
                <div>
                  <div className="font-mono font-bold t-text-2" style={{ fontSize: '0.9375rem' }}>{slot.memberId}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-4)' }}>{slot.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg uppercase"
                  style={{ background: 'rgba(0,102,255,0.1)', color: '#3385ff' }}
                >
                  L{slot.levelDiff}
                </span>
                <span className="text-emerald-400 font-bold" style={{ fontSize: '0.9375rem' }}>+₹250</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TransactionRow({ tx }: { tx: any }) {
  const isCredit = tx.type === 'CREDIT';
  const fieldColors: Record<string, { bg: string; text: string }> = {
    COUPON:   { bg: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
    PURCHASE: { bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa' },
    INCOME:   { bg: 'rgba(16,185,129,0.1)',  text: '#34d399' },
    GST:      { bg: 'rgba(139,92,246,0.1)',  text: '#a78bfa' },
  };
  const fc = fieldColors[tx.field] || { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8' };

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-[var(--color-overlay)]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: isCredit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          color: isCredit ? '#34d399' : '#f87171',
        }}
      >
        <ArrowRightIcon size={16} className={isCredit ? 'rotate-[-90deg]' : 'rotate-90'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold t-text-2 truncate" style={{ fontSize: '0.9rem' }}>
          {tx.note || 'Transaction'}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg uppercase"
            style={{ background: fc.bg, color: fc.text }}
          >
            {tx.field}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-4)' }}>
            {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
      <div
        className="font-mono font-bold shrink-0"
        style={{ fontSize: '0.9375rem', color: isCredit ? '#34d399' : '#f87171' }}
      >
        {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
      </div>
    </div>
  );
}

// ── Welcome banner ────────────────────────────────────────────────────────────
function WelcomeBanner({ user, wallet }: { user: any; wallet: any }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalBalance = (wallet?.couponBalance || 0) + (wallet?.purchaseBalance || 0) + (wallet?.incomeBalance || 0);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      style={{
        padding: '1.75rem 2rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Decorative rings */}
      <div className="absolute pointer-events-none" style={{ width: '160px', height: '160px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-60px', left: '-40px' }} />
      <div className="absolute pointer-events-none" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '-10px', left: '40px' }} />
      {/* Subtle glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at 80% 20%, rgba(0,102,255,0.07), transparent 60%)' }} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Left: greeting + ID */}
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-4)' }}>{greeting}</p>
          <h1 className="font-black t-text mb-3" style={{ fontSize: '1.75rem', lineHeight: 1.15 }}>
            {user?.name || 'Member'}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 font-mono font-bold px-3 py-1.5 rounded-xl text-sm"
              style={{ background: 'rgba(0,102,255,0.1)', color: '#3385ff', border: '1px solid rgba(0,102,255,0.2)' }}
            >
              {user?.memberId}
            </span>
            {user?.mobile && (
              <span
                className="inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-xl text-sm"
                style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)', border: '1px solid var(--color-border)' }}
              >
                {user.mobile}
              </span>
            )}
          </div>
        </div>

        {/* Right: credit card */}
        <div
          className="relative rounded-3xl overflow-hidden shrink-0 flex flex-col justify-between"
          style={{
            width: '300px', height: '175px',
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.45)',
          }}
        >
          {/* Decorative rings */}
          <div className="absolute pointer-events-none" style={{ width: '160px', height: '160px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', top: '-50px', right: '-40px' }} />
          <div className="absolute pointer-events-none" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', top: '-10px', right: '20px' }} />
          <div className="absolute pointer-events-none" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', bottom: '-20px', left: '-15px' }} />

          {/* Top row */}
          <div className="relative flex items-center justify-between mb-3">
            <div>
              <div className="font-black text-white" style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>Plan-I</div>
              <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Digital Wallet</div>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <WalletIcon size={18} className="text-white" />
            </div>
          </div>

          {/* Balance */}
          <div className="relative">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Balance</div>
            <div className="font-black tabular-nums text-white" style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Bottom row */}
          <div className="relative flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="font-mono text-sm font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.75)' }}>
              **** {user?.memberId?.slice(-4) || '0000'}
            </div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : 'MEMBER'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard page ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { memberId, role } = useSelector((s: RootState) => s.auth);

  const { data: user,    isLoading: userLoading   } = useGetMeQuery();
  const { data: wallet,  isLoading: walletLoading  } = useGetWalletQuery();
  const { data: stats,   isLoading: statsLoading   } = useGetNetworkStatsQuery();
  const { data: slots,   isLoading: slotsLoading   } = useGetPayoutSlotsQuery();
  const { data: txData,  isLoading: txLoading      } = useGetTransactionsQuery({ page: 1, limit: 5 });

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      {userLoading || walletLoading
        ? <SkeletonCard height="h-48" />
        : <WelcomeBanner user={{ ...user, memberId }} wallet={wallet} />
      }

      {/* ── Quick Actions ───────────────────────────────────────────────── */}
      <div>
        <div className="section-title">Quick Actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction icon={<GlobeIcon size={20} />}        label="Network Tree"      description="View your referral network"     to="/network"              accentColor="var(--color-primary)" />
          {role === 'ADMIN'
            ? <QuickAction icon={<ShoppingCartIcon size={20} />} label="Manage Products" description="Add, edit & remove products"  to="/admin?tab=products"   accentColor="var(--color-primary)" />
            : <QuickAction icon={<ShoppingCartIcon size={20} />} label="Shop"            description="Browse & buy products"        to="/shop"                 accentColor="var(--color-primary)" />
          }
          <QuickAction icon={<WalletIcon size={20} />}       label="Wallet"            description="Manage your 4 wallets"         to="/wallet"               accentColor="var(--color-primary)" />
          <QuickAction icon={<ChartBarIcon size={20} />}     label="My Reports"        description="Earnings & activity summary"   to="/reports"              accentColor="var(--color-primary)" />
        </div>
      </div>

      {/* ── Network Stats — 4 stat cards ────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} height="h-28" />)}
        </div>
      ) : stats && (
        <div>
          <div className="section-title">Network Overview</div>
          <div className={`grid gap-4 ${role === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {role !== 'ADMIN' && <StatCard label="My Level"     value={stats.level}                    sub="Current tier"     icon={<UserIcon size={16} />}    fullBg="#2563eb" fullBgText />}
            <StatCard label="Direct Refs"  value={stats.direct}                   sub="Direct referrals" icon={<UsersIcon size={16} />}   fullBg="#1e8fe1" fullBgText />
            <StatCard label="Network Size" value={stats.realDownlines}            sub="Total members"    icon={<GlobeIcon size={16} />}   fullBg="#ec7a38" fullBgText />
            {role !== 'ADMIN' && <StatCard label="Cycle"        value={`#${user?.cyclePosition ?? 1}`} sub="Active position"  icon={<RefreshIcon size={16} />} fullBg="#8b5cf6" fullBgText />}
          </div>
        </div>
      )}

      {/* ── Wallet Cards ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0">My Wallets</div>
          <Link to="/wallet" className="flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300 transition-colors" style={{ fontSize: '0.875rem' }}>
            Manage <ChevronRightIcon size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {walletLoading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : (
            <>
              <WalletCard label="Coupon Wallet"   amount={wallet?.couponBalance   ?? 0} subtitle="Up to 50% usage per purchase"  accentColor="var(--color-border-2)"  icon={<TagIcon size={20} />} />
              <WalletCard label="Purchase Wallet" amount={wallet?.purchaseBalance ?? 0} subtitle="2.5% cashback from purchases"   accentColor="var(--color-border-2)"  icon={<ShoppingBagIcon size={20} />} />
              <WalletCard label="Income Wallet"   amount={wallet?.incomeBalance   ?? 0} subtitle="Earned from referral payouts"   accentColor="var(--color-border-2)"  icon={<BanknotesIcon size={20} />} />
              {role === 'ADMIN' && <WalletCard label="GST Wallet"      amount={wallet?.gstBalance      ?? 0} subtitle="Goods & Services Tax tracking"  accentColor="var(--color-border-2)"  icon={<ReceiptIcon size={20} />} />}
            </>
          )}
        </div>
      </div>

      {/* ── Payout Slot Widget ──────────────────────────────────────────── */}
      {slotsLoading
        ? <SkeletonCard height="h-40" />
        : <PayoutSlotWidget slots={slots?.slots || []} />
      }

      {/* ── Recent Transactions ─────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          padding: '1.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Decorative rings */}
        <div className="absolute pointer-events-none" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid var(--color-border)', top: '-35px', right: '-30px' }} />
        <div className="absolute pointer-events-none" style={{ width: '75px', height: '75px', borderRadius: '50%', border: '1px solid var(--color-border)', top: '10px', right: '25px' }} />
        <div className="absolute pointer-events-none" style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'var(--color-overlay)', bottom: '-10px', left: '-10px' }} />
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold t-text" style={{ fontSize: '1.125rem' }}>Recent Transactions</div>
          <Link to="/wallet" className="flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300 transition-colors" style={{ fontSize: '0.875rem' }}>
            View all <ChevronRightIcon size={14} />
          </Link>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 rounded-2xl" />)}
          </div>
        ) : txData?.transactions?.length ? (
          <div className="space-y-1">
            {txData.transactions.map((tx: any) => <TransactionRow key={tx.id} tx={tx} />)}
          </div>
        ) : (
          <div className="text-center py-10" style={{ color: 'var(--color-text-4)' }}>
            <InboxIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium" style={{ fontSize: '0.9375rem' }}>No transactions yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-4)' }}>Your activity will appear here</p>
          </div>
        )}
      </div>

    </div>
  );
}
