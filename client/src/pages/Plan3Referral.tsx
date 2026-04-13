import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { usePlan2GetMeQuery } from '../store/apiSlice';
import { copyToClipboard } from '../utils/clipboard';
import { BoltIcon, UserIcon, SparklesIcon } from '../components/Icons';

export default function Plan3Referral() {
  const { memberId, name: authName, role, planType } = useSelector((s: RootState) => s.auth);
  const adminPlan = useSelector((s: RootState) => s.adminPlan.selected);
  const isAdminInPlan3 = role === 'ADMIN' && adminPlan === 'PLAN3';
  const isPlan3User = planType === 'PLAN2'; // internal planType 'PLAN2' = Plan 3 Investment

  const { data: plan2Me } = usePlan2GetMeQuery(undefined, { skip: !isPlan3User });

  const canRefer = isAdminInPlan3 || (isPlan3User && plan2Me?.canRefer);
  const effectiveMemberId = isPlan3User ? (plan2Me?.memberId || memberId) : memberId;
  const effectiveName = isPlan3User ? (plan2Me?.name || authName) : authName;

  const referralLink = canRefer && effectiveMemberId
    ? `${window.location.origin}/plan3/join?ref=${effectiveMemberId}&name=${encodeURIComponent(effectiveName || '')}`
    : null;

  function copy() {
    if (!referralLink) return;
    copyToClipboard(referralLink, 'Referral link copied!');
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="page-heading">Plan 3 Referral</h1>
        <p className="help-text mt-1">Share your link to onboard new investors.</p>
      </div>

      <div className="card space-y-4">
        <div className="section-title mb-0">Your Referral Link</div>

        {referralLink ? (
          <>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0066ff', color: '#fff' }}>
                  <BoltIcon size={14} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: '#0066ff' }}>
                  {isAdminInPlan3 ? 'Admin Referral Link' : 'Plan 3 Referral'}
                </span>
              </div>
              <div className="text-xs font-mono break-all mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface)', color: 'var(--color-text-3)', border: '1px solid rgba(0,102,255,0.2)' }}>
                {referralLink}
              </div>
              <button onClick={copy} className="w-full text-sm font-bold py-2.5 rounded-xl transition-colors"
                style={{ background: '#0066ff', color: '#ffffff', border: 'none' }}>
                Copy Referral Link
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Your ID</div>
                <div className="font-mono font-black t-text text-sm">{effectiveMemberId}</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Referral Reward</div>
                <div className="font-black text-emerald-500 text-sm">2% monthly</div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl p-5 text-center" style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}>
            <div className="flex justify-center mb-3 t-text-4"><UserIcon size={36} /></div>
            <div className="font-bold t-text mb-1">Referral not enabled yet</div>
            <p className="text-sm t-text-3">
              You can start referring after your investment request is approved by admin.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title mb-3">How it works</div>
        <ol className="space-y-3 text-sm t-text-3">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Share your referral link with someone interested in Plan 3.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>They sign up via your link → get a Plan 3 member ID → verify OTP.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>They submit an investment request (₹50,000 or ₹1,00,000) → admin approves.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span>Once active, you earn <strong>2% of their invested amount every month</strong> as long as they remain invested.</span>
          </li>
        </ol>
        <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <SparklesIcon size={14} /> Example: Referral invests ₹1,00,000 → you earn ₹2,000/month.
          </div>
        </div>
      </div>
    </div>
  );
}
