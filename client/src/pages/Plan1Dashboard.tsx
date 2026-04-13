import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../store/store';
import {
  useGetPlan1SubscriptionQuery,
  useSubscribePlan1Mutation,
} from '../store/apiSlice';
import {
  CheckCircleIcon, ClockIcon, XCircleIcon, RefreshIcon,
  BanknotesIcon, BoltIcon, UserIcon,
} from '../components/Icons';

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Plan1Dashboard() {
  const navigate = useNavigate();
  const { name } = useSelector((s: RootState) => s.auth);
  const { data: sub, isLoading, refetch } = useGetPlan1SubscriptionQuery();
  const [subscribe, { isLoading: subscribing }] = useSubscribePlan1Mutation();

  const daysLeft = sub?.status === 'ACTIVE' ? daysUntil(sub.expiresAt) : null;
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7;
  const showRenewOption = showExpiryWarning;

  async function handleSubscribe() {
    try {
      await subscribe(undefined).unwrap();
      toast.success('Subscription request submitted! Awaiting admin approval.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit request');
    }
  }

  const statusConfig = {
    ACTIVE:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: <CheckCircleIcon size={18} />, label: 'Active' },
    PENDING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: <ClockIcon size={18} />,        label: 'Pending Approval' },
    EXPIRED:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   icon: <XCircleIcon size={18} />,      label: 'Expired' },
    REJECTED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   icon: <XCircleIcon size={18} />,      label: 'Rejected' },
  };

  const cfg = sub ? statusConfig[sub.status as keyof typeof statusConfig] : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold t-text">Plan 1 — Subscription</h1>
        <p className="t-text-3 text-sm mt-0.5">₹250/month · Platform access + 500 GTC coins</p>
      </div>

      {/* Expiry warning banner */}
      {showExpiryWarning && (
        <div className="rounded-2xl p-4 border flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className="shrink-0 mt-0.5" style={{ color: '#ef4444' }}><RefreshIcon size={20} /></div>
          <div className="flex-1">
            <div className="font-bold" style={{ color: '#ef4444', fontSize: '0.9375rem' }}>
              Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
            </div>
            <p className="text-sm t-text-3 mt-0.5">
              Renew now to avoid interruption. Your plan continues seamlessly if you renew before expiry.
            </p>
            {showRenewOption && sub?.status !== 'PENDING' && (
              <button onClick={handleSubscribe} disabled={subscribing}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm text-white"
                style={{ background: '#ef4444', opacity: subscribing ? 0.7 : 1 }}>
                {subscribing ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</> : 'Renew Now — ₹250'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="section-title mb-0">Subscription Status</div>
          {cfg && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
              {cfg.icon} {cfg.label}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="skeleton h-24 rounded-2xl" />
        ) : sub?.status === 'ACTIVE' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider t-text-4">Subscribed Since</div>
              <div className="font-mono font-bold t-text mt-1">
                {new Date(sub.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider t-text-4">Expires On</div>
              <div className="font-mono font-bold t-text mt-1"
                style={{ color: showExpiryWarning ? '#ef4444' : undefined }}>
                {new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        ) : sub?.status === 'PENDING' ? (
          <div className="text-sm t-text-3">
            Your subscription request is awaiting admin approval. You'll be notified once approved.
          </div>
        ) : sub?.status === 'EXPIRED' ? (
          <div>
            <p className="text-sm t-text-3 mb-3">Your subscription expired on {new Date(sub.expiresAt).toLocaleDateString('en-IN')}. Renew to restore access.</p>
            <button onClick={handleSubscribe} disabled={subscribing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white"
              style={{ background: '#0066ff', opacity: subscribing ? 0.7 : 1 }}>
              {subscribing ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</> : 'Renew Subscription — ₹250'}
            </button>
          </div>
        ) : sub?.status === 'REJECTED' ? (
          <div>
            <p className="text-sm t-text-3 mb-2">Your last request was rejected{sub.note ? `: "${sub.note}"` : ''}.</p>
            <button onClick={handleSubscribe} disabled={subscribing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white"
              style={{ background: '#0066ff', opacity: subscribing ? 0.7 : 1 }}>
              {subscribing ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</> : 'Re-apply — ₹250'}
            </button>
          </div>
        ) : (
          // No subscription at all
          <div>
            <p className="text-sm t-text-3 mb-3">
              Hello {name}! Subscribe to Plan 1 to unlock the platform and earn <strong className="t-text">500 GTC coins</strong>.
            </p>
            <button onClick={handleSubscribe} disabled={subscribing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white"
              style={{ background: '#0066ff', opacity: subscribing ? 0.7 : 1 }}>
              {subscribing ? <><RefreshIcon size={13} className="animate-spin" /> Processing…</> : 'Subscribe Now — ₹250/month'}
            </button>
          </div>
        )}
      </div>

      {/* What you get */}
      <div className="card">
        <div className="section-title mb-3">What Plan 1 Includes</div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: <BanknotesIcon size={20} />, title: '₹250 / month', desc: 'Flat monthly subscription fee', color: '#0066ff' },
            { icon: <BoltIcon size={20} />, title: '500 GTC Coins', desc: 'Credited on each subscription payment', color: '#f59e0b' },
            { icon: <UserIcon size={20} />, title: 'Plan 2 Access', desc: 'Required to join the referral program', color: '#10b981' },
          ].map(item => (
            <div key={item.title} className="rounded-2xl p-4 border"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <div className="mb-2" style={{ color: item.color }}>{item.icon}</div>
              <div className="font-bold t-text text-sm">{item.title}</div>
              <div className="text-xs t-text-4 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card" style={{ opacity: 0.7 }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="section-title mb-0">Plan 1 Referral Program</div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(0,102,255,0.1)', color: '#0066ff', border: '1px solid rgba(0,102,255,0.2)' }}>
            Coming Soon
          </span>
        </div>
        <p className="text-sm t-text-3">
          Earn rewards by referring others to subscribe to Plan 1. Referral commissions, cashback offers and more will be available in the next update.
        </p>
      </div>

      {/* Navigate to Plan 2 */}
      {sub?.status === 'ACTIVE' && (
        <div className="card flex items-center justify-between gap-4">
          <div>
            <div className="font-bold t-text">Ready for Plan 2 — Referral Program?</div>
            <div className="text-sm t-text-3 mt-0.5">Your active subscription qualifies you to join the referral program.</div>
          </div>
          <button onClick={() => navigate('/join-request')}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white"
            style={{ background: '#0066ff' }}>
            Join Plan 2
          </button>
        </div>
      )}
    </div>
  );
}
