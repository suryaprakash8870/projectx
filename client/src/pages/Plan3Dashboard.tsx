import { useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../store/store';
import { copyToClipboard } from '../utils/clipboard';
import {
  usePlan2GetMeQuery,
  usePlan2GetWalletQuery,
  usePlan2GetMyInvestmentQuery,
  usePlan2GetNetworkStatsQuery,
  usePlan2GetDownlineQuery,
  usePlan2GetWalletTransactionsQuery,
  usePlan2SubmitInvestmentRequestMutation,
} from '../store/apiSlice';
import {
  UserIcon, BanknotesIcon, TrendingUpIcon, BoltIcon,
  CheckCircleIcon, ClockIcon, ArrowRightIcon,
} from '../components/Icons';

function KPICard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: JSX.Element; color?: string;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      padding: '1.25rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-2">{label}</div>
          <div className="text-3xl font-black t-text">{value}</div>
          {sub && <div className="text-xs t-text-4 mt-1">{sub}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
          background: color || 'var(--color-overlay)',
          color: 'white',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Plan3Dashboard() {
  const { accessToken } = useSelector((s: RootState) => s.auth);
  const { data: me } = usePlan2GetMeQuery(undefined, { skip: !accessToken });
  const { data: wallet } = usePlan2GetWalletQuery(undefined, { skip: !accessToken });
  const { data: investment } = usePlan2GetMyInvestmentQuery(undefined, { skip: !accessToken });
  const { data: stats } = usePlan2GetNetworkStatsQuery(undefined, { skip: !accessToken });
  const { data: downline = [] } = usePlan2GetDownlineQuery(undefined, { skip: !accessToken });
  const { data: txs = [] } = usePlan2GetWalletTransactionsQuery(undefined, { skip: !accessToken });
  const [submitRequest, { isLoading: submitting }] = usePlan2SubmitInvestmentRequestMutation();

  const [showInvestForm, setShowInvestForm] = useState(false);
  const [chosenAmount, setChosenAmount] = useState<50000 | 100000>(50000);

  async function handleSubmit() {
    try {
      await submitRequest({ amount: chosenAmount }).unwrap();
      toast.success('Investment request submitted. Wait for admin approval.');
      setShowInvestForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit request');
    }
  }

  const hasActiveInvestment = (investment?.investments || []).some((i: any) => i.active);
  const pendingRequest = (investment?.requests || []).find((r: any) => r.status === 'PENDING');
  const totalInvested = investment?.totalInvested || 0;
  const expectedMonthly = Math.floor(totalInvested * 0.05);
  const referralLink = me?.canRefer
    ? `${window.location.origin}/plan3/join?ref=${encodeURIComponent(me.memberId)}&name=${encodeURIComponent(me.name || '')}`
    : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome header */}
      <div>
        <h1 className="page-heading">Welcome, {me?.name || 'Investor'}</h1>
        <p className="help-text mt-1">
          Member ID: <span className="font-mono font-bold text-brand-500">{me?.memberId}</span>
          {me?.referrer && <> · Referred by <span className="font-mono">{me.referrer.memberId}</span></>}
        </p>
      </div>

      {/* Status banner */}
      {!hasActiveInvestment && !pendingRequest && (
        <div className="card border-l-4 border-l-amber-500">
          <div className="flex items-start gap-3">
            <ClockIcon size={20} />
            <div className="flex-1">
              <div className="font-bold t-text">Investment required</div>
              <div className="text-sm t-text-3 mt-1">
                Submit an investment request to activate your account and start earning 5% monthly returns.
              </div>
              {!showInvestForm ? (
                <button onClick={() => setShowInvestForm(true)} className="btn-primary mt-3 inline-flex items-center gap-2">
                  Submit Investment Request <ArrowRightIcon size={14} />
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[50000, 100000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setChosenAmount(amt as 50000 | 100000)}
                        className="p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: chosenAmount === amt ? '#0066ff' : 'var(--color-border)',
                          background: chosenAmount === amt ? 'rgba(0,102,255,0.05)' : 'var(--color-surface-2)',
                        }}
                      >
                        <div className="font-black text-2xl t-text">₹{amt.toLocaleString('en-IN')}</div>
                        <div className="text-xs t-text-4 mt-1">
                          Monthly returns: <strong>₹{(amt * 0.05).toLocaleString('en-IN')}</strong>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowInvestForm(false)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
                      {submitting ? 'Submitting...' : `Submit ₹${chosenAmount.toLocaleString('en-IN')} Request`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {pendingRequest && (
        <div className="card border-l-4 border-l-amber-500">
          <div className="flex items-start gap-3">
            <ClockIcon size={20} />
            <div className="flex-1">
              <div className="font-bold t-text">Investment request pending</div>
              <div className="text-sm t-text-3 mt-1">
                Your ₹{pendingRequest.amount.toLocaleString('en-IN')} request is awaiting admin approval.
              </div>
            </div>
          </div>
        </div>
      )}

      {hasActiveInvestment && (
        <div className="card border-l-4 border-l-emerald-500">
          <div className="flex items-start gap-3">
            <CheckCircleIcon size={20} />
            <div className="flex-1">
              <div className="font-bold t-text">Active investor</div>
              <div className="text-sm t-text-3 mt-1">
                Total invested: <strong>₹{totalInvested.toLocaleString('en-IN')}</strong> · Expected monthly: <strong>₹{expectedMonthly.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Wallet Balance" value={`₹${(wallet?.incomeBalance || 0).toLocaleString('en-IN')}`}
          icon={<BanknotesIcon size={18} />} color="#10b981" sub="Monthly + referral earnings" />
        <KPICard label="Total Invested" value={`₹${totalInvested.toLocaleString('en-IN')}`}
          icon={<TrendingUpIcon size={18} />} color="#0066ff" sub="Active investments" />
        <KPICard label="Direct Referrals" value={stats?.directReferrals || 0}
          icon={<UserIcon size={18} />} color="#9333ea" sub={`₹${(stats?.directInvestedTotal || 0).toLocaleString('en-IN')} total invested`} />
        <KPICard label="Monthly Ref Income" value={`₹${(stats?.expectedMonthlyReferralReturn || 0).toLocaleString('en-IN')}`}
          icon={<BoltIcon size={18} />} color="#f59e0b" sub="2% × direct investments" />
      </div>

      {/* Referral link */}
      {referralLink && (
        <div className="card">
          <div className="section-title mb-3">Your Referral Link</div>
          <div className="flex gap-2">
            <input className="input font-mono text-xs flex-1" readOnly value={referralLink} />
            <button onClick={() => copyToClipboard(referralLink, 'Referral link copied!')}
              className="btn-primary px-4">Copy</button>
          </div>
          <p className="text-xs t-text-4 mt-2">
            Share this link — if someone you refer invests, you'll earn 2% of their amount every month.
          </p>
        </div>
      )}

      {/* Direct referrals tree (vertical list) */}
      {downline.length > 0 && (
        <div className="card">
          <div className="section-title mb-3">My Referral Tree ({downline.length} total)</div>
          <div className="space-y-2">
            {downline.map((n: any) => (
              <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                <span className="flex items-center justify-center w-9 h-9 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #e879f9 0%, #7c3aed 100%)', color: 'white' }}>
                  <UserIcon size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-bold text-brand-500">{n.memberId}</div>
                  <div className="text-xs t-text-3 truncate">{n.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-emerald-500">
                    ₹{(n.totalInvested || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] t-text-4">{n.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent wallet transactions */}
      {txs.length > 0 && (
        <div className="card">
          <div className="section-title mb-3">Recent Transactions</div>
          <div className="space-y-1">
            {txs.slice(0, 10).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: t.source === 'MONTHLY_RETURN' ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)' }}>
                    {t.source === 'MONTHLY_RETURN' ? <TrendingUpIcon size={14} /> : <BoltIcon size={14} />}
                  </span>
                  <div>
                    <div className="text-sm font-semibold t-text">{t.note}</div>
                    <div className="text-xs t-text-4">{t.monthKey} · {new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-500">+ ₹{t.amount.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
