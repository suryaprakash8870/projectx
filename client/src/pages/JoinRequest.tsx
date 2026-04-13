import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState } from '../store/store';
import { useGetMyJoiningQuery, useSubmitJoiningMutation, useGetPlan1SubscriptionQuery } from '../store/apiSlice';
import { ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, DocumentIcon, LightbulbIcon, ChevronRightIcon } from '../components/Icons';

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <ClockIcon size={20} />,
  APPROVED: <CheckCircleIcon size={20} />,
  REJECTED: <XCircleIcon size={20} />,
};

export default function JoinRequest() {
  const navigate = useNavigate();
  const { memberId } = useSelector((s: RootState) => s.auth);
  const { data: request, isLoading, refetch } = useGetMyJoiningQuery();
  const [submit, { isLoading: submitting }] = useSubmitJoiningMutation();
  const { data: plan1Sub } = useGetPlan1SubscriptionQuery();
  const [showPlan1Warning, setShowPlan1Warning] = useState(false);

  const hasPlan1Active = plan1Sub?.status === 'ACTIVE';

  async function handleSubmit() {
    if (!hasPlan1Active) {
      setShowPlan1Warning(true);
      return;
    }
    try {
      await submit({}).unwrap();
      toast.success('Joining request submitted!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit request');
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">

      {/* Plan 1 subscription required warning modal */}
      {showPlan1Warning && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <XCircleIcon size={22} />
                </div>
                <div>
                  <div className="font-bold t-text" style={{ fontSize: '1rem' }}>Plan 1 Required</div>
                  <div className="text-xs t-text-4 mt-0.5">Active subscription needed</div>
                </div>
              </div>
              <p className="text-sm t-text-3">
                You need an active <strong className="t-text">Plan 1 subscription (₹250/month)</strong> before you can join Plan 2. Subscribe first, then come back to submit your joining request.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPlan1Warning(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: 'var(--color-overlay)', color: 'var(--color-text-3)', border: '1px solid var(--color-border)' }}>
                  Cancel
                </button>
                <button
                  onClick={() => { setShowPlan1Warning(false); navigate('/plan1/dashboard'); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#0066ff' }}>
                  Go to Plan 1
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <div>
        <h1 className="text-2xl font-bold t-text">Joining Request</h1>
        <p className="t-text-3 text-sm mt-0.5">Pay ₹1,000 to activate your membership</p>
      </div>

      {/* Instructions card */}
      <div className="card border-l-4 border-l-amber-500">
        <div className="section-title">How to Join</div>
        <ol className="space-y-3 text-sm t-text-3">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-505/10 text-amber-600 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Pay <strong className="t-text">₹1,000 cash</strong> to the Plan-I admin</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-505/10 text-amber-600 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>
              Mention your Member ID:{' '}
              <span className="font-mono bg-[var(--color-surface-3)] px-2.5 py-1 rounded-lg text-brand-600 font-bold border border-[var(--color-border)] select-all">{memberId}</span>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-amber-505/10 text-amber-600 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Submit your joining request below and wait for admin approval</span>
          </li>
        </ol>
      </div>

      {/* How it works link */}
      <Link
        to="/how-it-works"
        className="card flex items-center justify-between gap-4 hover:bg-[var(--color-overlay)] transition-colors cursor-pointer"
        style={{ borderColor: 'var(--color-border-2)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <LightbulbIcon size={20} />
          </div>
          <div>
            <div className="font-bold t-text" style={{ fontSize: '0.9375rem' }}>How does the ₹1,000 work?</div>
            <div className="help-text mt-0.5">See the full breakdown, cycle system, FAQ and more</div>
          </div>
        </div>
        <ChevronRightIcon size={18} className="text-brand-400 shrink-0" />
      </Link>

      {/* Status / Submit */}
      {isLoading ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : request ? (
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <div className="section-title">Request Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={STATUS_COLORS[request.status] || 'badge'}>
                  {STATUS_ICON[request.status]} {request.status}
                </span>
              </div>
              <div className="text-xs t-text-4 mt-2">
                Submitted: {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              {request.note && (
                <div className="mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs text-red-600 font-medium">Note: {request.note}</p>
                </div>
              )}
            </div>
            <div className="text-4xl flex justify-end">{STATUS_ICON[request.status]}</div>
          </div>

          {request.status === 'APPROVED' && (
            <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-sm text-emerald-600 font-bold flex items-center gap-2"><SparklesIcon size={16} /> Approved! Your ₹1,000 coupon has been credited.</p>
              <p className="text-xs text-emerald-700/80 mt-1 font-medium">Payouts of ₹250 each have been sent to 3 receivers based on the cycle system.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-6">
          <div className="flex justify-center mb-4"><DocumentIcon size={48} /></div>
          <h2 className="text-lg font-bold t-text mb-2">Ready to Join?</h2>
          <p className="t-text-3 text-sm mb-5">
            After paying ₹1,000 cash, submit your request for admin approval.
          </p>
          <div className="mb-4 p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="text-xs t-text-4 uppercase tracking-widest font-bold mb-2">Your Member ID</div>
            <div className="font-mono text-brand-600 font-black text-2xl select-all">{memberId}</div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Joining Request'}
          </button>
        </div>
      )}
    </div>
  );
}