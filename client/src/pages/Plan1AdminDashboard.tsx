import { Link } from 'react-router-dom';
import {
  useGetPlan1AdminStatsQuery,
  useGetPlan1AdminSubscriptionsQuery,
} from '../store/apiSlice';
import {
  UsersIcon, CheckCircleIcon, ClockIcon, XCircleIcon,
  BanknotesIcon, BriefcaseIcon, ReceiptIcon,
  ArrowRightIcon, ChartBarIcon, ShoppingBagIcon,
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

function RevenueCard({ label, value, sub, icon, gradient }: {
  label: string; value: number; sub: string; icon: JSX.Element; gradient: string;
}) {
  return (
    <div className="relative rounded-3xl overflow-hidden" style={{
      padding: '1.5rem',
      background: gradient,
      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
      color: 'white',
    }}>
      {/* decorative rings */}
      <div className="absolute pointer-events-none" style={{ width: 140, height: 140, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)', top: -40, right: -30 }} />
      <div className="absolute pointer-events-none" style={{ width: 90, height: 90, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', top: 10, right: 30 }} />
      <div className="absolute pointer-events-none" style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: -15, left: -10 }} />

      <div className="relative flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
          {icon}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</div>
      </div>
      <div className="relative text-4xl font-black leading-none mb-2">₹{value.toLocaleString('en-IN')}</div>
      <div className="relative text-xs font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>{sub}</div>
    </div>
  );
}

export default function Plan1AdminDashboard() {
  const { data: stats, isLoading } = useGetPlan1AdminStatsQuery();
  const { data: pendingSubs = [] } = useGetPlan1AdminSubscriptionsQuery({ status: 'PENDING' });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-heading">Plan 1 — Monthly Subscription</h1>
        <p className="help-text mt-1">Admin dashboard for ₹250/month subscription management</p>
      </div>

      {/* KPIs — Subscriptions */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Subscriptions</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Total"   value={isLoading ? '—' : (stats?.total   || 0)} icon={<UsersIcon size={18} />}       color="#0066ff" sub="All subscriptions" />
          <KPICard label="Active"  value={isLoading ? '—' : (stats?.active  || 0)} icon={<CheckCircleIcon size={18} />} color="#10b981" sub="Currently active" />
          <KPICard label="Pending" value={isLoading ? '—' : (stats?.pending || 0)} icon={<ClockIcon size={18} />}       color="#f59e0b" sub="Awaiting approval" />
          <KPICard label="Expired" value={isLoading ? '—' : (stats?.expired || 0)} icon={<XCircleIcon size={18} />}     color="#ef4444" sub="Past subscriptions" />
        </div>
      </div>

      {/* KPIs — Revenue */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-3">Revenue</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RevenueCard label="GST Collected" value={stats?.totalGst || 0}
            sub="18% GST · ₹45 per sub" icon={<ReceiptIcon size={22} />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" />
          <RevenueCard label="Subscription Income" value={stats?.totalSubscriptionIncome || 0}
            sub="Company income · ₹205 per sub" icon={<BanknotesIcon size={22} />}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)" />
          <RevenueCard label="Total Revenue" value={stats?.totalRevenue || 0}
            sub={`From ${stats?.approvedCount || 0} approved subscriptions`} icon={<BriefcaseIcon size={22} />}
            gradient="linear-gradient(135deg, #0066ff 0%, #0047b3 100%)" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin?tab=subscriptions"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Pending Subscriptions</div>
            <div className="text-2xl font-black t-text">{pendingSubs.length} requests</div>
            <div className="text-xs t-text-3 mt-1">Review and approve subscription requests</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=members"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">All Members</div>
            <div className="text-2xl font-black t-text">{stats?.total || 0} total</div>
            <div className="text-xs t-text-3 mt-1">View and search all members</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>

        <Link to="/admin?tab=products"
          className="card hover:shadow-lg transition-all flex items-center justify-between group">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest t-text-4 mb-1">Products</div>
            <div className="text-2xl font-black t-text"><ShoppingBagIcon size={24} /></div>
            <div className="text-xs t-text-3 mt-1">Manage shop products & categories</div>
          </div>
          <ArrowRightIcon size={20} />
        </Link>
      </div>

      {/* Info card */}
      <div className="card border-l-4 border-l-brand-500">
        <div className="flex items-start gap-3">
          <ChartBarIcon size={20} />
          <div className="text-sm t-text-3">
            <div className="font-bold t-text mb-1">About Plan 1</div>
            <p>
              Plan 1 is the monthly subscription program (₹250/month). Members subscribe to use the platform.
              On admin approval, <strong>500 GTC coins</strong> are credited to the subscriber.
              Revenue is split: <strong>₹45 GST</strong> (18%) goes to the GST wallet and
              <strong> ₹205</strong> goes to the admin subscription income wallet.
              An active Plan 1 subscription is required before a member can join Plan 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
