import { Link } from 'react-router-dom';
import {
  usePlan2AdminStatsQuery,
  usePlan2AdminInvestmentRequestsQuery,
  usePlan2AdminReturnRunsQuery,
} from '../store/apiSlice';
import {
  UsersIcon, CheckCircleIcon, ClockIcon, DocumentIcon,
  BanknotesIcon, TrendingUpIcon, BoltIcon, BriefcaseIcon,
  ArrowRightIcon, ChartBarIcon,
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

export default function Plan2AdminDashboard() {
  const { data: stats, isLoading } = usePlan2AdminStatsQuery();
  const { data: pendingRequests = [] } = usePlan2AdminInvestmentRequestsQuery('PENDING');
  const { data: runs = [] } = usePlan2AdminReturnRunsQuery();
  const latestRun = runs[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-heading">Plan 2 — Investment Program</h1>
        <p className="help-text mt-1">Admin dashboard for the investment plan</p>
      </div>

      {/* KPIs — Members */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Members</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Total Members"    value={isLoading ? '—' : (stats?.totalMembers    || 0)} icon={<UsersIcon size={18} />}         color="#0066ff" sub="All Plan 2 users" />
          <KPICard label="Active Members"   value={isLoading ? '—' : (stats?.activeMembers   || 0)} icon={<CheckCircleIcon size={18} />}   color="#10b981" sub="Investment approved" />
          <KPICard label="Pending Members"  value={isLoading ? '—' : (stats?.pendingMembers  || 0)} icon={<ClockIcon size={18} />}         color="#f59e0b" sub="Awaiting OTP / approval" />
          <KPICard label="Pending Requests" value={isLoading ? '—' : (stats?.pendingRequests || 0)} icon={<DocumentIcon size={18} />}      color="#9333ea" sub="Investment queue" />
        </div>
      </div>

      {/* KPIs — Investments */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Investment & Returns</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Active Investments" value={stats?.totalInvestments || 0}
            icon={<BriefcaseIcon size={18} />} color="#0066ff" sub="Live principal" />
          <KPICard label="Total Invested" value={`₹${(stats?.totalInvestedAmount || 0).toLocaleString('en-IN')}`}
            icon={<BanknotesIcon size={18} />} color="#10b981" sub="Principal held" />
          <KPICard label="Monthly Returns Paid" value={`₹${(stats?.totalMonthlyReturnsPaid || 0).toLocaleString('en-IN')}`}
            icon={<TrendingUpIcon size={18} />} color="#9333ea" sub="5% × investments" />
          <KPICard label="Referral Returns Paid" value={`₹${(stats?.totalReferralReturnsPaid || 0).toLocaleString('en-IN')}`}
            icon={<BoltIcon size={18} />} color="#f59e0b" sub="2% × direct referrals" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin?tab=requests"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Pending Approvals</div>
            <div className="text-2xl font-black t-text">{pendingRequests.length} requests</div>
            <div className="text-xs t-text-3 mt-1">Review and approve investment requests</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=returns"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Monthly Returns</div>
            <div className="text-2xl font-black t-text">{stats?.totalRunsCompleted || 0} runs</div>
            <div className="text-xs t-text-3 mt-1">
              {latestRun ? `Last: ${latestRun.monthKey}` : 'No distributions yet'}
            </div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=members"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">All Members</div>
            <div className="text-2xl font-black t-text">{stats?.totalMembers || 0} total</div>
            <div className="text-xs t-text-3 mt-1">View and search Plan 2 members</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>
      </div>

      {/* Info card */}
      <div className="card border-l-4 border-l-brand-500">
        <div className="flex items-start gap-3">
          <ChartBarIcon size={20} />
          <div className="text-sm t-text-3">
            <div className="font-bold t-text mb-1">About Plan 2</div>
            <p>
              The Investment Program is completely separate from Plan 1. Members join via a referral
              link, invest ₹50,000 or ₹1,00,000, and receive <strong>5% monthly returns</strong>.
              Direct referrers earn <strong>2% monthly</strong> on each referred investor's principal.
              Returns are distributed manually by admin each month from the <em>Monthly Returns</em> tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
